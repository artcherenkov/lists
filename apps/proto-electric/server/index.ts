import http from 'node:http'
import { Readable } from 'node:stream'
import pg from 'pg'
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet, jwtVerify } from 'jose'

const PORT = 13100
const ELECTRIC = 'http://127.0.0.1:13000'
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:proto@127.0.0.1:15432/proto' })

const config = { version: 1, minVersion: 1 }

const { publicKey, privateKey } = await generateKeyPair('EdDSA', { extractable: true })
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'EdDSA', use: 'sig' }
const jwks = { keys: [jwk] }
const verifyKeys = createLocalJWKSet(jwks)

async function sign(sub: string) {
  return new SignJWT({}).setProtectedHeader({ alg: 'EdDSA', kid: 'k1' }).setSubject(sub).setIssuedAt().setExpirationTime('1h').sign(privateKey)
}

class HttpError extends Error {
  status: number
  headers: Record<string, string>
  constructor(status: number, message: string, headers: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.headers = headers
  }
}

async function auth(req: http.IncomingMessage): Promise<string> {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) throw new HttpError(401, 'no token')
  try {
    const { payload } = await jwtVerify(h.slice(7), verifyKeys, { algorithms: ['EdDSA'] })
    if (!payload.sub) throw new Error('no sub')
    return payload.sub
  } catch {
    throw new HttpError(401, 'bad token')
  }
}

function checkVersion(raw: unknown) {
  const v = Number(raw)
  if (!Number.isInteger(v)) throw new HttpError(400, 'no data version')
  if (v < config.minVersion) throw new HttpError(426, 'update required', { 'x-reason': 'update-required' })
  if (v > config.version) throw new HttpError(503, 'server is older, wait', { 'retry-after': '2', 'x-reason': 'server-older' })
  return v
}

// ---------- shape proxy (reads) ----------
const SHAPES: Record<string, { table: string; where: string }> = {
  items: { table: 'items', where: 'user_id = $1' },
  marks: { table: 'marks', where: 'user_id = $1' },
  shows: {
    table: 'shows',
    where: `id IN (SELECT tmdb_id FROM items WHERE user_id = $1 AND kind = 'series' AND deleted_at IS NULL AND tmdb_id IS NOT NULL)`,
  },
}
const PASS = new Set(['offset', 'handle', 'live', 'cursor', 'live_sse', 'log', 'replica', 'experimental_live_sse', 'cursor_', 'subset__limit', 'subset__offset', 'subset__order_by'])

async function shapeProxy(req: http.IncomingMessage, res: http.ServerResponse, url: URL, name: string) {
  const sub = await auth(req)
  checkVersion(req.headers['x-data-version'])
  const shape = SHAPES[name]
  if (!shape) throw new HttpError(404, 'no shape')
  const up = new URL('/v1/shape', ELECTRIC)
  for (const [k, v] of url.searchParams) if (PASS.has(k)) up.searchParams.set(k, v)
  up.searchParams.set('table', shape.table)
  up.searchParams.set('where', shape.where)
  up.searchParams.set('params[1]', sub)
  const r = await fetch(up, { headers: { accept: 'application/json' } })
  const headers: Record<string, string> = {}
  r.headers.forEach((v, k) => {
    if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k)) headers[k] = v
  })
  headers['cache-control'] = 'no-store'
  res.writeHead(r.status, headers)
  if (r.body) Readable.fromWeb(r.body as never).pipe(res)
  else res.end()
}

// ---------- write handler ----------
const STATUSES = ['want', 'watching', 'watched', 'waiting']
const ITEM_TOUCHABLE = ['status', 'rating', 'stars', 'watched_month', 'note', 'title', 'kind', 'updated_at', 'deleted_at']
const MARK_STATES = ['watching', 'watched']

class Reject extends Error {
  field: string
  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

function validateItemFields(f: Record<string, any>, kind: string | null, manual: boolean, version: number, creating = false) {
  if ('status' in f && !STATUSES.includes(f.status)) throw new Reject('status', 'bad status')
  if (f.status === 'waiting' && kind !== 'series') throw new Reject('status', 'waiting only for series')
  if (version === 1 && f.rating != null && !(Number.isInteger(f.rating) && f.rating >= 1 && f.rating <= 10)) throw new Reject('rating', 'rating 1-10')
  if (version >= 2 && f.stars != null && !(Number.isInteger(f.stars) && f.stars >= 1 && f.stars <= 5)) throw new Reject('stars', 'stars 1-5')
  if (typeof f.title === 'string' && f.title.length > 200) throw new Reject('title', 'title too long')
  if (!creating && ('title' in f || 'kind' in f) && !manual) throw new Reject('title', 'title/kind only for manual items')
  if (typeof f.note === 'string' && f.note.length > 2000) throw new Reject('note', 'note too long')
}

async function applyMutate(sub: string, body: any) {
  const version = checkVersion(body.dataVersion)
  if (body.accountId !== sub) throw new HttpError(403, 'account mismatch')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ins = await client.query('INSERT INTO applied_keys(key) VALUES ($1) ON CONFLICT DO NOTHING RETURNING key', [body.idempotencyKey])
    if (ins.rowCount === 0) {
      await client.query('ROLLBACK')
      return { txid: null, duplicate: true }
    }
    for (const m of body.mutations) {
      if (m.table === 'items') await applyItem(client, sub, m, version)
      else if (m.table === 'marks') await applyMark(client, sub, m)
      else throw new Reject('table', 'unknown table')
    }
    const tx = await client.query('SELECT pg_current_xact_id()::xid::text AS txid')
    await client.query('COMMIT')
    return { txid: Number(tx.rows[0].txid) }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}

async function applyItem(client: pg.PoolClient, sub: string, m: any, version: number) {
  const id = m.key
  if (m.type === 'insert') {
    const row = m.modified
    const manual = row.tmdb_id == null
    validateItemFields(row, row.kind, manual, version, true)
    if (!['movie', 'series'].includes(row.kind)) throw new Reject('kind', 'bad kind')
    const existing = await client.query('SELECT user_id FROM items WHERE id = $1', [id])
    if (existing.rows[0] && existing.rows[0].user_id !== sub) throw new HttpError(403, 'id belongs to another account')
    const count = await client.query('SELECT count(*)::int AS n FROM items WHERE user_id = $1', [sub])
    if (count.rows[0].n >= 1000) throw new Reject('limit', 'too many items')
    await client.query(
      `INSERT INTO items (id, user_id, kind, title, status, rating, stars, watched_month, note, tmdb_id, year, poster, added_at, updated_at, fmt)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
      [id, sub, row.kind, row.title, row.status ?? 'want', row.rating ?? null, row.stars ?? null, row.watched_month ?? null, row.note ?? null, row.tmdb_id ?? null, row.year ?? null, row.poster ?? null, row.added_at, row.updated_at, version],
    )
    return
  }
  if (m.type === 'update') {
    const changes = m.changes as Record<string, any>
    const cur = await client.query('SELECT user_id, kind, tmdb_id FROM items WHERE id = $1', [id])
    if (!cur.rows[0] || cur.rows[0].user_id !== sub) throw new Reject('id', 'not found')
    const cols = Object.keys(changes)
    for (const c of cols) if (!ITEM_TOUCHABLE.includes(c)) throw new Reject(c, 'field not editable')
    const kind = changes.kind ?? cur.rows[0].kind
    validateItemFields(changes, kind, cur.rows[0].tmdb_id == null, version)
    if (cols.length === 0) return
    const sets = cols.map((c, i) => `${c} = $${i + 3}`).join(', ')
    await client.query(`UPDATE items SET ${sets} WHERE id = $1 AND user_id = $2`, [id, sub, ...cols.map((c) => changes[c])])
    return
  }
  throw new Reject('type', 'hard delete of items not allowed')
}

async function applyMark(client: pg.PoolClient, sub: string, m: any) {
  const id = m.key
  if (m.type === 'delete') {
    await client.query('DELETE FROM marks WHERE id = $1 AND user_id = $2', [id, sub])
    return
  }
  const row = m.modified
  if (!MARK_STATES.includes(row.state)) throw new Reject('state', 'bad state')
  if (id !== `${row.item_id}:${row.season}`) throw new Reject('id', 'bad mark id')
  const item = await client.query('SELECT user_id FROM items WHERE id = $1', [row.item_id])
  if (item.rows[0]?.user_id !== sub) throw new Reject('item_id', 'item not yours')
  const own = await client.query('SELECT user_id FROM marks WHERE id = $1', [id])
  if (own.rows[0] && own.rows[0].user_id !== sub) throw new HttpError(403, 'id belongs to another account')
  // upsert by device-given key: only the touched field (state) is written on conflict
  await client.query(
    `INSERT INTO marks (id, user_id, item_id, season, state, updated_at) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at WHERE marks.user_id = $2`,
    [id, sub, row.item_id, row.season, row.state, row.updated_at],
  )
}

// ---------- http ----------
function cors(res: http.ServerResponse) {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('access-control-allow-headers', 'authorization,content-type,x-data-version')
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS')
  res.setHeader('access-control-expose-headers', 'electric-cursor,electric-handle,electric-has-data,electric-offset,electric-schema,electric-up-to-date,electric-internal-known-error,retry-after,x-reason')
}

async function readBody(req: http.IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}
}

// Per-device network cut for tests: requests under /~<tag>/ are the device's traffic; the cut resets sockets like a lost network.
const blocks = new Map<string, string>()
const live = new Map<string, Set<http.ServerResponse>>()

const server = http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') return void res.writeHead(204).end()
  let rawUrl = req.url!
  const tagMatch = rawUrl.match(/^\/~([\w-]+)(\/.*)$/)
  if (tagMatch) {
    const tag = tagMatch[1]!
    rawUrl = tagMatch[2]!
    const mode = blocks.get(tag)
    if (mode === 'all' || (mode === 'mutate' && rawUrl.startsWith('/api/mutate'))) return void req.socket.destroy()
    if (!live.has(tag)) live.set(tag, new Set())
    live.get(tag)!.add(res)
    res.on('close', () => live.get(tag)?.delete(res))
  }
  req.url = rawUrl
  const url = new URL(req.url!, `http://${req.headers.host}`)
  if (url.pathname === '/admin/block') {
    const tag = url.searchParams.get('tag')!
    const mode = url.searchParams.get('mode')!
    if (mode === 'off') blocks.delete(tag)
    else blocks.set(tag, mode)
    if (mode === 'all') for (const r of live.get(tag) ?? []) r.socket?.destroy()
    return void res.writeHead(200).end('ok')
  }
  try {
    if (url.pathname === '/jwks') return void res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(jwks))
    if (url.pathname === '/dev/token') return void res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ token: await sign(url.searchParams.get('sub') ?? 'alice') }))
    if (url.pathname === '/admin/config') {
      const b = req.method === 'POST' ? await readBody(req) : {}
      Object.assign(config, b)
      return void res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(config))
    }
    if (url.pathname === '/api/ping') return void res.writeHead(200).end('ok')
    const m = url.pathname.match(/^\/shape\/(\w+)$/)
    if (m && req.method === 'GET') return await shapeProxy(req, res, url, m[1])
    const rm = url.pathname.match(/^\/row\/(items|marks)\/([\w:-]+)$/)
    if (rm) {
      const sub = await auth(req)
      checkVersion(req.headers['x-data-version'])
      const q = await pool.query(`SELECT * FROM ${rm[1]} WHERE id = $1 AND user_id = $2`, [rm[2], sub])
      if (!q.rows[0]) throw new HttpError(404, 'no row')
      return void res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(q.rows[0]))
    }
    if (url.pathname === '/api/mutate' && req.method === 'POST') {
      const sub = await auth(req)
      const body = await readBody(req)
      const r = await applyMutate(sub, body)
      return void res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(r))
    }
    res.writeHead(404).end('not found')
  } catch (e) {
    if (e instanceof HttpError) return void res.writeHead(e.status, { 'content-type': 'application/json', ...e.headers }).end(JSON.stringify({ error: e.message }))
    if (e instanceof Reject) return void res.writeHead(422, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'rejected', field: e.field, message: e.message }))
    console.error(e)
    res.writeHead(500).end(JSON.stringify({ error: String(e) }))
  }
})
server.listen(PORT, '127.0.0.1', () => console.log('server on', PORT))
