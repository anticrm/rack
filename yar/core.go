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

func add(vm *VM) Value {
	x := vm.Next().Integer().Value().Val()
	y := vm.Next().Integer().Value().Val()
	return MakeInteger(x + y).Value()
}

func sub(vm *VM) Value {
	x := vm.Next().Integer().Value().Val()
	y := vm.Next().Integer().Value().Val()
	return MakeInteger(x - y).Value()
}

func gt(vm *VM) Value {
	x := vm.Next().Integer().Value().Val()
	y := vm.Next().Integer().Value().Val()
	return MakeBoolean(x > y).Value()
}

type stackFrame struct {
	symbols []sym
}

func makeStackFrame(vm *VM, params Block) *stackFrame {
	var result []sym

	for _, v := range params._block(vm).values {
		result = append(result, vm.heap[v].Word().sym(vm))
	}

	return &stackFrame{symbols: result}
}

func (sf *stackFrame) getBinding(sym sym, create bool) Binding {
	stackSize := len(sf.symbols)
	for i, def := range sf.symbols {
		if def == sym {
			return makeBinding(i-stackSize, StackBinding)
		}
	}
	return 0
}

func fn(vm *VM) Value {
	params := vm.Next().Block()
	code := vm.Next().Block()

	stackFrame := makeStackFrame(vm, params)
	stackSize := len(stackFrame.symbols)
	code.Bind(vm, stackFrame)

	// f := func(vm *VM) Value {
	// 	for i := 0; i < stackSize; i++ {
	// 		vm.push(vm.Next())
	// 	}
	// 	result := vm.Exec(code)
	// 	vm.sp = vm.sp - stackSize
	// 	return result
	// }

	return vm.allocProc(stackSize, stackSize, code).Value()
}

func either(vm *VM) Value {
	cond := vm.Next().Boolean()
	ifTrue := vm.Next().Block()
	ifFalse := vm.Next().Block()

	if cond.Val() {
		return vm.Exec(ifTrue)
	}

	return vm.Exec(ifFalse)
}

func CorePackage() *Pkg {
	result := NewPackage("core")
	result.AddFunc("add", add)
	result.AddFunc("sub", sub)
	result.AddFunc("gt", gt)
	result.AddFunc("either", either)
	result.AddFunc("fn", fn)
	return result
}

const coreY = `
add: load-native "core/add"
sub: load-native "core/sub"
gt: load-native "core/gt"
either: load-native "core/either"
fn: load-native "core/fn"
`

func CoreModule(vm *VM) Value {
	code := vm.Parse(coreY)
	return vm.BindAndExec(code)
}
