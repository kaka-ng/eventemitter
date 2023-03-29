import EE from 'events'

export type EventName = string | symbol
export type Listener = ((...args: any[]) => void) | ((...args: any[]) => Promise<void>)

function createDeferedPromise (): { promise: Promise<unknown>, resolve: Function } {
  const promise: any = {}
  promise.promise = new Promise(function (resolve) {
    promise.resolve = resolve
  })
  return promise
}

function wrapOnce (ee: EventEmitter, listener: Listener): Listener {
  let executed = false

  const execute = async (...args: any[]): Promise<void> => {
    if (executed) return
    executed = true
    await listener.apply(ee, args)
  }
  execute.listener = listener

  return execute
}

export class EventEmitter {
  #events: Map<EventName, Listener[]>
  #maxListener: number

  constructor () {
    this.#events = new Map()
    this.#maxListener = EventEmitter.defaultMaxListeners
  }

  // we use the node:events one
  static get defaultMaxListeners (): number {
    return EE.defaultMaxListeners
  }

  static set defaultMaxListeners (n: number) {
    EE.defaultMaxListeners = n
  }

  static setMaxListeners (n: number, ...args: Array<EE.EventEmitter | EventEmitter>): void {
    for (const ee of args) {
      ee.setMaxListeners(n)
    }
  }

  static async once (ee: EE.EventEmitter | EventEmitter, eventName: EventName): Promise<[Error | null]> {
    const promise = createDeferedPromise()

    ee.once(eventName, function (...args: any[]) {
      promise.resolve(args)
    })

    return promise.promise as any
  }

  static on (ee: EE.EventEmitter | EventEmitter, eventName: EventName): AsyncIterable<any> {
    const stack: any[] = []
    let promise: any = null
    ee.on(eventName, (...args: any[]) => {
      stack.push(args)
      // we cannot check this line as it is actually stale
      /* istanbul ignore else */
      if (promise !== null) promise.resolve()
    })

    const iterator: AsyncIterator<any> = {
      async next () {
        if (stack.length === 0) {
          // we need to wait for the next event when the stack is cleared
          promise = createDeferedPromise()
          await promise.promise
        }
        return {
          done: false,
          value: stack.shift()
        }
      }
    }

    return {
      [Symbol.asyncIterator] () {
        return iterator
      }
    }
  }

  addListener (eventName: EventName, listener: Listener): this {
    return this.on(eventName, listener)
  }

  async emit (eventName: EventName, ...args: any[]): Promise<boolean> {
    const stack = this.#findEventStack(eventName)
    for (const listener of stack) {
      await listener.apply(this, args)
    }
    return true
  }

  eventNames (): EventName[] {
    return Array.from(this.#events.keys())
  }

  getMaxListeners (): number {
    return this.#maxListener
  }

  listenerCount (eventName: EventName): number {
    return this.#findEventStack(eventName).length
  }

  listeners (eventName: EventName): Function[] {
    const stack = this.#findEventStack(eventName)
    return stack.filter((l: any) => typeof l.listener === 'undefined')
  }

  off (eventName: EventName, listener: Listener): this {
    const stack = this.#findEventStack(eventName)
    const index = stack.findIndex(function (l: any) {
      // once
      if (typeof l.listener === 'function') return l.listener === listener
      // on
      return l === listener
    })
    if (index !== -1) stack.splice(index, 1)
    return this
  }

  on (eventName: EventName, listener: Listener): this {
    this.#findEventStack(eventName).push(listener)
    this.#checkMaxListener(eventName)
    return this
  }

  once (eventName: EventName, listener: Listener): this {
    this.#findEventStack(eventName).push(wrapOnce(this, listener))
    this.#checkMaxListener(eventName)
    return this
  }

  prependListener (eventName: EventName, listener: Listener): this {
    this.#findEventStack(eventName).unshift(listener)
    this.#checkMaxListener(eventName)
    return this
  }

  prependOnceListener (eventName: EventName, listener: Listener): this {
    this.#findEventStack(eventName).unshift(wrapOnce(this, listener))
    this.#checkMaxListener(eventName)
    return this
  }

  removeAllListeners (eventName?: EventName): this {
    if (typeof eventName === 'string' || typeof eventName === 'symbol') {
      this.#events.delete(eventName)
    } else {
      this.#events.clear()
    }
    return this
  }

  removeListener (eventName: EventName, listener: Listener): this {
    return this.off(eventName, listener)
  }

  setMaxListeners (n: number): this {
    if (isNaN(n)) throw new Error('MaxListerners must be a number.')
    if (!isNaN(n) && n < 0) throw new RangeError('MaxListerners must be a positive number.')
    this.#maxListener = n
    return this
  }

  rawListeners (eventName: EventName): Function[] {
    return this.#findEventStack(eventName)
  }

  #findEventStack (eventName: EventName): Listener[] {
    let events = this.#events.get(eventName)
    if (!Array.isArray(events)) {
      events = []
      this.#events.set(eventName, events)
    }
    return events
  }

  #checkMaxListener (eventName: EventName): void {
    if (this.listenerCount(eventName) > this.#maxListener) {
      process.emitWarning('', 'MaxListenersExceededWarning')
    }
  }
}
export default EventEmitter
