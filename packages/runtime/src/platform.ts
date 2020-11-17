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

import { Status, Config, Module, Runtime } from './types'
import { configureHttp } from './modules/http'
import { configureRpc } from './modules/rpc'
import { RpcService } from './services/rpc'

export class Platform {
  readonly config: Config
  private mode: 'development' | 'production'
  private services: { [name: string]: any } = {}
  private runtime: Runtime

  constructor(config: Config, impl: { [key: string]: object }, mode: 'development' | 'production') { 
    this.config = config 
    this.mode = mode

    this.runtime = new Runtime()
    this.runtime.impl = impl
  
    configureRpc(config, this.runtime)
    configureHttp(this, config, this.runtime)
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
      switch(name) {
        case 'redis':
          const redisConfig = this.getServiceConfig('redis')
          const client = redis.createClient(redisConfig)
          this.services['redis'] = client
          return client
        case 'rpc':
          const service = new RpcService(this)
          this.services['rpc'] = service
          return service
        default:
          throw new Error('Unknown service ' + name)
      }
    }
  }

  start(): (() => void)[] {
    console.log('starting platform')
    return this.runtime.start()
  }

}