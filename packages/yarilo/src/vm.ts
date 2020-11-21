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

export type Proc = (pc: PC) => any
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
        if (item.hasOwnProperty('path')) {
          const path = (item as any).path
          const bound = boundFactory(path[0])
          if (bound) {
            word.bound = bound
          }
        } else {
          const code = item as Code
          bind(code, boundFactory)
        }
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

  exec(code: Code): any {
    return new PC(this, code).exec()
  }

}

export class PC { 
  code: Code
  pc: number
  vm: VM

  constructor(vm: VM, code: Code) { 
    this.code = code
    this.pc = 0
    this.vm = vm
  }

  next(): any {
    const item = this.code[this.pc++]
    switch (typeof item) {
      case 'object':
        const word = item as Word
        switch (word.kind) {
          case WordKind.SetWord: 
            const x = this.next()
            if (!word.bound)
              throw new Error('word not bound ' + word)
            word.bound.set(word.sym, x)
            return x
          case undefined:
            if (item.hasOwnProperty('path')) {
              const path = (item as any).path as string[]
              const bound = (item as any).bound
              if (!bound)
                throw new Error('path not bound')
              return path.slice(1).reduce((acc, val) => acc[val], bound.get(path[0]))
            } else {
              return item
            }
          default:
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
      result = this.next()
    }
    return result
  }
}

export interface Context {
  vm: VM
}
