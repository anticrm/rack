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
import { add, proc, gt, eq, either, sub } from '../core'

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
    const x = parse('x: proc [n] [add n 10] x 5')
    console.log(x)
    const vm = new VM()
    vm.dictionary['add'] = add
    vm.dictionary['proc'] = proc
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.exec())
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('x: proc [n] [add n 10] x 5')
    console.log(x)
    const vm = new VM()
    vm.dictionary['add'] = add
    vm.dictionary['proc'] = proc
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.exec())
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('gt 7 8 gt 8 7 eq 7 7 eq 7 8')
    const vm = new VM()
    vm.dictionary['gt'] = gt
    vm.dictionary['eq'] = eq
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.single())
    console.log(ctx.single())
    console.log(ctx.single())
    console.log(ctx.single())
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('either gt 1 2 [5] [6]')
    const vm = new VM()
    vm.dictionary['gt'] = gt
    vm.dictionary['eq'] = eq
    vm.dictionary['either'] = either
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.single())
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('fib: proc [n] [either gt n 1 [add fib sub n 1 fib sub n 2] [n]] fib 20')
    const vm = new VM()
    vm.dictionary['gt'] = gt
    vm.dictionary['eq'] = eq
    vm.dictionary['either'] = either
    vm.dictionary['add'] = add
    vm.dictionary['sub'] = sub
    vm.dictionary['proc'] = proc
    vm.bind(x)
    const ctx = new Context(vm, x)
    console.log(ctx.exec())
    expect(true).toBe(true)
  })

})
