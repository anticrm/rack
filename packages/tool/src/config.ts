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

import { Module } from './types'
import { HttpModule } from './modules/http'
import { HttpAuth } from './modules/httpAuth'
import { Rpc } from './modules/rpc'

import { Project } from "ts-morph"

export class Configuration {

  private modules = new Map<string, Module>()
  private project!: Project
  private config!: { [key: string]: object }

  createModule(moduleId: string) {
    switch (moduleId) {
      case 'http':
        return new HttpModule()
      case 'http-auth':
        return new HttpAuth()
      case 'rpc':
        return new Rpc()
      default:
        throw new Error('Invalid module kind: ' + moduleId)
    }
  }

  getModule(moduleId: string): Module {
    const module = this.modules.get(moduleId)
    if (module)
      return module
    else {
      const module = this.createModule(moduleId)
      this.modules.set(moduleId, module)
      return module
    }
  }

  load(config: { [key: string]: object }) {
    this.config = config
    for(const moduleId in config) {
      const module = this.getModule(moduleId)
      module.load(config[moduleId])
    }
  }

  loadProject(root: string) {
    this.project = new Project({
      tsConfigFilePath: root + '/tsconfig.json'
    })
    
    const sourceFiles = this.project.getSourceFiles()
    
    sourceFiles.forEach(sourceFile => {
      console.log(sourceFile.getFilePath())
    })    
  }

  configure() {
    for (const module of this.modules) {
      module[1].configure(this.project)
    }

    const sourceFile = this.project.createSourceFile("/boot.ts", writer => {
      writer
          .writeLine("const config = JSON.parse('" + JSON.stringify(this.config) + "')").blankLine()
          .writeLine("import { configure } from '@anticrm/rack'").blankLine()
          .writeLine("import api from './api'").blankLine()
          .writeLine("const runtime = configure(config, { api })").blankLine()
          .writeLine("runtime.start()").blankLine()
    })
    sourceFile.emitSync()
  }
}