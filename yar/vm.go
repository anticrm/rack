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

type ProcFunc = func(vm *VM) Value

type VM struct {
	code   int
	pc     int
	sp     int
	bp     int
	result Value

	stack       []Value
	heap        []Value
	wordBinding *[32]Value

	words   []_Word
	blocks  []_Block
	maps    []_Map
	natives []_Native
	procs   []_Proc
	strings []string

	Dictionary Map

	execVmt [LastType]func(vm *VM, value Value) Value

	symbols        map[string]sym
	InverseSymbols map[sym]string
	lastSymbol     sym

	Library *Library
}

func (vm *VM) alloc(v Value) int {
	result := len(vm.heap)
	vm.heap = append(vm.heap, v)
	return result
}

func NewVM(stackSize int) *VM {
	vm := &VM{
		stack:       make([]Value, stackSize),
		heap:        make([]Value, 0),
		wordBinding: new([32]Value),

		words:  make([]_Word, 0),
		blocks: make([]_Block, 0),
		maps:   make([]_Map, 0),

		symbols:        make(map[string]sym),
		InverseSymbols: make(map[sym]string),
		lastSymbol:     0,
	}

	vm.Dictionary = vm.allocMap()
	vm.Dictionary.put(vm, vm.GetSymbol("load-native"), vm.allocNative(loadNative, "boot/load-native").Value())

	vm.execVmt = execVmt

	vm.Library = &Library{}

	return vm
}

func (vm *VM) push(v Value) {
	vm.stack[vm.sp] = v
	vm.sp++
}

func (vm *VM) GetSymbol(s string) sym {
	sym, ok := vm.symbols[s]
	if !ok {
		vm.lastSymbol++
		sym = vm.lastSymbol
		vm.symbols[s] = sym
		vm.InverseSymbols[sym] = s
	}
	return sym
}

func (vm *VM) Bind(code Block) {
	code.Bind(vm, &BindToHeap{vm: vm, m: vm.Dictionary.Value().Val()})
}

func (vm *VM) BindAndExec(code Block) Value {
	vm.Bind(code)
	return vm.Exec(code)
}

func (vm *VM) nextNoInfix() Value {
	value := vm.heap[vm.blocks[vm.code].values[vm.pc]]
	vm.pc++
	result := value.exec(vm)
	vm.result = result
	return result
}

func (vm *VM) ReadNext() Value {
	value := vm.heap[vm.blocks[vm.code].values[vm.pc]]
	vm.pc++
	vm.result = value
	return value
}

func (vm *VM) Next() Value {
	return vm.nextNoInfix()
}

func (vm *VM) Exec(block Block) Value {
	b := vm.blocks[Value(block).Val()]
	codeSave := vm.code
	pcSave := vm.pc
	vm.code = block.Value().Val()
	vm.pc = 0
	len := len(b.values)
	var result Value
	for vm.pc < len {
		result = vm.Next()
	}
	vm.pc = pcSave
	vm.code = codeSave
	return result
}
