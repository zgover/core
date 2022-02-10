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

import {type ConditionalNonDist} from '@aglyn/shared-data-types'
import {noop} from '@aglyn/shared-util-tools'
import {createUid} from '@aglyn/shared-util-vendor'
import {useRouter} from 'next/router'
import {createContext, type ReactNode, useContext, useEffect, useRef, useState} from 'react'
import {
  createHocWithContextConsumer,
  type InjectedContextConsumerProps,
} from '../hocs/create-hoc-with-context-consumer'
import {NextRouterEvent} from '../hooks/router-events'


export type QueueId = string
export type Queues = Array<QueueId>
export type TupledDequeue = [QueueId, DequeueLoading]
export type QueueResponse<T extends boolean = false> = ConditionalNonDist<T,
  true,
  TupledDequeue,
  DequeueLoading>

export type EnqueueLoading = <T extends boolean = false>(asTuple?: T) => QueueResponse<T>
export type DequeueLoading = (queueId?: QueueId) => void /* Call to dequeue/end loading event */
export type DequeueAllLoading = () => void
export type CheckLoading = (queueId?: QueueId) => boolean

export type AppLoaderContextType = {
  // queues: Queues
  loading: boolean
  queueLoading: EnqueueLoading
  dequeueLoading: DequeueLoading
  dequeueAllLoading: DequeueAllLoading
  checkLoading: CheckLoading
}

export const APP_LOADER_CONTEXT_DEFAULT_VALUE: AppLoaderContextType = {
  loading: false,
  queueLoading: noop() as any,
  dequeueLoading: noop() as any,
  dequeueAllLoading: noop() as any,
  checkLoading: noop() as any,
}

export const AppLoader = createContext<AppLoaderContextType>(APP_LOADER_CONTEXT_DEFAULT_VALUE)
AppLoader.displayName = 'AppLoader'

export const {
  Provider: AppLoaderProvider,
  Consumer: AppLoaderConsumer,
} = AppLoader

const createQueueId = () => {
  return createUid()
}

export const useAppLoader = () => {
  const context = useContext(AppLoader)
  return context
}

export interface AppLoaderProviderComponentProps {
  children?: ReactNode
}

export function AppLoaderProviderComponent(props: AppLoaderProviderComponentProps) {
  const {children} = props
  const localRef = useRef<Queues>([])
  const [state, setState] = useState<AppLoaderContextType>(() => ({
    loading: false,
    queueLoading: <T extends boolean>(asTuple?: T): QueueResponse<T> => {
      const queueId = createQueueId()
      const dequeue: DequeueLoading = () => state.dequeueLoading(queueId)
      localRef.current.push(queueId)
      setState(prev => ({...prev, loading: true}))
      return (asTuple === true ? [queueId, dequeue] : dequeue) as QueueResponse<T>
    },
    dequeueLoading: (queueId?: QueueId) => {
      localRef.current = localRef.current.filter((i) => i !== queueId)
      setState(prev => ({...prev, loading: state.checkLoading()}))
    },
    dequeueAllLoading: () => {localRef.current = []},
    checkLoading: (queueId?: QueueId) => {
      if (queueId) {
        return localRef.current.indexOf(queueId) >= 0
      }
      return localRef.current.length > 0
    },
  }))
  const [loading, setLoading] = useState<() => void>(null)
  const router = useRouter()
  const startLoading = () => {
    setLoading(state.queueLoading())
  }
  const stopLoading = () => {
    if (loading) {
      loading()
    }
    setLoading(null)
  }

  useEffect(() => {
    router.events.on(NextRouterEvent.ROUTE_CHANGE_START, startLoading)
    router.events.on(NextRouterEvent.ROUTE_CHANGE_COMPLETE, stopLoading)
    router.events.on(NextRouterEvent.ROUTE_CHANGE_ERROR, stopLoading)
    return () => {
      router.events.off(NextRouterEvent.ROUTE_CHANGE_START, startLoading)
      router.events.off(NextRouterEvent.ROUTE_CHANGE_COMPLETE, stopLoading)
      router.events.off(NextRouterEvent.ROUTE_CHANGE_ERROR, stopLoading)
    }
  }, [router])

  return (
    <AppLoaderProvider
      value={state}
    >
      {children}
    </AppLoaderProvider>
  )
}

const WithN = 'appLoader'
type WithN = typeof WithN
export type AppLoaderConsumer = typeof AppLoaderConsumer
export type WithAppLoaderProps = InjectedContextConsumerProps<AppLoaderConsumer, WithN>

/**
 * App loading context HOC prop injector
 */
export const withAppLoader = createHocWithContextConsumer(AppLoaderConsumer, WithN)
