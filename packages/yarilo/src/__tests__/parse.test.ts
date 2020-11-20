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

import { parse } from '../parse'

import { VM, Context } from '../vm'
import { add, proc } from '../core'

describe("parse", () => {


  it('should parse', () => {
    const x = parse('add 1 2')
    console.log(x)
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('add 1 2')
    const vm = new VM()
    vm.dictionary['add'] = add
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.single())
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('x: 7 y: 8 add x y')
    const vm = new VM()
    vm.dictionary['add'] = add
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.exec())
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('x: proc [n] [n n] x 5')
    console.log(x)
    const vm = new VM()
    vm.dictionary['add'] = add
    vm.dictionary['proc'] = proc
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.exec())
    expect(true).toBe(true)
  })

})