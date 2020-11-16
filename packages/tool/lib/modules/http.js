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
exports.HttpModule = void 0;
const types_1 = require("../types");
function createApiMapping(project, method, endpoint, config) {
    console.log('createHandler for', config);
    const sourceFile = project.getSourceFile(f => f.getFilePath().endsWith(endpoint + '.ts'));
    if (!sourceFile)
        throw new Error('source file not found for endpoint ' + endpoint);
    console.log(sourceFile.emitSync());
    const functions = sourceFile.getFunctions();
    const handler = functions.find(f => f.getName() === method);
    if (!handler)
        throw new Error('handler function not found, method: ' + method);
    const parameters = handler.getParameters();
    const paramsImplementationToApi = parameters.map(param => {
        let i = -1;
        const name = param.getName();
        switch (name) {
            case 'body':
                i = config.parameters.length;
                break;
            case 'auth':
                i = config.parameters.length + 1;
                break;
            default:
                i = config.parameters.findIndex(p => p.name === name);
        }
        if (i === -1) {
            throw new Error('invalid parameter ' + name);
        }
        return i;
    });
    console.log(paramsImplementationToApi);
    return paramsImplementationToApi;
}
class HttpModule extends types_1.Module {
    load(config) {
        this.config = config;
    }
    configure(project) {
        for (const endpoint in this.config) {
            const config = this.config[endpoint];
            for (const method in config) {
                const methodConfig = config[method];
                console.log('configure', endpoint, method, methodConfig);
                // methodConfig.apiMapping = createApiMapping(project, method, endpoint, methodConfig)
            }
        }
    }
}
exports.HttpModule = HttpModule;