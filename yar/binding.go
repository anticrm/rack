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

type Binding int64

const (
	NoneBinding  = 0
	HeapBinding  = iota
	StackBinding = iota
	LastBinding  = iota
)

func (b Binding) Kind() int { return int(b) & 0xff }
func (b Binding) Val() int  { return int(b >> 8) }

func makeBinding(val int, kind int) Binding {
	return Binding(val)<<8 | Binding(kind)
}

func (b Binding) Get(vm *VM) Value {
	switch b.Kind() {
	case NoneBinding:
		panic("not bound")
	case HeapBinding:
		return vm.heap[b.Val()]
	case StackBinding:
		return vm.stack[vm.sp+b.Val()]
	}
	panic("should not happen")
	// return vm.getBindingVmt[b.Kind()](vm, b)
}

func (b Binding) Set(vm *VM, value Value) Value {
	switch b.Kind() {
	case NoneBinding:
		panic("not bound")
	case HeapBinding:
		vm.heap[b.Val()] = value
		return value
	case StackBinding:
		vm.stack[b.Val()] = value
		return value
	default:
		panic("should not happen")
	}
	// return vm.setBindingVmt[b.Kind()](vm, b, value)
}

func getNoneBinding(vm *VM, binding Binding) Value  { panic("not bound") }
func getHeapBinding(vm *VM, binding Binding) Value  { return vm.heap[binding.Val()] }
func getStackBinding(vm *VM, binding Binding) Value { return vm.stack[vm.sp+binding.Val()] }

var getBindingVmt = [LastBinding]func(vm *VM, b Binding) Value{
	getNoneBinding, getHeapBinding, getStackBinding,
}

func setNoneBinding(vm *VM, binding Binding, value Value) Value { panic("not bound") }
func setHeapBinding(vm *VM, binding Binding, value Value) Value {
	vm.heap[binding.Val()] = value
	return value
}
func setStackBinding(vm *VM, binding Binding, value Value) Value {
	vm.stack[vm.sp+binding.Val()] = value
	return value
}

var setBindingVmt = [LastBinding]func(vm *VM, b Binding, v Value) Value{
	setNoneBinding, setHeapBinding, setStackBinding,
}

type Bindable interface {
	getBinding(sym sym, create bool) Binding
}

type BindableMap struct {
	vm *VM
	m  int
}

func (bm *BindableMap) getBinding(sym sym, create bool) Binding {
	pos, ok := bm.vm.maps[bm.m].index[sym]
	if ok {
		return makeBinding(pos, HeapBinding)
	}
	if create {
		pos := bm.vm.alloc(None)
		bm.vm.maps[bm.m].index[sym] = pos
		return makeBinding(pos, HeapBinding)
	}
	return makeBinding(0, NoneBinding)
}
