//
// Copyright © 2020 Anticrm Platform Contributors.
// 
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// 
// See the License for the specific language governing permissions and
// limitations under the License.
//

import redis, { RedisClient } from "redis"
import { Platform } from "../platform"
import { JsonRpcResponse, JSON_RPC_METHOD_NOT_FOUND } from '../modules/jsonrpc'
import { CoreError, Auth } from '../types'

import { RPC_CONFIG, RpcConfig } from '../modules/rpc'

const INVOCATION_CHANNEL = 'invoke'
const RESULTS_CHANNEL = 'results'

export class RpcService {

  private platform: Platform
  private subscriber: RedisClient
  private redis: RedisClient
  private localId: number = 0
  private invocations = new Map<string, (jsonRpcResponse: JsonRpcResponse) => void>()

  constructor (platform: Platform) { 
    this.platform = platform
    this.subscriber = redis.createClient(platform.getServiceConfig('redis'))
    this.subscriber.on('message', (channel, message) => {
      const response = JSON.parse(message) as JsonRpcResponse
      const control = this.invocations.get(response.id as string)
      if (control) {
        control(response)
        this.invocations.delete(response.id as string)
      }
    })
    this.subscriber.subscribe(RESULTS_CHANNEL)
    this.redis = platform.getService('redis')
  }

  invoke(auth: Auth | undefined, id: string | undefined, method: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {

      const rpc = this.platform.config[RPC_CONFIG] as RpcConfig
      const func = rpc[method]
      if (!func) {
        reject(new CoreError(JSON_RPC_METHOD_NOT_FOUND, 'Not Found'))
        return
      }

      if (func.auth && !auth) {
        reject(new CoreError(403, 'Forbidden'))
        return
      }

      const uid = (this.localId++).toString() + '/' + id
      const payload = JSON.stringify({id: uid, method, params})
      this.redis.publish(INVOCATION_CHANNEL, payload, (err, res) => {
        if (err) {
          reject(err)
        } else {
          this.invocations.set(uid, (jsonRpcResponse: JsonRpcResponse) => {
            if (jsonRpcResponse.error) {
              reject(new CoreError(jsonRpcResponse.error.code, jsonRpcResponse.error.message))
            } else {
              resolve(jsonRpcResponse.result)
            }
          })
        }
      })  
    })
  }
}