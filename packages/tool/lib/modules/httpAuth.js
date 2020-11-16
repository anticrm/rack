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
exports.HttpAuth = void 0;
const types_1 = require("../types");
class HttpAuth extends types_1.Module {
    load(config) {
        for (const name in config) {
            const endpointConfig = config[name];
            this.config = endpointConfig;
            console.log(name, endpointConfig);
        }
    }
}
exports.HttpAuth = HttpAuth;
