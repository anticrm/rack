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
import { FuncConfig } from '@anticrm/rack/src/modules/rpc'
import { FunctionDeclaration, Project } from "ts-morph"

function transpile(project: Project) {

  const sourceFile = project.getSourceFile(f => f.getFilePath().endsWith('api.ts'))
  if (!sourceFile)
    throw new Error('source file not found for endpoint ' + 'api')

  console.log(sourceFile.emitSync())
}

export class Rpc extends Module {

  private config!: { [key: string]: FuncConfig }

  load(config: { [key: string]: FuncConfig }): void {
    this.config = config
  }
  

  configure(project: Project) {
    for (const func in this.config) {
      const funcConfig = this.config[func]
    }
    transpile(project)
  }  
}
