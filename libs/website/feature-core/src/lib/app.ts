/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

// import EventEmitter from 'events'
import { Component, Module, ModulesMap } from './core'
import { EventFlag, PKG_VERSION } from '../const'
import EventEmitter from 'events'


export class App {

  public static readonly $VERSION: string = PKG_VERSION

  public static event: EventEmitter = new EventEmitter()
  public static modules: ModulesMap = new Map()

  private static instance?: App

  private constructor() {}


  /**
   * Get the currently living singleton instance of App
   * @throws
   * @returns {App} instance
   */
  public static getInstance(): App {
    if (App.instance instanceof App) {
      return App.instance
    }
    throw new Error('Instance doesn\'t exist! You must call createInstance(...) first!')
  }

  /**
   * Creates a new singleton instance of App
   * @throws
   */
  public static createInstance(): App {
    if (App.instance instanceof App) {
      throw new Error('Instance exist! You have already created an instance.')
    }
    App.instance = new App()
    App.event.emit(EventFlag.INSTANCE_CREATED, this, App.instance)
    return App.instance
  }

  /**
   * Builds and registers a {@link Module} instance from the
   * provided {@link Component}
   * @param {string} _id
   * @param {Component["ctor"]} ctor
   * @param {Component["config"]} config
   * @returns {App}
   */
  public static setComponent(
    _id: string,
    ctor: Component['ctor'],
    meta?: Component['metadata'],
  ) {
    const component: Component = { metadata: { ...meta, _id }, ctor }
    const module: Module = new class ComponentModule {}
    App.modules.set(_id, module)
    App.event.emit(EventFlag.COMPONENT_REGISTERED, App, module)
    return this
  }

}


export function app() {
  return 'app'
}
