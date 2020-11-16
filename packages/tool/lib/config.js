"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Configuration = void 0;
const http_1 = require("./modules/http");
const httpAuth_1 = require("./modules/httpAuth");
const rpc_1 = require("./modules/rpc");
const ts_morph_1 = require("ts-morph");
class Configuration {
    constructor() {
        this.modules = new Map();
    }
    createModule(moduleId) {
        switch (moduleId) {
            case 'http':
                return new http_1.HttpModule();
            case 'http-auth':
                return new httpAuth_1.HttpAuth();
            case 'rpc':
                return new rpc_1.Rpc();
            default:
                throw new Error('Invalid module kind: ' + moduleId);
        }
    }
    getModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (module)
            return module;
        else {
            const module = this.createModule(moduleId);
            this.modules.set(moduleId, module);
            return module;
        }
    }
    load(config) {
        this.config = config;
        for (const moduleId in config) {
            const module = this.getModule(moduleId);
            module.load(config[moduleId]);
        }
    }
    loadProject(root) {
        this.project = new ts_morph_1.Project({
            tsConfigFilePath: root + '/tsconfig.json'
        });
        const sourceFiles = this.project.getSourceFiles();
        sourceFiles.forEach(sourceFile => {
            console.log(sourceFile.getFilePath());
        });
    }
    configure() {
        const code = [];
        for (const module of this.modules) {
            code.push('// ' + module[0]);
            code.push(...module[1].configure(this.project));
        }
        const sourceFile = this.project.createSourceFile("/boot.ts", writer => {
            writer
                .writeLine("const config = JSON.parse('" + JSON.stringify(this.config) + "')")
                .writeLine("import { configure } from '@anticrm/rack'");
            code.forEach(c => writer.writeLine(c));
            writer
                .writeLine("const runtime = configure(config, { api, http })")
                .writeLine("runtime.start()");
        });
        sourceFile.emitSync();
    }
}
exports.Configuration = Configuration;
