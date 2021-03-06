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
	NoneType       = iota
	BlockType      = iota
	MapType        = iota
	WordType       = iota
	IntegerType    = iota
	BooleanType    = iota
	NativeType     = iota
	ProcType       = iota
	StringType     = iota
	PathType       = iota
	UnsetType      = iota
	BreakType      = iota
	RefinementType = iota
	LastType       = iota
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
		vm.blocks[v.Block().pos()].bind(vm, target)
	case WordType:
		vm.words[v.Val()].bind(vm, target)
	case PathType:
		vm.paths[v.Val()].bind(vm, target)
	}
}

func (v Value) exec(vm *VM) Value {
	return vm.execVmt[v.Kind()](vm, v)
}

func (v Value) ToString(vm *VM) string {
	switch v.Kind() {
	case NoneType:
		return "none"
	case IntegerType:
		return strconv.Itoa(v.Val())
	case BooleanType:
		if v.Boolean().Val() {
			return "true"
		}
		return "false"
	case BlockType:
		return Block(v).toString(vm)
	case MapType:
		return Map(v).toString(vm)
	case WordType:
		return vm.words[v.Val()].toString(vm)
	case StringType:
		return vm.strings[v.Val()]
	case UnsetType:
		return "unset!"
	case RefinementType:
		return "/" + vm.InverseSymbols[v.Refinement().sym()]
	}
	println(v.Kind())
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

type String Value

func makeString(v int) String { return String(makeValue(v, StringType)) }

func (i String) Value() Value  { return Value(i) }
func (v Value) String() String { return String(v) }

func (s String) Val(vm *VM) string { return vm.strings[s.Value().Val()] }

func (vm *VM) AllocString(s string) String {
	pos := len(vm.strings)
	vm.strings = append(vm.strings, s)
	return makeString(pos)
}

///

type Unset Value

func MakeUnset() Unset       { return Unset(makeValue(0, UnsetType)) }
func (v Value) Unset() Unset { return Unset(v) }
func (i Unset) Value() Value { return Value(i) }

///

type Break Value

func MakeBreak() Break { return Break(makeValue(0, BreakType)) }

// func (v Value) Unset() Unset { return Unset(v) }
func (i Break) Value() Value { return Value(i) }

///

type Refinement Value

func MakeRefinement(sym sym) Refinement { return Refinement(makeValue(int(sym), RefinementType)) }

func (v Value) Refinement() Refinement { return Refinement(v) }
func (i Refinement) Value() Value      { return Value(i) }
func (i Refinement) sym() sym          { return sym(i.Value().Val()) }

///

func returnSelf(vm *VM, v Value) Value {
	return v
}

func wordExec(vm *VM, v Value) Value {
	return vm.words[v.Val()].exec(vm, v)
}

func pathExec(vm *VM, v Value) Value {
	return vm.paths[v.Val()].exec(vm, v)
}

var execVmt = [LastType]func(vm *VM, value Value) Value{
	returnSelf, returnSelf, returnSelf, wordExec, returnSelf, returnSelf, nativeExec, procExec, returnSelf, pathExec, returnSelf, returnSelf,
}
