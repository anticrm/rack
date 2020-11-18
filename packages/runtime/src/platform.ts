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

import redis from 'redis'
import { nanoid } from 'nanoid'

import { Status, Config, Module, Runtime, Service } from './types'
import { HttpService } from './modules/http'
import { RpcService } from './services/rpc-local'
import { RedisService } from './services/redis'
import { RpcSubscriber } from './services/rpc-subscriber'
import { RpcPublisher } from './services/rpc-publisher'

const SERVICES: { [name: string]: new () => Service } = {
  redis: RedisService,
  'rpc-local': RpcService,
  'rpc-publisher': RpcPublisher,
  'rpc-subscriber': RpcSubscriber,
  http: HttpService
}

export class Platform {
  readonly config: Config
  readonly runtime: { [key: string]: object }

  readonly deploymentId: string
  readonly nodeId: string

  private mode: 'development' | 'production'
  private services: { [name: string]: Service } = {}

  constructor(config: Config, runtime: { [key: string]: object }, mode: 'development' | 'production') { 
    this.config = config 
    this.runtime = runtime
    this.mode = mode

    this.deploymentId = nanoid(10)
    this.nodeId = nanoid(10)
  }

  log(status: Status) {
    console.log(status)
  }

  getServiceConfig(name: string) {
    const serviceConfig = this.config.services[name]
    if (!serviceConfig) {
      throw new Error('service not configured: ' + name)
    }
    return serviceConfig[this.mode]
  }

  getService(name: string): any {
    const service = this.services[name]
    if (service)
      return service
    else { 
      const ctor = SERVICES[name]
      if (ctor) {
        const service = new ctor()
        service.configure(this)
        service.start()
        this.services[name] = service
        return service
      } else {
        throw new Error('unknown service ' + name)
      }
    }
  }

  start(name: string) {
    this.getService(name)
  }

  shutdown() {
    for (const name in this.services) {
      console.log('stopping ' + name)
      const service = this.services[name]
      service.stop()
    }
  }

}