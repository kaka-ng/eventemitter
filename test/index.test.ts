import * as crypto from 'crypto'
import t from 'tap'
import { EventEmitter } from '../lib'

async function tick (): Promise<void> {
  return await new Promise(function (resolve) {
    process.nextTick(function () {
      resolve()
    })
  })
}

t.plan(1)

t.test('EventEmitter', function (t) {
  t.plan(16)

  t.beforeEach(function () {
    // reset EventEmitter constant
    EventEmitter.defaultMaxListeners = 10
  })

  t.afterEach(function () {
    process.removeAllListeners('warning')
  })

  t.test('constant', function (t) {
    t.plan(4)

    t.test('defaultMaxListeners is 10', function (t) {
      t.plan(1)
      t.equal(EventEmitter.defaultMaxListeners, 10)
    })

    t.test('defaultMaxListeners = 11', function (t) {
      t.plan(1)
      EventEmitter.defaultMaxListeners = 11
      t.equal(EventEmitter.defaultMaxListeners, 11)
    })

    t.test('defaultMaxListeners = -1', function (t) {
      t.plan(1)
      try {
        EventEmitter.defaultMaxListeners = -1
        t.fail()
      } catch (err) {
        t.ok(err)
      }
    })

    t.test('defaultMaxListeners = null', function (t) {
      t.plan(1)
      try {
        EventEmitter.defaultMaxListeners = 'null' as any
        t.fail()
      } catch (err) {
        t.ok(err)
      }
    })
  })

  t.test('constructor', function (t) {
    t.plan(2)

    t.test('maxListeners', function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      t.equal(ee.getMaxListeners(), 10)
    })

    t.test('maxListeners = 11', function (t) {
      t.plan(1)
      EventEmitter.defaultMaxListeners = 11
      const ee = new EventEmitter()
      t.equal(ee.getMaxListeners(), 11)
    })
  })

  t.test('addListener', function (t) {
    t.plan(4)
    const eventName = crypto.randomBytes(4).toString('hex')

    t.test('chainable', function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      t.equal(ee.addListener(eventName, tick) instanceof EventEmitter, true)
    })

    t.test(`eventNames include ${eventName}`, function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.addListener(eventName, tick)
      t.equal(ee.eventNames().includes(eventName), true)
    })

    t.test(`rawListeners include ${Object.prototype.toString.call(tick)}`, function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.addListener(eventName, tick)
      t.equal(ee.rawListeners(eventName).includes(tick), true)
    })

    t.test('emit Warning', function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.setMaxListeners(1)
      process.on('warning', function (warning) {
        t.equal(warning.name, 'MaxListenersExceededWarning')
      })
      ee.addListener(eventName, tick)
      ee.addListener(eventName, tick)
    })
  })

  t.test('emit', function (t) {
    t.plan(2)
    const eventName = crypto.randomBytes(4).toString('hex')
    const ee = new EventEmitter()
    const order: string[] = []
    async function before (order: string[]): Promise<void> {
      return await new Promise(function (resolve) {
        process.nextTick(function () {
          order.push('before')
          resolve()
        })
      })
    };
    async function after (order: string[]): Promise<void> {
      return await new Promise(function (resolve) {
        process.nextTick(function () {
          order.push('after')
          resolve()
        })
      })
    };

    ee.addListener(eventName, before)
    ee.addListener(eventName, after)

    t.test('stack length = 2', function (t) {
      t.plan(1)
      t.equal(ee.listenerCount(eventName), 2)
    })

    t.test('emit order', async function (t) {
      t.plan(3)
      await ee.emit(eventName, order)
      t.equal(order.length, 2)
      t.equal(order[0], 'before')
      t.equal(order[1], 'after')
    })
  })

  t.test('eventNames', function (t) {
    t.plan(2)
    const ee = new EventEmitter()
    const events = [
      crypto.randomBytes(4).toString('hex'),
      crypto.randomBytes(4).toString('hex')
    ]
    ee.addListener(events[0], tick)
    ee.addListener(events[1], tick)

    t.test('stack length = 2', function (t) {
      t.plan(1)
      t.equal(ee.eventNames().length, 2)
    })

    t.test(`eventNames = [${events[0]},${events[1]}]`, function (t) {
      t.plan(2)
      const names = ee.eventNames()
      t.equal(names[0], events[0])
      t.equal(names[1], events[1])
    })
  })

  t.test('getMaxListeners', function (t) {
    t.plan(1)
    const ee = new EventEmitter()
    t.test('= 10', function (t) {
      t.plan(1)
      t.equal(ee.getMaxListeners(), 10)
    })
  })

  t.test('listenerCount', function (t) {
    t.plan(2)
    const eventName = crypto.randomBytes(4).toString('hex')
    const random = Math.floor(Math.random() * 10 + 1)
    const ee = new EventEmitter()

    t.test('empty at default', function (t) {
      t.plan(1)
      t.equal(ee.listenerCount(eventName), 0)
    })

    t.test(`event stack should increase to ${random}`, function (t) {
      t.plan(1)
      let count = 1
      while (count <= random) {
        ee.on(eventName, tick)
        count++
      }
      t.equal(ee.listenerCount(eventName), random)
    })
  })

  t.test('listeners', function (t) {
    t.plan(2)
    const eventName = crypto.randomBytes(4).toString('hex')
    const random = Math.floor(Math.random() * 10 + 1)
    const ee = new EventEmitter()

    t.test('empty at default', function (t) {
      t.plan(1)
      t.equal(ee.listeners(eventName).length, 0)
    })

    t.test(`event stack should increase to ${random}`, function (t) {
      t.plan(1 + random)
      let count = 1
      while (count <= random) {
        ee.on(eventName, tick)
        count++
      }
      t.equal(ee.listeners(eventName).length, random)
      ee.listeners(eventName).forEach(function (l) {
        t.equal(typeof l === 'function', true)
      })
    })
  })

  t.test('off', function (t) {
    t.plan(2)
    const ee = new EventEmitter()
    const eventName = crypto.randomBytes(4).toString('hex')

    t.test('remove one listener at a time', function (t) {
      t.plan(1)
      ee.addListener(eventName, tick)
      ee.addListener(eventName, tick)
      ee.off(eventName, tick)

      t.equal(ee.listenerCount(eventName), 1)
    })

    t.test('remove more than stack', function (t) {
      t.plan(1)
      ee.off(eventName, tick)
      ee.off(eventName, tick)

      t.equal(ee.listenerCount(eventName), 0)
    })
  })

  t.test('on', function (t) {
    t.plan(4)
    const eventName = crypto.randomBytes(4).toString('hex')
    t.test('chainable', function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      t.equal(ee.on(eventName, tick) instanceof EventEmitter, true)
    })

    t.test(`eventNames include ${eventName}`, function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.on(eventName, tick)
      t.equal(ee.eventNames().includes(eventName), true)
    })

    t.test(`rawListeners include ${Object.prototype.toString.call(tick)}`, function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.on(eventName, tick)
      t.equal(ee.rawListeners(eventName).includes(tick), true)
    })

    t.test('emit Warning', function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.setMaxListeners(1)
      process.on('warning', function (warning) {
        t.equal(warning.name, 'MaxListenersExceededWarning')
      })
      ee.on(eventName, tick)
      ee.on(eventName, tick)
    })
  })

  t.test('once', function (t) {
    t.plan(4)
    const eventName = crypto.randomBytes(4).toString('hex')
    t.test('chainable', function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      t.equal(ee.once(eventName, tick) instanceof EventEmitter, true)
    })

    t.test(`eventNames include ${eventName}`, function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.once(eventName, tick)
      t.equal(ee.eventNames().includes(eventName), true)
    })

    t.test(`rawListeners include ${Object.prototype.toString.call(tick)}`, function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.once(eventName, tick)
      t.equal(ee.rawListeners(eventName).findIndex((l: any) => l.listener === tick) !== -1, true)
    })

    t.test('emit Warning', function (t) {
      t.plan(1)
      const ee = new EventEmitter()
      ee.setMaxListeners(1)
      process.on('warning', function (warning) {
        t.equal(warning.name, 'MaxListenersExceededWarning')
      })
      ee.once(eventName, tick)
      ee.once(eventName, tick)
    })
  })

  t.test('prependListener', function (t) {
    t.plan(2)
    const eventName = crypto.randomBytes(4).toString('hex')
    const ee = new EventEmitter()
    const order: string[] = []
    async function before (order: string[]): Promise<void> {
      return await new Promise(function (resolve) {
        process.nextTick(function () {
          order.push('before')
          resolve()
        })
      })
    };
    async function after (order: string[]): Promise<void> {
      return await new Promise(function (resolve) {
        process.nextTick(function () {
          order.push('after')
          resolve()
        })
      })
    };

    ee.addListener(eventName, after)
    ee.prependListener(eventName, before)

    t.test('stack length = 2', function (t) {
      t.plan(1)
      t.equal(ee.listenerCount(eventName), 2)
    })

    t.test('emit order', async function (t) {
      t.plan(5)
      await ee.emit(eventName, order)
      await ee.emit(eventName, order)
      t.equal(order.length, 4)
      t.equal(order[0], 'before')
      t.equal(order[1], 'after')
      t.equal(order[2], 'before')
      t.equal(order[3], 'after')
    })
  })

  t.test('prependOnceListener', function (t) {
    t.plan(2)
    const eventName = crypto.randomBytes(4).toString('hex')
    const ee = new EventEmitter()
    const order: string[] = []
    async function before (order: string[]): Promise<void> {
      return await new Promise(function (resolve) {
        process.nextTick(function () {
          order.push('before')
          resolve()
        })
      })
    };
    async function after (order: string[]): Promise<void> {
      return await new Promise(function (resolve) {
        process.nextTick(function () {
          order.push('after')
          resolve()
        })
      })
    };

    ee.addListener(eventName, after)
    ee.prependOnceListener(eventName, before)

    t.test('stack length = 2', function (t) {
      t.plan(1)
      t.equal(ee.listenerCount(eventName), 2)
    })

    t.test('emit order', async function (t) {
      t.plan(4)
      await ee.emit(eventName, order)
      await ee.emit(eventName, order)
      t.equal(order.length, 3)
      t.equal(order[0], 'before')
      t.equal(order[1], 'after')
      t.equal(order[2], 'after')
    })
  })

  t.test('removeAllListeners', function (t) {
    t.plan(2)
    const eventName = crypto.randomBytes(4).toString('hex')
    const ee = new EventEmitter()

    t.test('by eventName', function (t) {
      t.plan(1)
      ee.on(eventName, tick)
      ee.on(eventName, tick)
      ee.removeAllListeners(eventName)
      t.equal(ee.listenerCount(eventName), 0)
    })

    t.test('clearAll', function (t) {
      t.plan(2)
      ee.on('foo', tick)
      ee.on('bar', tick)
      ee.removeAllListeners()
      t.equal(ee.listenerCount('foo'), 0)
      t.equal(ee.listenerCount('bar'), 0)
    })
  })

  t.test('removeListener', function (t) {
    t.plan(2)
    const ee = new EventEmitter()
    const eventName = crypto.randomBytes(4).toString('hex')

    t.test('remove one listener at a time', function (t) {
      t.plan(1)
      ee.addListener(eventName, tick)
      ee.addListener(eventName, tick)
      ee.removeListener(eventName, tick)

      t.equal(ee.listenerCount(eventName), 1)
    })

    t.test('remove more than stack', function (t) {
      t.plan(1)
      ee.removeListener(eventName, tick)
      ee.removeListener(eventName, tick)

      t.equal(ee.listenerCount(eventName), 0)
    })
  })

  t.test('setMaxListeners', function (t) {
    t.plan(4)
    const ee = new EventEmitter()
    t.test('maxListeners is 10', function (t) {
      t.plan(1)
      t.equal(ee.getMaxListeners(), 10)
    })

    t.test('maxListeners = 11', function (t) {
      t.plan(1)
      ee.setMaxListeners(11)
      t.equal(ee.getMaxListeners(), 11)
    })

    t.test('maxListeners = -1', function (t) {
      t.plan(1)
      try {
        ee.setMaxListeners(-1)
        t.fail()
      } catch (err) {
        t.ok(err)
      }
    })

    t.test('maxListeners = null', function (t) {
      t.plan(1)
      try {
        ee.setMaxListeners('null' as any)
        t.fail()
      } catch (err) {
        t.ok(err)
      }
    })
  })
})
