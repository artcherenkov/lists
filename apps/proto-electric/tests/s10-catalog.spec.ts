import { test, expect } from '@playwright/test'
import { newDevice, resetDb, items, shows, outbox, until, db, closeDevice, restartDevice, launch, closeAll } from './helpers.ts'

test.afterEach(closeAll)

test('s10: catalog show follows the person records', async ({}, info) => {
  await resetDb()
  for (let i = 1; i <= 20; i++) await db.query(`INSERT INTO shows (id,title,seasons) VALUES ($1,$2,'[1,2]')`, [i, `Show ${i}`])
  const d = await newDevice(info.project.name, 'a')
  expect((await shows(d)).length).toBe(0)
  const id = await d.page.evaluate(() => (window as any).app.addItem({ title: 'Show 5 item', kind: 'series', tmdb_id: 5 }))
  await until(() => shows(d), (l) => l.length === 1 && l[0].id === 5)
  const id2 = await d.page.evaluate(() => (window as any).app.addItem({ title: 'Show 6 item', kind: 'series', tmdb_id: 6 }))
  await until(() => shows(d), (l) => l.length === 2)
  // server edit of the catalog row reaches the device
  await db.query(`UPDATE shows SET title='Show 5 renamed', continuing=false WHERE id=5`)
  await until(() => shows(d), (l) => l.find((s: any) => s.id === 5)?.title === 'Show 5 renamed')
  // removal (soft) of the record: the show leaves
  await d.page.evaluate((id) => (window as any).app.softDelete(id), id)
  await until(() => shows(d), (l) => l.length === 1 && l[0].id === 6)
  // survives reopen, and moves while the device is closed
  await restartDevice(d)
  expect((await until(() => shows(d), (l) => l.length === 1, 5000)).map((s: any) => s.id)).toEqual([6])
  await closeDevice(d)
  await db.query(`UPDATE items SET deleted_at = now() WHERE id = $1`, [id2])
  await launch(d)
  const d2 = d
  await until(() => shows(d2), (l) => l.length === 0)
  await closeDevice(d2)
})
