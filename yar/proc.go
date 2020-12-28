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

type Native Value

func makeNative(v int) Native { return Native(makeValue(v, NativeType)) }

func (i Native) Value() Value { return Value(i) }

func (vm *VM) allocNative(f ProcFunc, id string) Native {
	pos := len(vm.natives)
	vm.natives = append(vm.natives, _Native{f: f, id: id})
	return makeNative(pos)
}

type _Native struct {
	f  ProcFunc
	id string
}

func nativeExec(vm *VM, v Value) Value {
	return vm.natives[v.Val()].f(vm)
}

///

type Proc Value

func makeProc(v int) Proc { return Proc(makeValue(v, ProcType)) }

func (i Proc) Value() Value { return Value(i) }
func (v Value) Proc() Proc  { return Proc(v) }

func (p Proc) _proc(vm *VM) _Proc { return vm.procs[p.Value().Val()] }

func (vm *VM) allocProc(stackSize int, params int, code Block) Proc {
	pos := len(vm.procs)
	vm.procs = append(vm.procs, _Proc{stackSize: stackSize, params: params, code: code})
	return makeProc(pos)
}

type _Proc struct {
	stackSize int
	params    int
	code      Block
}

func procExec(vm *VM, v Value) Value {
	proc := v.Proc()._proc(vm)
	for i := 0; i < proc.params; i++ {
		vm.push(vm.Next())
	}
	vm.sp = vm.sp + (proc.stackSize - proc.params)
	result := vm.Exec(proc.code)
	vm.sp = vm.sp - proc.stackSize
	return result
}
