// Serves dist-<current> on 14173; GET /__build?name=v2 switches the "deployed" build.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.dirname(fileURLToPath(import.meta.url)) + '/..'
let current = process.env.BUILD ?? 'v1'
const types = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css' }
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname === '/__build') {
    if (url.searchParams.get('name')) current = url.searchParams.get('name')
    return res.end(current)
  }
  let p = path.join(root, `dist-${current}`, url.pathname === '/' ? 'index.html' : url.pathname)
  if (!p.startsWith(path.join(root, `dist-${current}`)) || !fs.existsSync(p)) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
  fs.createReadStream(p).pipe(res)
}).listen(14173, '127.0.0.1', () => console.log('static on 14173'))
