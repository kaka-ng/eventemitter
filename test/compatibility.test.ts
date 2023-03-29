
import { on, once } from 'events'
import t from 'tap'
import { EventEmitter } from '../lib'

t.test('once', async function (t) {
  t.plan(1)
  const ee = new EventEmitter()
  process.nextTick(() => {
    ee.emit('once')
  })
  await once(ee, 'once')
  t.pass('checked')
})

// TODO: update to compatible with abort controller
t.test('on', { skip: true }, async function (t) {
  t.plan(2)
  const ee = new EventEmitter()
  process.nextTick(() => {
    ee.emit('on', 'foo')
    ee.emit('on', 'foo')
  })
  for await (const event of on(ee as any, 'on')) {
    t.same(event, ['foo'])
  }
})
