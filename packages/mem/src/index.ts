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

import { Context, VM, parse, parseAndExec } from '@anticrm/yarilo'
import redis, { RedisClient } from 'redis'

function createModule() {

  let client: RedisClient

  function getClient(vm: VM): RedisClient {
    if (client)
      return client
    const config = parseAndExec(vm, 'get-service-config "redis"') || {}
    const port = config.port || 6379
    const host = config.host || '127.0.0.1'
    client = redis.createClient({ host, port })
    return client
  }

  return { 
    set (this: Context, key: string, value: string) {
      return getClient(this.vm).set(key, value)
    },
    async get (this: Context, key: string) {
      return new Promise((resolve, reject) => {
        getClient(this.vm).get(key, (err: Error | null, reply: string | null) => {
          if (err) {
            reject(err)
          } else if (reply) {
            this.out.write(reply)
            resolve()
          } else {
            reject(new Error('key not found ' + key))
          }
        })  
      })
    }
  }
}

const Y = `
set: native [key value] mem/set
get: native-async [key] mem/get
`

export default function (vm: VM) {
  vm.dictionary['mem'] = createModule()
  const bootCode = parse(Y)
  vm.bind(bootCode)
  vm.exec(bootCode)
}
