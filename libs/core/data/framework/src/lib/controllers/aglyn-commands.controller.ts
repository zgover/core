/**
 * @license
 * Copyright 2022 Aglyn LLC
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

import {EmitterFn} from '@aglyn/shared-util-emitter'
import {_isFnT} from '@aglyn/shared-util-guards'
import {
  AglynEventStateFlag,
  AglynEventTriggerFlag,
  type CommandsRegisterListenerPayload,
  type CommandsRemoveResolverPayload,
  type CommandsSetResolverPayload,
  type CommandsTriggerPayload,
  type CommandsUnregisterListenerPayload,
} from '../constants/emitter'
import {AglynModuleModel} from '../models/aglyn-module.model'
import {type IAglynAppController} from '../types/aglyn-app.types'
import {
  type AglynCommander,
  type AglynCommandResolver,
  type AglynCommandsControllerOptions,
  type CommandUId,
  type IAglynCommandsController,
} from '../types/aglyn-commands.types'
import {type AglynModuleEffectListener} from '../types/aglyn-module.types'


const TAG = 'AglynCommands'
const NS = 'aglyn.core.data.framework.module.commands'

export class AglynCommandsController extends AglynModuleModel<AglynCommandsControllerOptions> implements IAglynCommandsController {

  public static readonly [Symbol.toStringTag]: string = TAG
  public static readonly namespace: string = NS

  #commander: AglynCommander = EmitterFn()
  #resolvers: Map<CommandUId, AglynCommandResolver> = new Map()

  public get commander(): AglynCommander {return this.#commander}
  public get resolvers(): Map<CommandUId, AglynCommandResolver> {return this.#resolvers}

  protected get listeners(): AglynModuleEffectListener<any>[] {
    return [
      [AglynEventTriggerFlag.COMMANDS_RESOLVER_SET, this.setResolver],
      [AglynEventTriggerFlag.COMMANDS_LISTENER_REGISTER, this.registerListener],
      [AglynEventTriggerFlag.COMMANDS_RESOLVER_REMOVE, this.removeResolver],
      [AglynEventTriggerFlag.COMMANDS_LISTENER_UNREGISTER, this.unregisterListener],
      [AglynEventTriggerFlag.COMMANDS_TRIGGER, this.trigger],
    ]
  }

  constructor(app: IAglynAppController, options: AglynCommandsControllerOptions) {
    super(app, options)
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      commands: this.#commander.all.entries() as any,
    }
  }

  public setResolver(payload: CommandsSetResolverPayload): this {
    const {resolver, commandId: cId} = payload
    const commandId = resolver?.commandId || cId
    if (_isFnT(resolver) && commandId) {
      this.#resolvers.set(commandId, resolver)
      this.logger.debug(AglynEventStateFlag.COMMAND_RESOLVER_SET, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_RESOLVER_SET, {commandId})
    }
    else {
      // TODO: throw errorFactory error
      if (_isFnT(resolver)) throw new Error('Invalid resolver fn')
      throw new Error('Invalid commandId provided')
    }
    return this
  }
  public registerListener(payload: CommandsRegisterListenerPayload): this {
    const {listener, commandId: cId} = payload
    const commandId = listener?.commandId || cId
    if (_isFnT(listener) && commandId) {
      this.#commander.on(commandId, listener)
      this.logger.debug(AglynEventStateFlag.COMMAND_LISTENER_REGISTERED, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_LISTENER_REGISTERED, {commandId})
    }
    else {
      // TODO: throw errorFactory error
      if (_isFnT(listener)) throw new Error('Invalid listener fn')
      throw new Error('Invalid commandId provided')
    }
    return this
  }
  public unregisterListener(payload: CommandsUnregisterListenerPayload): this {
    const {listener, commandId: cId} = payload
    const commandId = listener?.commandId || cId
    if (commandId) {
      this.#commander.off(commandId, listener)
      this.logger.debug(AglynEventStateFlag.COMMAND_LISTENER_UNREGISTERED, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_LISTENER_UNREGISTERED, {commandId})
    }
    else {
      // TODO: throw errorFactory error
      throw new Error('Invalid commandId provided')
    }
    return this
  }
  public removeResolver(payload: CommandsRemoveResolverPayload): this {
    const {commandId} = payload
    if (commandId) {
      this.#resolvers.delete(commandId)
      this.logger.debug(AglynEventStateFlag.COMMAND_RESOLVER_REMOVED, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_RESOLVER_REMOVED, {commandId})
    }
    else {
      // TODO: throw errorFactory error
      throw new Error('Invalid commandId provided')
    }
    return this
  }
  public trigger(payload: CommandsTriggerPayload): this {
    const {commandId} = payload
    const resolver = this.#resolvers.get(commandId)
    if (_isFnT(resolver)) {
      this.logger.debug(AglynEventStateFlag.COMMAND_RESOLVER_TRIGGERING, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_RESOLVER_TRIGGERING, {commandId})
      const response = resolver(payload)
      this.logger.debug(AglynEventStateFlag.COMMAND_RESOLVER_TRIGGERED, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_RESOLVER_TRIGGERED, {commandId})

      this.logger.debug(AglynEventStateFlag.COMMAND_LISTENERS_TRIGGERING, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_LISTENERS_TRIGGERING, {commandId})
      this.#commander.emit(commandId, {payload, response})
      this.logger.debug(AglynEventStateFlag.COMMAND_LISTENERS_TRIGGERED, {commandId})
      this.emitter.emit(AglynEventStateFlag.COMMAND_LISTENERS_TRIGGERED, {commandId})
    }
    else {
      // TODO: throw errorFactory error
      if (_isFnT(resolver)) throw new Error('Invalid resolver fn')
      throw new Error('Invalid commandId provided')
    }
    return this
  }
}

export default AglynCommandsController
