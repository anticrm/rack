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

import { PC, Code, Proc, VM, Context } from "./vm"
import core from './core'
import { PassThrough, Readable } from 'stream'

function native(pc: PC): Proc {
  const params = pc.next() as Code
  const impl = pc.next() as Function

  return (pc: PC): any => {
    const values = params.map(param => pc.next())
    return impl.apply(pc, values)
  }
}

function nativeAsync(pc: PC): Proc {
  const params = pc.next() as Code
  const impl = pc.next() as Function

  return (pc: PC): any => {
    const values = params.map(param => pc.next())
    const out = new PassThrough()
    return { 
      resume: (input?: Readable): Promise<void> => {
        const ctx = {
          vm: pc.vm,
          out,
          input
        }
        return impl.apply(ctx, values)
      },
      out,
      x: 'na'
    }
  }
}

function nativeInfix(pc: PC) {
  const params = pc.next() as Code
  const impl = pc.next() as Function

  return (pc: PC, first: any, second: any): any => {
    if (!first) {
      console.log(pc)
      throw new Error('first not defined')
    }
    const values = [first, second]
    return impl.apply(pc, values)
  }
}

export function boot(): VM {
  const vm = new VM()
  vm.dictionary['native'] = native
  vm.dictionary['native-infix'] = nativeInfix
  vm.dictionary['native-async'] = nativeAsync
  core(vm)
  return vm
}
