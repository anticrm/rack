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

import "strconv"

const (
	NoneType    = iota
	BlockType   = iota
	MapType     = iota
	WordType    = iota
	IntegerType = iota
	BooleanType = iota
	ProcType    = iota
	LastType    = iota
)

const None = Value(0)

type Value int64

func makeValue(val int, kind int) Value {
	return Value(val)<<8 | Value(kind)
}

func (v Value) Kind() int { return int(v) & 0xff }
func (v Value) Val() int  { return int(v >> 8) }

func (v Value) bind(vm *VM, target Bindable) {
	switch v.Kind() {
	case BlockType:
		vm.blocks[v.Val()].bind(vm, target)
	case WordType:
		vm.words[v.Val()].bind(vm, target)
	}
}

func (v Value) exec(vm *VM) Value {
	return vm.execVmt[v.Kind()](vm, v)
}

func (v Value) toString(vm *VM) string {
	switch v.Kind() {
	case IntegerType:
		return strconv.Itoa(v.Val())
	case BlockType:
		return Block(v).toString(vm)
	case WordType:
		return vm.words[v.Val()].toString(vm)
	}
	panic("not implemented")
}

///

type Integer Value

func MakeInteger(v int) Integer { return Integer(makeValue(v, IntegerType)) }

func (v Value) Integer() Integer { return Integer(v) }

func (i Integer) Value() Value { return Value(i) }

///

type Boolean Value

func MakeBoolean(v bool) Boolean {
	if v {
		return Boolean(makeValue(1, BooleanType))
	}
	return Boolean(makeValue(0, BooleanType))
}

func (v Value) Boolean() Boolean { return Boolean(v) }

func (i Boolean) Value() Value { return Value(i) }
func (i Boolean) Val() bool    { return i.Value().Val() != 0 }

///

type Proc Value

func makeProc(v int) Proc { return Proc(makeValue(v, ProcType)) }

func (i Proc) Value() Value { return Value(i) }

func (vm *VM) allocProc(f ProcFunc) Proc {
	pos := len(vm.procs)
	vm.procs = append(vm.procs, f)
	return makeProc(pos)
}

///

func returnSelf(vm *VM, v Value) Value {
	return v
}

func wordExec(vm *VM, v Value) Value {
	return vm.words[v.Val()].exec(vm)
}

func procExec(vm *VM, v Value) Value {
	return vm.procs[v.Val()](vm)
}

var execVmt = [LastType]func(vm *VM, value Value) Value{
	returnSelf, returnSelf, returnSelf, wordExec, returnSelf, returnSelf, procExec,
}
