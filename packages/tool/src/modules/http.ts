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

import { Module } from '../types' 

import { FunctionDeclaration, Project } from "ts-morph"
import { EndpointConfig, MethodConfig } from '@anticrm/rack/src/modules/http'


function createApiMapping(project: Project, method: string, endpoint: string, config: MethodConfig): number[] {
  console.log('createHandler for', config)

  const sourceFile = project.getSourceFile(f => f.getFilePath().endsWith(endpoint + '.ts'))
  if (!sourceFile)
    throw new Error('source file not found for endpoint ' + endpoint)

  console.log(sourceFile.emitSync())

  const functions = sourceFile.getFunctions()
  const handler = functions.find(f => f.getName() === method)
  if (!handler)
    throw new Error('handler function not found, method: ' + method)

  const parameters = handler.getParameters()

  const paramsImplementationToApi = parameters.map(param => {
    let i = -1
    const name = param.getName()
    switch (name) {
      case 'body':
        i = config.parameters.length
        break
      case 'auth':
        i = config.parameters.length + 1
        break
      default:
        i = config.parameters.findIndex(p => p.name === name)
    }
    if (i === -1) {
      throw new Error('invalid parameter ' + name)
    }
    return i
  })

  console.log(paramsImplementationToApi)
  return paramsImplementationToApi
}

export class HttpModule extends Module {

  private config!: { [key: string]: EndpointConfig }

  load(config: { [key: string]: object }): void {
    this.config = config as { [key: string]: EndpointConfig }
  }



  configure(project: Project) {
    const code: string[] = []

    code.push('const http = {}')
    console.log('roots', project.getRootDirectories())

    for (const endpoint in this.config) {
      const config = this.config[endpoint]
      code.push(`http['${endpoint}'] = {}`)

      for (const method in config) {
        const methodConfig = config[method]
        console.log('configure', endpoint, method, methodConfig)
        // methodConfig.apiMapping = createApiMapping(project, method, endpoint, methodConfig)

        const sourceFile = project.getSourceFile(f => f.getFilePath().endsWith(endpoint + '.ts'))
        if (!sourceFile)
          throw new Error('source file not found for endpoint ' + endpoint)
      
        sourceFile.emitSync()
        const name = endpoint.substring(1)
        const impl = '__' + method + '_' + name
        code.push(`import { ${method} as ${impl} } from '${'./http' + endpoint}'`)
        code.push(`http['${endpoint}']['${method}'] = ${impl}`)
      }
    }

    console.log(code)
    return code
  }
}
