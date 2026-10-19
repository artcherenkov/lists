import { boot } from './data.ts'
const q = new URLSearchParams(location.search)
const out = document.getElementById('out')!
;(async () => {
  const t0 = performance.now()
  try {
    ;(window as any).app = await boot({
      account: q.get('user') ?? 'alice',
      api: 'http://127.0.0.1:13100' + (q.get('dev') ? '/~' + q.get('dev') : ''),
      dbName: q.get('db') ?? undefined,
      schemaVersion: Number(q.get('schema') ?? 1),
    })
    out.textContent = `ready ${Math.round(performance.now() - t0)}ms`
    ;(window as any).appReady = true
  } catch (e: any) {
    out.textContent = 'boot failed: ' + (e?.stack ?? e)
    ;(window as any).bootError = (e?.name ?? '') + ': ' + (e?.message ?? '') + ' | ' + (e?.code ?? '') + ' | ' + String(e?.stack ?? e)
  }
})()
