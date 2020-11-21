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

import repl from 'repl'
import net from 'net'

import { Node } from './node'

console.log('rackOS 0.1.0 Copyright (c) 2020 Anticrm Platform Contributors. All rights reserved.')

const node = new Node()
node.boot()

const evalFunction = (code: string, context: object, file: string, cb: (err: Error | null, result: any) => void) => {
  try {
    const result = node.exec(code)
    cb(null, result)
  } catch(err) {
    cb(err, undefined)
  }
}

const options = { 
  useColors: true, 
  prompt: 'rackOS> ',
  eval: evalFunction
}

net.createServer((socket) => {
  repl.start({
    ...options,
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  })
}).listen(5001)

const instance = repl.start(options)


