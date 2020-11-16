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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const js_yaml_1 = require("js-yaml");
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("../config");
class Hello extends command_1.Command {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const { args, flags } = this.parse(Hello);
            console.log('processing ' + args.path);
            const root = args.path || '.';
            const doc = js_yaml_1.safeLoad(fs_1.readFileSync(`${root}${path_1.sep}api.yml`, 'utf8'));
            const config = new config_1.Configuration();
            config.load(doc);
            config.loadProject(root);
            config.configure();
            console.log(JSON.stringify(doc));
        });
    }
}
exports.default = Hello;
Hello.description = 'describe the command here';
Hello.examples = [
    `$ example-multi-ts hello
hello world from ./src/hello.ts!
`,
];
Hello.flags = {
    help: command_1.flags.help({ char: 'h' }),
};
Hello.args = [{ name: 'path' }];
