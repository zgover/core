/**
 * @license
 * Copyright Gover Construction LLC. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://gist.github.com/zgover/678d51ffc2477d2e714052d7154f784b
 */

// This file is based on https://github.com/developit/mitt/blob/v1.1.3/src/index.js
// It's been edited for the needs of this script
// See the LICENSE at the top of the file

// Event handler callback function
type EventHandler = (...events: any[]) => void

// Wild card handler function receiving the first parameter as the event name
type WildCardEventHandler = (name: string, ...events: any[]) => void

// An array of all currently registered event handlers for an event name
type EventHandlerList = Array<EventHandler>

// An array of all currently registered wildcard event handlers for an event name
type WildCardEventHandlerList = Array<WildCardEventHandler>

// A map of event types and their corresponding event handlers.
type EventHandlerMap = {
  '*'?: WildCardEventHandlerList,
  [type: string]: EventHandlerList,
}

/**
 * Basic event emitter with on/off/emit listening events.
 * Concepts include functional event emitting and publish–subscribe
 * patterns (Pub/Sub) https://cloud.google.com/pubsub/docs/overview
 */
export type EventEmitter = {
  /**
   * Register an event handler for the given type.
   *
   * @example ```
   * const handler = (param1: string) => log(txt)
   * eventEmitter.on('txtChangeEvent', handler) // Same handler used with off()
   * ```
   * @param {string} name RefName/ID of event to listen for, or `"*"` for all events
   * @param {EventHandler} handler Function to call in response to given event
   * @memberOf EventEmitter
   */
  on(name: string, handler: EventHandler): void

  /**
   * Remove an event handler for the given type.
   *
   * @example ```
   * const handler = (param1: string) => log(txt)
   * eventEmitter.off('txtChangeEvent', handler) // Same handler used with on()
   * ```
   * @see EventEmitter.on
   * @param {string} name  RefName/ID of event to unregister `handler` from, or `"*"`
   * @param {EventHandler} handler EventHandler function to remove
   * @memberOf EventEmitter
   */
  off(name: string, handler: EventHandler): void

  /**
   * Invoke all handlers for the given type.
   * If present, `"*"` handlers are invoked after type-matched handlers.
   *
   * @example ```eventEmitter.emit('txtChangeEvent', "Hello world, I'm event param #1")```
   * @param {string} type RefName/ID of event to invoke
   * @param {any[]} events Any rest params (object is recommended and powerful), passed to each handler
   * @memberOf EventEmitter
   */
  emit(name: string, ...events: any[]): void
}

/**
 * EventEmitter: Small functional event emitter using publish/subscribe (Pub/Sub) pattern.
 *
 * @name eventEmitter
 * @param {EventHandlerMap?} all Existing or default handler map
 * @returns {EventEmitter}
 */
export function eventEmitter(all?: EventHandlerMap): EventEmitter {
  all = all || Object.create(null)

  return {
    on(name: string, handler: EventHandler) {
      (all[name] ??= []).push(handler)
    },
    off(name: string, handler: EventHandler) {
      if (all[name]) {
        all[name].splice(all[name].indexOf(handler) >>> 0, 1)
      }
    },
    emit(name: string, ...events: any[]) {
      function handleFn(
        fn: EventHandler | WildCardEventHandler | null,
        wild: boolean = false,
      ) {
        if (typeof fn === 'function') {
          if (wild) {
            fn(name, ...events)
          } else {
            (fn as EventHandler)(...events)
          }
        }
      }

      (all[name] ??= []).slice().map((fn?: EventHandler) => {
        handleFn(fn)
      });
      (all['*'] ??= []).slice().map((fn?: WildCardEventHandler) => {
        handleFn(fn, true)
      })
    },
  } as EventEmitter
}
