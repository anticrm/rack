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

import { VM, PC, Suspend } from '../vm'
import { boot } from '../boot'
import { Readable } from 'stream'

describe("parse", () => {


  it('should parse', () => {
    const x = parse('add 1 2')
    expect(x[1]).toBe(1)
  })

  it('should parse', () => {
    const x = parse('add "1" "2"')
    expect(x[1]).toBe("1")
  })

  it('should parse', () => {
    const x = parse('add 1 core/data')
    expect(true).toBe(true)
  })

  it('should execute', () => {
    const x = parse('core/b/c')
    const vm = new VM()
    vm.dictionary['core'] = { a: 1, b: { c: 5 } }
    vm.bind(x)
    expect(vm.exec(x)).toBe(5)
  })

  it('should execute', () => {
    const x = parse('add 1 2')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(3)
  })

  it('should execute', () => {
    const x = parse('1 + 2 * 3')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(9)
  })

  it('should execute', () => {
    const x = parse('1 + (2 * 3)')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(7)
  })

  it('should execute', () => {
    const x = parse('1 + 2')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(3)
  })

  it('should execute', () => {
    const x = parse('1 + 2 + 3')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(6)
  })

  it('should execute', () => {
    const x = parse('x: 7 y: 8 add x y')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(15)
  })

  it('should execute', () => {
    const x = parse('x: proc [n] [add n 10] x 5')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(15)
  })

  it('should execute', () => {
    const x = parse('gt 7 8 gt 8 7 eq 7 7 eq 7 8')
    const vm = boot()
    vm.bind(x)
    const ctx = new PC(vm, x)
    expect(ctx.next()).toBe(false)
    expect(ctx.next()).toBe(true)
    expect(ctx.next()).toBe(true)
    expect(ctx.next()).toBe(false)
  })

  it('should execute', () => {
    const x = parse('either gt 1 2 [5] [6]')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(6)
  })

  it('should execute', () => {
    const x = parse('fib: proc [n] [either gt n 1 [add fib sub n 1 fib sub n 2] [n]] fib 20')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(6765)
  })

  it('should execute', () => {
    const x = parse('add add 1 2 3')
    const vm = boot()
    vm.bind(x)
    expect(vm.exec(x)).toBe(6)
  })

  it('should execute', async (done) => {
    const x = parse('pipe write "7777" passthrough')
    const vm = boot()
    vm.bind(x)
    const suspend: Suspend = vm.exec(x)
    suspend.resume().then(res => { done() })
  })

  it('should execute', async (done) => {
    const x = parse('(write "7777") | passthrough | passthrough')
    const vm = boot()
    vm.bind(x)
    console.log(vm.exec(x))
    const suspend: Suspend = vm.exec(x)
    suspend.resume().then(res => { done() })
  })

})
