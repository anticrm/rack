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

type WordFunc = (ctx: Context) => any
type Dict = { [key: string]: any }
export type Bound = { 
  get: (sym: string) => any
  set: (sym: string, value: any) => void
}

export enum WordKind { 
  Word = 0,
  GetWord,
  SetWord,
  Quote
}

export class Word {
  readonly kind: WordKind
  readonly sym: string
  bound?: Bound

  constructor(kind: WordKind, sym: string) {
    this.kind = kind
    this.sym = sym
  }
}

export type CodeItem = Word | number | string | CodeItem[]
export type Code = CodeItem[]


export function bind(code: Code, boundFactory: (sym: string) => Bound | undefined) {
  let i = 0
  while (i < code.length) {
    const item = code[i]
    if (typeof item === 'object') {
      const word = item as Word
      if (word.sym) {
        const bound = boundFactory(word.sym)
        if (bound) {
          word.bound = bound
        }
      } else {
        const code = item as Code
        bind(code, boundFactory)
      }
    }
    i++
  }
}

export class VM {
  dictionary: Dict = {}
  stack: any[] = []

  bind(code: Code) {
    bind(code, () => {
      return { 
        get: (sym: string) => this.dictionary[sym],
        set: (sym: string, value: any) => this.dictionary[sym] = value
      }
    })
  }

}

export class Context { 
  vm: VM
  code: Code
  pc: number

  constructor(vm: VM, code: Code) { 
    this.vm = vm
    this.code = code
    this.pc = 0
  }

  single(): any {
    const item = this.code[this.pc++]
    switch (typeof item) {
      case 'object':
        const word = item as Word
        switch (word.kind) {
          case WordKind.SetWord: 
            const x = this.single()
            if (!word.bound)
              throw new Error('word not bound ' + word)
            word.bound.set(word.sym, x)
            return x
          case undefined:
            return item
          default:
            // const f = this.vm.dictionary[word.sym]
            if (!word.bound)
              throw new Error('word not bound ' + word)
            const f = word.bound.get(word.sym)
            return typeof f === 'function' ? f(this) : f
        }
      case 'number':
      case 'string':
        return item
    }
  }

  exec(): any { 
    let result
    while (this.pc < this.code.length) {
      result = this.single()
    }
    return result
  }
}
