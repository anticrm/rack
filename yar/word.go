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

type sym int

const (
	WordNorm = iota
	GetWord  = iota
	SetWord  = iota
	Quote    = iota
)

type Word Value

func (w Word) Value() Value { return Value(w) }
func (v Value) Word() Word  { return Word(v) }

func (w Word) _word(vm *VM) *_Word          { return &vm.words[w.Value().Val()] }
func (w Word) sym(vm *VM) sym               { return w._word(vm).sym() }
func (w Word) bind(vm *VM, target Bindable) { w._word(vm).bind(vm, target) }
func (w Word) binding(vm *VM) Binding       { return w._word(vm).binding }

type _Word struct {
	symKind int64
	binding Binding
}

func (vm *VM) _allocWord(_word _Word) Word {
	pos := len(vm.words)
	vm.words = append(vm.words, _word)
	return Word(makeValue(pos, WordType))
}

func (vm *VM) allocWord(kind int, ident string) Word {
	symKind := makeSymKind(vm.GetSymbol(ident), kind)
	return vm._allocWord(_Word{symKind: symKind, binding: 0})
}

func (w *_Word) sym() sym                 { return sym(w.symKind >> 8) }
func (w *_Word) kind() int                { return int(w.symKind) & 0xff }
func makeSymKind(sym sym, kind int) int64 { return int64(sym)<<8 | int64(kind) }

func (w *_Word) bind(vm *VM, target Bindable) {
	binding := target.getBinding(w.sym(), w.kind() == SetWord)
	if binding != 0 {
		w.binding = binding
	}
}

func (w *_Word) exec(vm *VM, v Value) Value {
	switch w.kind() {
	case WordNorm:
		return w.binding.Get(vm).exec(vm)
	case GetWord:
		return w.binding.Get(vm)
	case SetWord:
		return w.binding.Set(vm, vm.Next())
	case Quote:
		return v
	}
	panic("unreachable")
}

func (w *_Word) toString(vm *VM) string {
	return vm.InverseSymbols[w.sym()]
}
