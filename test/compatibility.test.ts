
import EE, { on, once, setMaxListeners } from 'events'
import t from 'tap'
import { EventEmitter } from '../lib'

t.test('node:events', function (t) {
  t.plan(4)

  t.test('once', async function (t) {
    t.plan(1)
    const ee = new EventEmitter()
    process.nextTick(() => {
      ee.emit('once')
    })
    await once(ee, 'once')
    t.pass('checked')
  })

  t.test('on', async function (t) {
    t.plan(2)
    let count = 0
    const ee = new EventEmitter()
    process.nextTick(() => {
      ee.emit('on', 'foo')
      ee.emit('on', 'foo')
    })
    for await (const event of on(ee as any, 'on')) {
      t.same(event, ['foo'])
      count++
      if (count === 2) break
    }
  })

  t.test('iterator', async function (t) {
    t.plan(4)
    const ee = new EventEmitter()
    process.nextTick(() => {
      ee.emit('on', 'foo')
      ee.emit('on', 'foo')
    })
    const iterator = EventEmitter.on(ee as any, 'on')[Symbol.asyncIterator]()
    const e1 = await Promise.all([iterator.next(), iterator.next(), iterator.next()])
    for (const { value } of e1) {
      t.same(value, ['foo'])
    }
    const e2 = await iterator.next()
    t.same(e2.value, ['foo'])
  })

  t.test('setMaxListeners', function (t) {
    t.plan(2)

    const ee1 = new EventEmitter()
    const ee2 = new EE()

    setMaxListeners(1, ee1 as any, ee2)
    t.equal(ee1.getMaxListeners(), 1)
    t.equal(ee2.getMaxListeners(), 1)
  })
})

t.test('EventEmitter', async function (t) {
  t.plan(4)

  t.test('once', async function (t) {
    t.plan(1)
    const ee = new EventEmitter()
    process.nextTick(() => {
      ee.emit('once')
    })
    await EventEmitter.once(ee, 'once')
    t.pass('checked')
  })

  t.test('on', async function (t) {
    t.plan(2)
    let count = 0
    const ee = new EventEmitter()
    process.nextTick(() => {
      ee.emit('on', 'foo')
      ee.emit('on', 'foo')
    })
    for await (const event of EventEmitter.on(ee as any, 'on')) {
      t.same(event, ['foo'])
      count++
      if (count === 2) break
    }
  })

  t.test('iterator', async function (t) {
    t.plan(4)
    const ee = new EventEmitter()
    process.nextTick(() => {
      ee.emit('on', 'foo')
      ee.emit('on', 'foo')
    })
    const iterator = EventEmitter.on(ee as any, 'on')[Symbol.asyncIterator]()
    const e1 = await Promise.all([iterator.next(), iterator.next(), iterator.next()])
    for (const { value } of e1) {
      t.same(value, ['foo'])
    }
    const e2 = await iterator.next()
    t.same(e2.value, ['foo'])
  })

  t.test('setMaxListeners', function (t) {
    t.plan(2)

    const ee1 = new EventEmitter()
    const ee2 = new EE()

    EventEmitter.setMaxListeners(1, ee1 as any, ee2)
    t.equal(ee1.getMaxListeners(), 1)
    t.equal(ee2.getMaxListeners(), 1)
  })
})
