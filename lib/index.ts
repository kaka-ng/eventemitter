const MODE_ONCE = Symbol.for('[[Once Event Listener]]')
const MODE_ALWAYS = Symbol.for('[[Always Event Listener]]')

export type ListenerMode = typeof MODE_ONCE | typeof MODE_ALWAYS

export class Listener {
  executed: boolean
  listener: Function
  mode: ListenerMode

  constructor (listener: Function, mode: ListenerMode) {
    this.executed = false
    this.listener = listener
    this.mode = mode
  }

  async execute (...args: any[]): Promise<void> {
    if (this.mode === MODE_ONCE && this.executed) {

    } else {
      this.executed = true
      await this.listener.apply(this.listener, args)
    }
  }
}

const kDefaultMaxListeners = Symbol.for('ee.defaultMaxListeners')
const kCheckMaxListenter = Symbol.for('ee.checkMaxListenter')
const kFindEventStack = Symbol.for('ee.findEventStack')

export type EventName = string | symbol

export class EventEmitter {
  private static [kDefaultMaxListeners]: number = 10

  static get defaultMaxListeners (): number {
    return EventEmitter[kDefaultMaxListeners]
  }

  static set defaultMaxListeners (n: number) {
    if (isNaN(n)) throw new Error('MaxListerners must be a number.')
    if (!isNaN(n) && n < 0) throw new RangeError('MaxListerners must be a positive number.')
    EventEmitter[kDefaultMaxListeners] = n
  }

  private readonly events: Map<EventName, Listener[]>
  private maxListeners: number

  constructor () {
    this.events = new Map()
    this.maxListeners = EventEmitter.defaultMaxListeners
  }

  addListener (eventName: EventName, listener: Function): this {
    return this.on(eventName, listener)
  }

  async emit (eventName: EventName, ...args: any[]): Promise<boolean> {
    const stack = this[kFindEventStack](eventName)
    for (let i = 0; i < stack.length; i++) {
      const listener = stack[i]
      await listener.execute(...args)
    }
    return true
  }

  eventNames (): EventName[] {
    return Array.from(this.events.keys())
  }

  getMaxListeners (): number {
    return this.maxListeners
  }

  listenerCount (eventName: EventName): number {
    return this[kFindEventStack](eventName).length
  }

  listeners (eventName: EventName): Listener[] {
    return this[kFindEventStack](eventName)
  }

  off (eventName: EventName, listener: Function): this {
    return this.removeListener(eventName, listener)
  }

  on (eventName: EventName, listener: Function): this {
    this[kFindEventStack](eventName).push(new Listener(listener, MODE_ALWAYS))
    this[kCheckMaxListenter](eventName)
    return this
  }

  once (eventName: EventName, listener: Function): this {
    this[kFindEventStack](eventName).push(new Listener(listener, MODE_ONCE))
    this[kCheckMaxListenter](eventName)
    return this
  }

  prependListener (eventName: string | symbol, listener: Function): this {
    this[kFindEventStack](eventName).unshift(new Listener(listener, MODE_ALWAYS))
    this[kCheckMaxListenter](eventName)
    return this
  }

  prependOnceListener (eventName: string | symbol, listener: Function): this {
    this[kFindEventStack](eventName).unshift(new Listener(listener, MODE_ONCE))
    this[kCheckMaxListenter](eventName)
    return this
  }

  removeAllListeners (eventName: string | symbol): this {
    this.events.delete(eventName)
    return this
  }

  removeListener (eventName: EventName, listener: Function): this {
    const stack = this[kFindEventStack](eventName)
    const index = stack.findIndex(function (l) {
      return l.listener === listener
    })
    if (index !== -1) { stack.splice(index, 1) }
    return this
  }

  setMaxListeners (n: number): void {
    if (isNaN(n)) throw new Error('MaxListerners must be a number.')
    if (!isNaN(n) && n < 0) throw new RangeError('MaxListerners must be a positive number.')
    this.maxListeners = n
  }

  rawListeners (eventName: EventName): Function[] {
    return this[kFindEventStack](eventName).map(function (l) {
      return l.listener
    })
  }

  private [kCheckMaxListenter] (eventName: EventName): void {
    if (this.listenerCount(eventName) > this.maxListeners) {
      process.emitWarning('', 'MaxListenersExceededWarning')
    }
  }

  private [kFindEventStack] (eventName: EventName): Listener[] {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }
    return this.events.get(eventName) as Listener[]
  }
}

export default EventEmitter
