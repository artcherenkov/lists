import { test, expect } from '@playwright/test'
import { newDevice, resetDb, items, marks, outbox, until, db, goOffline, goOnline, closeDevice, closeAll } from './helpers.ts'

test.afterEach(closeAll)

async function setup(name: string) {
  await resetDb()
  const a = await newDevice(name, 'a')
  const b = await newDevice(name, 'b')
  const sid = await a.page.evaluate(() => (window as any).app.addItem({ title: 'Severance', kind: 'series', tmdb_id: 95396 }))
  await until(() => items(b), (l) => l.some((r: any) => r.id === sid))
  return { a, b, sid }
}

test('s5a: a mark of one season from two devices lands in one row', async ({}, info) => {
  const { a, b, sid } = await setup(info.project.name)
  await goOffline(a)
  await goOffline(b)
  await a.page.evaluate((sid) => (window as any).app.setMark(sid, 1, 'watched'), sid)
  await b.page.evaluate((sid) => (window as any).app.setMark(sid, 1, 'watching'), sid)
  await until(() => outbox(a), (o) => o.length === 1)
  await until(() => outbox(b), (o) => o.length === 1)
  await goOnline(a)
  await until(async () => (await db.query('SELECT state FROM marks')).rows, (r) => r.length === 1 && r[0].state === 'watched')
  await goOnline(b)
  await until(async () => (await db.query('SELECT state FROM marks')).rows, (r) => r.length === 1 && r[0].state === 'watching')
  expect((await db.query('SELECT count(*)::int n FROM marks')).rows[0].n).toBe(1)
  for (const d of [a, b]) await until(() => marks(d), (m) => m.length === 1 && m[0].state === 'watching' && !m[0].$hasPendingWrites)
  await closeDevice(a)
  await closeDevice(b)
})

test('s5b: an edit of a mark that another device deleted is not lost', async ({}, info) => {
  const { a, b, sid } = await setup(info.project.name)
  await a.page.evaluate((sid) => (window as any).app.setMark(sid, 1, 'watching'), sid)
  await until(() => marks(b), (m) => m.length === 1)
  await goOffline(b)
  await a.page.evaluate((sid) => (window as any).app.removeMark(sid, 1), sid)
  await until(async () => (await db.query('SELECT 1 FROM marks')).rowCount, (n) => n === 0)
  await b.page.evaluate((sid) => (window as any).app.setMark(sid, 1, 'watched'), sid) // update of a row that no longer exists on the server
  await until(() => outbox(b), (o) => o.length === 1)
  expect((await outbox(b))[0].muts[0].type).toBe('update')
  await goOnline(b)
  await until(async () => (await db.query('SELECT state FROM marks')).rows, (r) => r.length === 1 && r[0].state === 'watched')
  await until(() => marks(a), (m) => m.length === 1 && m[0].state === 'watched')
  await closeDevice(a)
  await closeDevice(b)
})
