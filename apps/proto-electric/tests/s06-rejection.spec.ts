import { test, expect } from '@playwright/test'
import { newDevice, resetDb, items, outbox, until, db, goOffline, goOnline, closeDevice, closeAll } from './helpers.ts'

test.afterEach(closeAll)

test('s6: server rejects one edit; the queue goes on, the client learns, the edit is rolled back', async ({}, info) => {
  await resetDb()
  const d = await newDevice(info.project.name, 'a')
  const id = await d.page.evaluate(() => (window as any).app.addItem({ title: 'Dune', kind: 'movie', rating: 6, note: 'n' }))
  await until(() => outbox(d), (o) => o.length === 0)
  await until(async () => (await db.query('SELECT 1 FROM items WHERE id=$1', [id])).rowCount, (n) => n === 1)
  await goOffline(d)
  await d.page.evaluate((id) => {
    const a = (window as any).app
    a.edit(id, { note: 'first ok' })
    a.edit(id, { rating: 99 }) // v1 allows 1..10 only
    a.edit(id, { status: 'watching' })
  }, id)
  await until(() => outbox(d), (o) => o.length === 3)
  expect((await items(d))[0].rating).toBe(99) // optimistic until the answer
  await goOnline(d)
  await until(() => outbox(d), (o) => o.length === 0)
  const row = (await db.query('SELECT note, rating, status FROM items WHERE id=$1', [id])).rows[0]
  expect(row).toEqual({ note: 'first ok', rating: 6, status: 'watching' })
  const local = (await until(() => items(d), (l) => l.find((r: any) => r.id === id)?.status === 'watching')).find((r: any) => r.id === id)
  expect(local.rating).toBe(6)
  const rej = await d.page.evaluate(() => (window as any).app.state.rejections)
  console.log('rejections:', JSON.stringify(rej))
  expect(rej.length).toBe(1)
  expect(rej[0].field).toBe('rating')
  await closeDevice(d)
})
