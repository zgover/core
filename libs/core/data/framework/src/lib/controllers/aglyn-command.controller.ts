/**
 * @license
 * Copyright 2021 Aglyn LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Dictionary } from '@aglyn/shared-data-types'
import { _isFnT } from '@aglyn/shared-util-guards'
import { Mitt } from '@aglyn/shared-util-vendor'
import { Emitter } from 'mitt'
import {
  AglynAppEffectFlag,
  AglynAppEventFlag,
  AglynModuleEffectPayload,
} from '../constants/emitter'
import { COMMAND_LISTENER_TYPE, COMMAND_RESOLVER_TYPE, MODULE_TYPE } from '../constants/symbol'
import {
  AglynAppModuleEffectListener,
  AglynModuleBaseModel,
} from '../models/aglyn-module-base.model'
import { AglynTypeFields, PayloadData } from '../types'
import { CommandUId } from './aglyn-components.controller'


const TAG = 'AglynCommandController'

export type AglynCommandResolverTypeFields = AglynTypeFields<typeof MODULE_TYPE, typeof COMMAND_RESOLVER_TYPE>
export type AglynCommandListenerTypeFields = AglynTypeFields<typeof MODULE_TYPE, typeof COMMAND_LISTENER_TYPE>

export type AglynCommander = Emitter<AglynCommandParams>

export enum AglynCommandFlag {
  ANY = '*',
}

export type AglynCommandParams = {
  [P in CommandUId | '*' | keyof AglynCommandFlag]: PayloadData<Dictionary>
}

export interface AglynCommandResolver extends AglynCommandResolverTypeFields {
  commandId: CommandUId
  (data: Dictionary): any
}

export interface AglynCommandListener extends AglynCommandListenerTypeFields {
  commandId: CommandUId
  (data: { request: Dictionary, response: Dictionary }): void
}

export interface AglynCommandController extends AglynModuleBaseModel {
  setResolver(data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_REGISTER_RESOLVER]): void
  onResolve(data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_REGISTER_LISTENER]): void
  trigger(data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_TRIGGER]): void
  unregisterListener(data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_UNREGISTER_LISTENER]): void
  unregisterResolver(data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_UNREGISTER_RESOLVER]): void
}

export class AglynCommandController extends AglynModuleBaseModel {

  public static readonly [Symbol.toStringTag]: string = TAG

  #commander: AglynCommander = Mitt()
  #resolvers: Map<CommandUId, AglynCommandResolver> = new Map()

  public get commander(): AglynCommander {
    return this.#commander
  }
  public get resolvers(): Map<CommandUId, AglynCommandResolver> {
    return this.#resolvers
  }

  constructor(options) {super(options)}

  public toString(): string {
    return `${TAG}(app: '${this.app.getName()}')`
  }
  public toJSON() {
    return {
      ...super.toJSON(),
      commands: [...this.#commander.all.values()],
    }
  }

  public setResolver = (
    data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_REGISTER_RESOLVER],
  ): void => {
    const {resolver, commandId: cId} = data
    const commandId = resolver?.commandId || cId
    if (_isFnT(resolver) && commandId) {
      this.#resolvers.set(commandId, resolver)
      this.getLogger().debug(AglynAppEventFlag.COMMAND_REGISTERED_RESOLVER, {commandId})
      this.getEmitter().emit(AglynAppEventFlag.COMMAND_REGISTERED_RESOLVER, {commandId})
    }
    else {
      // TODO: throw errorFactory error
    }
  }
  public onResolve = (
    data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_REGISTER_LISTENER],
  ): void => {
    const {listener, commandId: cId} = data
    const commandId = listener?.commandId || cId
    if (commandId && _isFnT(listener)) {
      this.#commander.on(commandId, listener)
      this.getLogger().debug(AglynAppEventFlag.COMMAND_REGISTERED_LISTENER, {commandId})
      this.getEmitter().emit(AglynAppEventFlag.COMMAND_REGISTERED_LISTENER, {commandId})
    }
    else {
      // TODO: throw errorFactory error
    }
  }
  public trigger = (
    data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_TRIGGER],
  ): void => {
    const {commandId} = data
    const resolver = this.#resolvers.get(commandId)
    if (_isFnT(resolver)) {
      const resolved = resolver(data)
      this.getLogger().debug(AglynAppEventFlag.COMMAND_TRIGGERED_RESOLVER, {commandId})
      this.getEmitter().emit(AglynAppEventFlag.COMMAND_TRIGGERED_RESOLVER, {commandId})

      this.#commander.emit(commandId, {data, resolved})
      this.getLogger().debug(AglynAppEventFlag.COMMAND_TRIGGERED_LISTENER, {commandId})
      this.getEmitter().emit(AglynAppEventFlag.COMMAND_TRIGGERED_LISTENER, {commandId})
    }
    else {
      // TODO: throw errorFactory error
    }
  }
  public unregisterListener = (
    data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_UNREGISTER_LISTENER],
  ): void => {
    const {listener, commandId: cId} = data
    const commandId = listener?.commandId || cId
    if (commandId) {
      this.#commander.off(commandId, listener)
      this.getLogger().debug(AglynAppEventFlag.COMMAND_UNREGISTERED_LISTENER, {commandId})
      this.getEmitter().emit(AglynAppEventFlag.COMMAND_UNREGISTERED_LISTENER, {commandId})
    }
    else {
      // TODO: throw errorFactory error
    }
  }
  public unregisterResolver = (
    data: AglynModuleEffectPayload[AglynAppEffectFlag.COMMAND_ACTION_UNREGISTER_RESOLVER],
  ): void => {
    const {commandId} = data
    if (commandId) {
      this.#resolvers.delete(commandId)
      this.getLogger().debug(AglynAppEventFlag.COMMAND_UNREGISTERED_RESOLVER, {commandId})
      this.getEmitter().emit(AglynAppEventFlag.COMMAND_UNREGISTERED_RESOLVER, {commandId})
    }
    else {
      // TODO: throw errorFactory error
    }
  }


  protected listeners: AglynAppModuleEffectListener<any>[] = [
    [AglynAppEffectFlag.COMMAND_ACTION_REGISTER_RESOLVER, this.setResolver],
    [AglynAppEffectFlag.COMMAND_ACTION_REGISTER_LISTENER, this.onResolve],
    [AglynAppEffectFlag.COMMAND_ACTION_UNREGISTER_RESOLVER, this.unregisterResolver],
    [AglynAppEffectFlag.COMMAND_ACTION_UNREGISTER_LISTENER, this.unregisterListener],
    [AglynAppEffectFlag.COMMAND_TRIGGER, this.trigger],
  ]
}

export type AglynCommandControllerT = typeof AglynCommandController
export default AglynCommandController
