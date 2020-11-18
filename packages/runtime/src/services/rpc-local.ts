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

import { RedisClient } from "redis"
import { Platform } from "../platform"
import { JsonRpcResponse, JSON_RPC_METHOD_NOT_FOUND } from '../modules/jsonrpc'
import { CoreError, Auth, Service } from '../types'

import { Config, Context, Middleware, Runtime, Request, Response } from '../types' 
import { toCamelCase } from '../utils'
import { JsonRpcRequest } from '../modules/jsonrpc'

export const RPC_CONFIG = 'rpc'

export interface RpcRequest {
  uid: string
  method: string
  params: any[]
}

export interface RpcResultResponse {
  uid: string
  result: any
}

export interface RpcErrorResponse {
  uid: string
  error: {
    code: number,
    message: string
  }
}

export interface RpcConfig {
  [key: string]: FuncConfig
}

export interface Parameter {
  name: string
  optional?: boolean
  schema: Schema
}

export interface Schema {
  type: string
}

export interface FuncConfig {
  auth?: boolean
  parameters?: Parameter[]
  response?: object
}

export function createValidator(parameter: Parameter): (value: any) => any {
  switch(parameter.schema.type) {
    case 'integer':
      return x => parseInt(x, 10)
    default:
      throw new Error('unsupported schema type')
  }
}

function createMethod(funcName: string, config: FuncConfig, runtime: { [key: string]: object } ) {
  const parameters = config.parameters || []
  const validators = parameters.map(p => createValidator(p))
  const impl = (runtime.api as new () => {}).prototype[funcName] as (...args: any[]) => any
  if (!impl) {
    throw new Error('function implementation not provided ' + funcName)
  }

  return (ctx: Context, args: any[]) => impl.apply(ctx, args.map((arg, index) => validators[index](arg)))
}

export class RpcService implements Service {

  private platform!: Platform
  private funcs: { [key: string]: (ctx: Context, args: any[]) => any } = {}

  configure (platform: Platform) { 
    this.platform = platform

    console.log('configure rpc')
    const rpc = platform.config.rpc as RpcConfig
    for (const func in rpc) {
      const funcConfig = rpc[func]
      console.log('configure', func)
      const funcName = toCamelCase(func)
      console.log('function', funcName)
      this.funcs[funcName] = createMethod(funcName, funcConfig, platform.runtime)
    }
  }

  start(): void {    
  }

  stop() {
  }

}