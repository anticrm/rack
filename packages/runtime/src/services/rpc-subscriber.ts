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

import { RedisClient } from 'redis'
import { Platform } from '../platform'
import { Context, Service } from '../types'

import { RpcRequest, RpcResultResponse } from './rpc-local'
import { RpcPublisher } from './rpc-publisher'

export class RpcSubscriber implements Service {

  private platform!: Platform
  private redis!: RedisClient
  private running = false

  configure (platform: Platform) { 
    this.platform = platform
  }

  start() {
    this.running = true
    this.redis = this.platform.getService('redis').createClient()

    const publisher = this.platform.getService('rpc-publisher') as RpcPublisher
    const invocationChannel = publisher.invocationChannel
    const funcs = this.platform.getService('rpc-local').funcs
    const workerList = `worker.${this.platform.nodeId}.${this.platform.deploymentId}`
    const readQueue = () => {
      this.redis.brpoplpush(invocationChannel, workerList, 1, (err, res) => {
        if (res) {
          const request = JSON.parse(res) as RpcRequest
  
          const ctx = new Context(this.platform)
          const func = funcs[request.method]
          const result = func(ctx, request.params ?? [])

          const resultChannel = publisher.getResultChannel(request.uid)

          const response: RpcResultResponse = { uid: request.uid, result }
          this.redis.publish(resultChannel, JSON.stringify(response))
        }
        if (this.running) readQueue()
        else this.redis.quit()
      })  
    }
    readQueue()
  }

  stop () {
    this.running = false
  }

}