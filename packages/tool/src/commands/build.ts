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

import {Command, flags} from '@oclif/command'

import { safeLoad } from 'js-yaml'
import { readFileSync } from 'fs'
import { sep } from 'path'

import { Configuration } from '../config'

export default class Hello extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ example-multi-ts hello
hello world from ./src/hello.ts!
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'path'}]

  async run() {
    const {args, flags} = this.parse(Hello)

    console.log('processing ' + args.path)

    const root = args.path || '.'

    const doc = safeLoad(readFileSync(`${root}${sep}api.yml`, 'utf8')) as { [key: string]: object }
    const config = new Configuration()
    config.load(doc)
    config.loadProject(root)
    config.configure()
    
    console.log(JSON.stringify(doc))
    
  }
}