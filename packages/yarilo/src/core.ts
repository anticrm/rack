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

import { Context, Code, CodeItem, Word, Bound, bind } from './vm'

export function add (ctx: Context): any {
  const x = ctx.single()
  const y = ctx.single()
  return x + y
}

export function sub (ctx: Context): any {
  const x = ctx.single()
  const y = ctx.single()
  return x - y
}

export function proc(ctx: Context): any {
  const params = ctx.single() as Code
  const code = ctx.single()

  const offset: { [key: string]: number } = {}
  params.forEach((param: CodeItem, index: number) => {
    const word = param as Word
    offset[word.sym] = index - params.length
  })

  const vm = ctx.vm

  bind(code, (sym: string): Bound | undefined => {
    if (offset[sym]) {
      return { 
        get: (sym: string): any => vm.stack[vm.stack.length + offset[sym]],
        set: (sym: string, value: any) => vm.stack[vm.stack.length + offset[sym]] = value
      }  
    }
  })

  return (ctx: Context): any => {
    params.forEach(item => {
      vm.stack.push(ctx.single())      
    })
    const func = new Context(vm, code)
    const x = func.exec()
    vm.stack.length = vm.stack.length - params.length
    return x
  }
}

export function either(ctx: Context) {
  const cond = ctx.single()
  const ifTrue = ctx.single()
  const ifFalse = ctx.single()

  if (cond) {
    return new Context(ctx.vm, ifTrue).exec()
  } else {
    return new Context(ctx.vm, ifFalse).exec()
  }
}

export function gt(ctx: Context) {
  const x = ctx.single()
  const y = ctx.single()
  return x > y
}

export function eq(ctx: Context) {
  const x = ctx.single()
  const y = ctx.single()
  return x === y
}
