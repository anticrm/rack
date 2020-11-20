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

import { Word, WordKind } from './vm'

const zero = '0'.charCodeAt(0)
const nine = '9'.charCodeAt(0)

function isDigit(charCode: number): boolean {
  return charCode >= zero && charCode <= nine
}

export function parse(s: string, pos: number = 0): any[] {
  const results = []
  let result: any[] = []
  let i = pos
  while (i < s.length) {
    switch (s.charAt(i)) {
      case ' ':
        i++
        break
      case ']':
        i++
        const code = result
        result = results.pop() as any[]
        result.push(code)
        break
      case '[':
        i++
        //result.push(parse(s, i))
        results.push(result)
        result = []
        break
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        let val = 0
        while (i < s.length && isDigit(s.charCodeAt(i))) {
          val = val * 10 + s.charCodeAt(i) - zero
          i++
        }
        result.push(val)
        break
      case '"':
        let str = ""
        while (++i < s.length && s.charAt(i) !== '"')
        result.push(str)
        break
      default:
        let ident = ''
        let kind = WordKind.Word
        const c = s.charAt(i)
        if (c === '\'')
          kind = WordKind.Quote
        else if (c === ':')
          kind = WordKind.GetWord

        while (i < s.length && ' [](){}:;'.indexOf(s.charAt(i)) === -1) {
          ident += s.charAt(i)
          i++
        }

        if (s.charAt(i) === ':') {
          kind = WordKind.SetWord
          i++
        }

        result.push(new Word(kind, ident))
        break
    }
  }
  return result
}
