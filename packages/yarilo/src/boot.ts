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

import { PC, Code, Proc, VM } from "./vm"
import core from './core'
import { parse } from './parse'

function native(pc: PC): Proc {
  const params = pc.next() as Code
  const impl = pc.next() as Function

  return (pc: PC): any => {
    const values = params.map(param => pc.next())
    return impl.apply(pc, values)
  }
}

const bootSeq = `
add: native [x y] core/add
sub: native [x y] core/sub

gt: native [x y] core/gt
eq: native [x y] core/eq

proc: native [params code] core/proc
either: native [cond ifTrue ifFalse] core/either
`

export function boot(): VM {
  const vm = new VM()
  vm.dictionary['native'] = native
  vm.dictionary['core'] = core
  const bootCode = parse(bootSeq)
  vm.bind(bootCode)
  vm.exec(bootCode)
  return vm
}
