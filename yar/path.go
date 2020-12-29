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

type Path Value

func (w Path) Value() Value { return Value(w) }
func (v Value) Path() Path  { return Path(v) }

func (w Path) _path(vm *VM) *_Path          { return &vm.paths[w.Value().Val()] }
func (w Path) sym(vm *VM) sym               { return w._path(vm).sym() }
func (w Path) bind(vm *VM, target Bindable) { w._path(vm).bind(vm, target) }
func (w Path) binding(vm *VM) Binding       { return w._path(vm).binding }

type _Path struct {
	symKind int64
	binding Binding
	path    []sym
}

func (vm *VM) _allocPath(_path _Path) Path {
	pos := len(vm.paths)
	vm.paths = append(vm.paths, _path)
	return Path(makeValue(pos, PathType))
}

func (vm *VM) allocPath(kind int, ident string, path []sym) Path {
	symKind := makeSymKind(vm.GetSymbol(ident), kind)
	return vm._allocPath(_Path{symKind: symKind, binding: 0, path: path})
}

func (w *_Path) sym() sym  { return sym(w.symKind >> 8) }
func (w *_Path) kind() int { return int(w.symKind) & 0xff }

func (w *_Path) bind(vm *VM, target Bindable) {
	binding := target.getBinding(w.sym(), w.kind() == SetWord)
	if binding != 0 {
		w.binding = binding
	}
}

func (w *_Path) get(vm *VM) Value {
	value := w.binding.Get(vm)
	for _, sym := range w.path {
		value = value.Map().get(vm, sym)
	}
	return value
}

func (w *_Path) addr(vm *VM) int {
	value := w.binding.Get(vm)
	var addr int
	for _, sym := range w.path {
		addr = value.Map().find(vm, sym)
		value = vm.heap[addr]
	}
	return addr
}

func (w *_Path) exec(vm *VM, v Value) Value {
	switch w.kind() {
	case WordNorm:
		return w.get(vm).exec(vm)
	case GetWord:
		return w.get(vm)
	case SetWord:
		value := vm.Next()
		vm.heap[w.addr(vm)] = value
		return value
	case Quote:
		return v
	}
	panic("unreachable")
}

func (w *_Path) toString(vm *VM) string {
	return vm.InverseSymbols[w.sym()]
}
