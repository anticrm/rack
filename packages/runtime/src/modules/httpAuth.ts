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

import { decode } from 'jwt-simple'
import { Module, Runtime, Auth, Request, AuthMethod } from '../types' 

interface Bearer extends Auth {
  token: string
}

interface Jwt extends Bearer {
  payload: object
}

interface AuthConfig {
  type: 'bearer',
  bearerFormat: 'jwt'
}

const secret = 'keyboard panda slim'

function createAuthFunction(config: AuthConfig): AuthMethod {
  if (config.type === 'bearer' && config.bearerFormat === 'jwt') {
    return (req: Request): Auth | null => {
      const header = req.getHeaders()['authorization']
      if (!header)
        return null
      const parts = header.split(' ')
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null
      }
      const token = parts[1]
      const payload = decode(token, secret)
      return { token, payload }
    }
  } else {
    throw new Error('only jwt bearer auth is supported')
  }
}

export class HttpAuth extends Module {

  configure(runtime: Runtime) {
    console.log('configure http-auth')
    const funcs: AuthMethod[] = []
    for (const auth in this.config) {
      const authConfig = this.config[auth]
      console.log('configure auth', auth, authConfig)
      funcs.push(createAuthFunction(authConfig))
    }
    if (funcs.length !== 1) {
      throw new Error('only single auth method currently supported')
    }
    runtime.auth = funcs[0]
  }
}
