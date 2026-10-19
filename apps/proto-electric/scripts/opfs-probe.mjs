import { webkit, chromium } from '@playwright/test'
const code = `
const out = {};
try {
  const root = await navigator.storage.getDirectory();
  out.dir = 'ok';
  const fh = await root.getFileHandle('probe.bin', { create: true });
  out.file = 'ok';
  out.hasSync = typeof fh.createSyncAccessHandle;
  const h = await fh.createSyncAccessHandle();
  h.write(new Uint8Array([1,2,3]), {at:0}); h.flush(); h.close();
  out.sync = 'ok';
} catch (e) { out.err = e.name + ': ' + e.message; }
postMessage(out);
`
for (const [name, bt] of [['webkit', webkit], ['chromium', chromium]]) {
  for (const mode of ['ephemeral', 'persistent']) {
    let ctx, browser
    if (mode === 'ephemeral') { browser = await bt.launch(); ctx = await browser.newContext() }
    else { ctx = await bt.launchPersistentContext('/tmp/el-pw-' + name) }
    const page = await ctx.newPage()
    await page.goto('http://127.0.0.1:14173/')
    const r = await page.evaluate(async (code) => {
      const blob = new Blob([code], { type: 'text/javascript' })
      const w = new Worker(URL.createObjectURL(blob), { type: 'module' })
      return await new Promise((res) => { w.onmessage = (e) => res(e.data); w.onerror = (e) => res({ werr: String(e.message) }) })
    }, code)
    console.log(name, mode, JSON.stringify(r))
    await ctx.close(); if (browser) await browser.close()
  }
}
