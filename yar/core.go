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
	"fmt"
)

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

func eq(vm *VM) Value {
	x := vm.Next().Integer().Value().Val()
	y := vm.Next().Integer().Value().Val()
	return MakeBoolean(x == y).Value()
}

type stackFrame struct {
	symbols []sym
	params  int
	locals  int
}

func (sf *stackFrame) addParam(sym sym) {
	sf.symbols = append(sf.symbols, sym)
	sf.params++
}

func (sf *stackFrame) addLocal(sym sym) {
	sf.symbols = append(sf.symbols, sym)
	sf.locals++
}

func (sf *stackFrame) stackSize() int {
	return sf.params + sf.locals
}

func makeStackFrame(vm *VM, params Block) *stackFrame {
	result := &stackFrame{}
	for _, v := range params._block(vm).values {
		result.addParam(vm.heap[v].Word().sym(vm))
	}
	return result
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

func proc(vm *VM) Value {
	params := vm.Next().Block()
	code := vm.Next().Block()

	stackFrame := makeStackFrame(vm, params)
	code.Bind(vm, stackFrame)

	return vm.allocProc(stackFrame.stackSize(), stackFrame.params, code).Value()
}

func funct(vm *VM) Value {
	params := vm.Next().Block()
	code := vm.Next().Block()

	stackFrame := makeStackFrame(vm, params)
	code.ForEach(vm, func(v Value) {
		if v.Kind() == WordType {
			w := v.Word()
			if w.kind(vm) == SetWord {
				stackFrame.addLocal(w.sym(vm))
			}
		}
	})

	code.Bind(vm, stackFrame)

	return vm.allocProc(stackFrame.stackSize(), stackFrame.params, code).Value()
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

func _if(vm *VM) Value {
	cond := vm.Next()
	ifTrue := vm.Next().Block()

	if cond.Boolean().Val() {
		return vm.Exec(ifTrue)
	}

	return cond
}

func print(vm *VM) Value {
	value := vm.Next()
	fmt.Println(value.ToString(vm))
	return value
}

func makeObject(vm *VM) Value {
	block := vm.Next().Block()
	object := vm.allocMap()
	block.Bind(vm, &BindToHeap{vm: vm, m: object.Value().Val()})
	vm.Exec(block)
	return object.Value()
}

func foreach(vm *VM) Value {
	w := vm.ReadNext().Word()
	series := vm.Next().Block()
	code := vm.Next().Block()

	offset := vm.bp
	code.Bind(vm, &BindToWord{sym: w.sym(vm), offset: offset})

	var result Value
	vm.bp++
	series.ForEach(vm, func(v Value) {
		vm.wordBinding[offset] = v
		result = vm.Exec(code)
	})
	vm.bp--

	return result
}

func forall(vm *VM) Value {
	word := vm.ReadNext().Word()
	code := vm.Next().Block()

	series := word.binding(vm).Get(vm).Block()

	pos := series.pos()
	ofs := series.ofs()

	var result Value
	for ofs < len(vm.blocks[pos].values) {
		s := makeBlock(pos, ofs)
		word.binding(vm).Set(vm, s.Value())
		result = vm.Exec(code)
		if result.Kind() == BreakType {
			break
		}
		ofs++
	}

	return result
}

func repeat(vm *VM) Value {
	w := vm.ReadNext().Word()
	times := vm.Next().Integer().Value().Val()
	code := vm.Next().Block()

	offset := vm.bp
	code.Bind(vm, &BindToWord{sym: w.sym(vm), offset: offset})

	var result Value
	vm.bp++
	for i := 1; i <= times; i++ {
		vm.wordBinding[offset] = MakeInteger(i).Value()
		result = vm.Exec(code)
		if result.Kind() == BreakType {
			break
		}
	}
	vm.bp--

	return result
}

func _append(vm *VM) Value {
	series := vm.Next().Block()
	value := vm.Next()

	series.add(vm, value)

	return series.Value()
}

func in(vm *VM) Value {
	m := vm.Next().Map()
	w := vm.Next().Word()
	sym := w.sym(vm)

	symkind := makeSymKind(sym, Quote)
	pos := m.find(vm, sym)
	var binding Binding
	if pos == -1 {
		binding = makeBinding(0, NoneBinding)
	} else {
		binding = makeBinding(pos, HeapBinding)
	}
	return vm._allocWord(_Word{symKind: symkind, binding: binding}).Value()
}

func get(vm *VM) Value {
	return vm.Next().Word().binding(vm).Get(vm)
}

func set(vm *VM) Value {
	w := vm.Next().Word()
	v := vm.Next()
	return w.binding(vm).Set(vm, v)
}

func first(vm *VM) Value {
	block := vm.Next().Block()
	return vm.heap[vm.blocks[block.pos()].values[block.ofs()]]
}

func reduce(vm *VM) Value {
	block := vm.Next().Block()
	reduced := vm.allocBlock()

	pos := block.pos()
	b := vm.blocks[pos]
	codeSave := vm.code
	pcSave := vm.pc
	vm.code = pos
	vm.pc = 0
	len := len(b.values)
	for vm.pc < len {
		reduced.add(vm, vm.Next())
	}
	vm.pc = pcSave
	vm.code = codeSave

	return reduced.Value()
}

func _break(vm *VM) Value {
	vm.pc = len(vm.blocks[vm.code].values)
	return MakeBreak().Value()
}

func CorePackage() *Pkg {
	result := NewPackage("core")
	result.AddFunc("add", add)
	result.AddFunc("sub", sub)
	result.AddFunc("gt", gt)
	result.AddFunc("eq", eq)
	result.AddFunc("either", either)
	result.AddFunc("if", _if)
	result.AddFunc("func", proc)
	result.AddFunc("funct", funct)
	result.AddFunc("print", print)
	result.AddFunc("make-object", makeObject)
	result.AddFunc("foreach", foreach)
	result.AddFunc("forall", forall)
	result.AddFunc("repeat", repeat)
	result.AddFunc("append", _append)
	result.AddFunc("in", in)
	result.AddFunc("get", get)
	result.AddFunc("set", set)
	result.AddFunc("first", first)
	result.AddFunc("reduce", reduce)
	result.AddFunc("break", _break)
	return result
}

const coreY = `
add: load-native "core/add"
sub: load-native "core/sub"
gt: load-native "core/gt"
eq: load-native "core/eq"
either: load-native "core/either"
if: load-native "core/if"
func: load-native "core/func"
funct: load-native "core/funct"
print: load-native "core/print"
make-object: load-native "core/make-object"
foreach: load-native "core/foreach"
forall: load-native "core/forall"
repeat: load-native "core/repeat"
append: load-native "core/append"
in: load-native "core/in"
get: load-native "core/get"
set: load-native "core/set"
first: load-native "core/first"
reduce: load-native "core/reduce"
break: load-native "core/break"
`

func CoreModule(vm *VM) Value {
	code := vm.Parse(coreY)
	return vm.BindAndExec(code)
}
