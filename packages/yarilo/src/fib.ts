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

import { parse } from './parse'
import { boot } from './boot'

const x = parse('fib: proc [n] [either gt n 1 [add fib sub n 1 fib sub n 2] [n]] fib 40')
const vm = boot()
vm.bind(x)
const result = vm.exec(x)
console.log(result)
