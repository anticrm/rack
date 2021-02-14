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

package yar

import (
	"strings"
)

type codeStack []Block

func (s *codeStack) push(code Block) {
	*s = append(*s, code)
}

func (s *codeStack) pop() Block {
	index := len(*s) - 1
	element := (*s)[index]
	*s = (*s)[:index]
	return element
}

func isDigit(c rune) bool {
	return c >= '0' && c <= '9'
}

func readIdent(reader *strings.Reader) (string, rune) {
	var builder strings.Builder
	for c, _, err := reader.ReadRune(); err == nil; c, _, err = reader.ReadRune() {
		if strings.IndexRune(" \n[](){}:;/", c) == -1 {
			builder.WriteRune(c)
		} else {
			// reader.UnreadRune()
			return builder.String(), c
		}
	}
	return builder.String(), 0
}

func (vm *VM) Parse(s string) Block {
	var stack codeStack
	result := vm.allocBlock()

	reader := strings.NewReader(s)

	for c, _, err := reader.ReadRune(); err == nil; c, _, err = reader.ReadRune() {
		switch c {
		case ' ', '\t', '\n', '\r': /*nothing*/

		case ']':
			code := result
			result = stack.pop()
			result.add(vm, code.Value())

		case '[':
			stack.push(result)
			result = vm.allocBlock()

		case '0', '1', '2', '3', '4', '5', '6', '7', '8', '9':
			val := int(c - '0')
			for c, _, err := reader.ReadRune(); err == nil; c, _, err = reader.ReadRune() {
				if isDigit(c) {
					val = val*10 + int(c-'0')
				} else {
					reader.UnreadRune()
					break
				}
			}
			result.add(vm, MakeInteger(val).Value())

		case '"':
			var builder strings.Builder
			for c, _, err := reader.ReadRune(); err == nil; c, _, err = reader.ReadRune() {
				if c != '"' {
					builder.WriteRune(c)
				} else {
					break
				}
			}
			result.add(vm, vm.AllocString(builder.String()).Value())

		default:
			kind := WordNorm
			switch c {
			case ':':
				kind = GetWord
			case '\'':
				kind = Quote
			case '/':
				ident, _ := readIdent(reader)
				result.add(vm, MakeRefinement(vm.GetSymbol(ident)).Value())
				reader.UnreadRune()
				continue
			default:
				reader.UnreadRune()
			}
			ident, next := readIdent(reader)
			switch next {
			case ':':
				kind = SetWord
			case '/':
				var path []sym
				var i string
				for true {
					i, next = readIdent(reader)
					path = append(path, vm.GetSymbol(i))
					if next != '/' {
						break
					}
				}
				if next == ':' {
					kind = SetWord
				} else {
					reader.UnreadRune()
				}
				result.add(vm, vm.allocPath(kind, ident, path).Value())
				continue
			default:
				reader.UnreadRune()
			}
			result.add(vm, vm.allocWord(kind, ident).Value())
		}
	}

	return result
}
