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

import { CoreError, Auth, Service } from '../types'
import { Platform } from '../platform'
import { JsonRpcResponse, JSON_RPC_METHOD_NOT_FOUND } from '../modules/jsonrpc'
import { RedisClient } from "redis"
import { RPC_CONFIG, RpcConfig } from './rpc-local'

const INVOCATION_CHANNEL = 'invoke'
const RESULTS_CHANNEL = 'results'

export class RpcPublisher implements Service {

  private platform!: Platform
  private localId: number = 0
  private redis!: RedisClient
  private results!: RedisClient
  private invocations = new Map<string, (jsonRpcResponse: JsonRpcResponse) => void>()
  invocationChannel!: string

  configure (platform: Platform) { 
    this.platform = platform
    this.invocationChannel = `${INVOCATION_CHANNEL}.${platform.deploymentId}`
  }

  start() {
    this.redis = this.platform.getService('redis').createClient()
    this.results = this.platform.getService('redis').createClient()
    this.results.on('message', (channel, message) => {
      const response = JSON.parse(message) as JsonRpcResponse & { uid: string }
      const control = this.invocations.get(response.uid)
      console.log('XXX', response, control)
      if (control) {
        control(response)
        this.invocations.delete(response.id as string)
      } else {
        console.log('unknown response in results channel', response)
      }
    })
    this.results.subscribe(`${RESULTS_CHANNEL}.${this.platform.nodeId}.${this.platform.deploymentId}`)
  }

  stop() {
    this.redis.quit()
    this.results.quit()
  }

  getResultChannel(uid: string) {
    const nodeId = uid.substring(0, uid.indexOf('/'))
    return `${RESULTS_CHANNEL}.${nodeId}.${this.platform.deploymentId}`
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
      const uid = this.platform.nodeId + '/' + (this.localId++).toString()
      const payload = JSON.stringify({uid, method, params})
      this.redis.rpush(this.invocationChannel, payload, (err, res) => {
        if (err) {
          reject(err)
        } else {
          console.log('!!!! PUSHED:', payload)
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
