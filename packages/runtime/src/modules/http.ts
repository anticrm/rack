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

import Trouter, { HTTPMethod } from 'trouter'
import { Module, Runtime, Middleware, Config, Request, Response, Context } from '../types' 
import { toCamelCase } from '../utils'
import { parse } from 'querystring'

import http from 'http'
import type { IncomingMessage, ServerResponse } from 'http'
import { RpcConfig, createValidator, Parameter } from './rpc'
import { Platform } from '../platform'

interface HttpConfig {
  [key: string]: EndpointConfig
}

export interface EndpointConfig {
  [method: string]: MethodConfig
}

export interface MethodConfig {
  auth: boolean
  map: string
  parameters: HttpParameter[]
}

interface HttpParameter extends Parameter {
  in: 'query' | 'body',
  optional?: boolean
}

const methods: { [key: string]: HTTPMethod | undefined } = {
  get: 'GET',
  post: 'POST'
}

function httpMethod(method: string): HTTPMethod {
  const httpMethod = methods[method]
  if (!httpMethod)
    throw new Error('Invalid http method: ' + method)
  return httpMethod
}

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function getParameterFunction(config: HttpParameter) {
  switch(config.in) {
    case 'query':
      return (request: Request) => {
        const value = request.getQuery(config.name)
        if (!value && !config.optional)
          throw new HttpError(400, 'missed required parameter ' + config.name)
        return value
      }
    case 'body':
      return (request: Request) => {
        console.log('request body todo')
      }
    default:
      throw new Error('Invalid parameter: ' + config.name)
  }
}

function createHandler(runtime: Runtime, method: string, endpoint: string, config: MethodConfig): Middleware {
  console.log('createHandler for', config)

  // const funcName = toCamelCase(config.map)
  // const func = runtime.funcs[funcName]
  // if (!func) {
  //   throw new Error('Implementation not found, function: ' + funcName)
  // }

  const httpEndpoints = runtime.impl.http as any
  if (!httpEndpoints)
    throw new Error('HTTP endpoint implementations does not provided')
  const endpointImpl = httpEndpoints[endpoint]
  if (!httpEndpoints)
    throw new Error('HTTP endpoint implementation does not provided ' + endpoint)
  const impl = endpointImpl[method]
  if (!impl) {
    throw new Error('Implementation not found for ' + endpoint + ' ' + method)
  }
  const func = (ctx: Context, args: any[]) => impl.apply(ctx, args)

  const parameters = config.parameters || []
  const paramFunc = parameters.map((p, i) => getParameterFunction(p))
  const validators = parameters.map(p => createValidator(p))

  return async (ctx: Context, req: Request, res: Response): Promise<void> => {
    try {
      if (config.auth) {
        const auth = runtime.auth ? runtime.auth(req) : null
        if (!auth)
          throw new HttpError(401, 'Authorization required')
        ctx.auth = auth
      }
      ctx.body = req.getBody()
      const params = paramFunc.map((f, i) => validators[i](f(req)))
      const result = await func(ctx, params)
      if (!res.headersSent()) {
        res.send(result)
      }
    } catch (err) {
      console.log(err)
      if (err instanceof HttpError) {
        res.writeHead(err.status)
        res.end()
      } else {
        res.writeHead(500)
        res.end()
      }
    }
  }
}

function createServer(platform: Platform, router: Trouter, port: number): () => () => void { 

  class NodeRequest implements Request {
    private req: IncomingMessage
    private query?: NodeJS.Dict<string | string[]>
    private body: Promise<string>

    constructor(req: IncomingMessage) { 
      this.req = req 
      this.body = new Promise<string>((resolve, reject) => {
        const requestBody: Buffer[] = []
        req.on('data', (chunks) => {
          console.log('data', chunks.toString())
          requestBody.push(chunks)
        })
        req.on('end', () => {
          const data = Buffer.concat(requestBody).toString()
          console.log('end', data)
          resolve(data)
        })
      })
    }

    getBody(): Promise<string | object> { return this.body }

    getHeaders(): { [key: string]: string | undefined } { return this.req.headers as { [key: string]: string | undefined } }

    getQuery(query: string): string | string[] | undefined {
      if (!this.query) {
        if (this.req.url) {
          const i = this.req.url.indexOf('?')
          if (i > -1) {
            const qs = this.req.url.substring(i + 1)
            this.query = parse(qs)
          } else {
            this.query = {}
          }
        } else {
          this.query = {}
        }
      }
      return this.query[query]
    }
  }

  class NodeResponse implements Response {

    private res: ServerResponse
    constructor(res: ServerResponse) { this.res = res }

    writeHead(status: number, headers?: { [key: string]: string }): void {
      this.res.writeHead(status, headers)
    }

    end(chunk?: any): void  {
      this.res.end(chunk)
    }

    send(data: object | string) {
      switch (typeof data) {
        case 'object':
          this.writeHead(200, { 'Content-Type': 'application/json' })
          this.end(JSON.stringify(data))
          break
        case 'number':
        case 'string':
          this.writeHead(200, { 'Content-Type': 'text/plain' })
          this.end(data.toString())
          break
        default:
          throw new Error('unsupported data type ' + typeof data)
      }
    }

    headersSent(): boolean { return this.res.headersSent }
  }

  return () => {
    console.log('starting http server...')

    const requestListener = (nodeReq: IncomingMessage, nodeRes: ServerResponse) => {
      if (!nodeReq.url) {
        nodeRes.writeHead(403)
        nodeRes.end()
        return
      }
      const i = nodeReq.url.indexOf('?')
      const url = i === -1 ? nodeReq.url : nodeReq.url.substring(0, i)
      const route = router.find(nodeReq.method as HTTPMethod, url)
      if (route.handlers.length === 0) {
        nodeRes.writeHead(404)
        nodeRes.end()
      } else {
        const middleware: Middleware = route.handlers[0]
        const ctx = new Context(platform)
        const req = new NodeRequest(nodeReq)
        const res = new NodeResponse(nodeRes)
        middleware(ctx, req, res).then(res => {
          console.log('middleware return', res)
        })
        .catch(err => {
          console.log('middleware err', err)
        })
      }
    }
    
    const server = http.createServer(requestListener)
    server.listen(port)

    return () => {
      server.close()
    }
  }
}

export function configureHttp(platform: Platform, config: Config, runtime: Runtime) {
  console.log('configure http')
  const http = config.http as HttpConfig
  const rpc = config.rpc as RpcConfig

  const router = new Trouter()
  for (const endpoint in http) {
    const endpointConfig = http[endpoint]
    for (const method in endpointConfig) {
      const methodConfig = endpointConfig[method]
      const funcName = methodConfig.map
      const funcConfig = rpc[funcName]
      // console.log('configure', endpoint, method, methodConfig, funcConfig)
      router.add(httpMethod(method), endpoint, createHandler(runtime, method, endpoint, methodConfig))
    }
  }
  runtime.services.push(createServer(platform, router, 8080))
}