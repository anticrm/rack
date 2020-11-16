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

export interface Config {
  [key: string]: object
}

export class Module {
  protected config: { [key: string]: any }
  configured = false

  constructor(config: { [key: string]: any }) {
    this.config = config
  }

  dependencies(): string[] { return [] }
  configure(runtime: Runtime) {}
}

export interface Request {
  getHeaders(): { [key: string]: string | undefined }
  getQuery(query: string): string | string[] | undefined
}

export interface Response {
  writeHead(status: number): void
  end(chunk?: any): void
  send(data: object | string): void
  headersSent(): boolean
}

export interface Auth {}
export type AuthMethod = (request: Request) => Auth | null

export class Context {
  auth?: Auth
}

export type Middleware = (ctx: Context, request: Request, response: Response) => Promise<void>

export class Runtime {
  impl: Config
  funcs: { [name: string]: (ctx: Context, args: any[]) => Promise<any> | undefined } = {}
  auth?: AuthMethod
  services: (() => () => void)[] = []

  start(): (() => void)[] { 
    return this.services.map(s => s())
  }
}
