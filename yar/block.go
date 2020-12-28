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

import "strings"

type Block Value

type _Block struct {
	values []int
}

func (vm *VM) allocBlock() Block {
	pos := len(vm.blocks)
	vm.blocks = append(vm.blocks, _Block{values: make([]int, 0)})
	return Block(makeValue(pos, BlockType))
}

func (b Block) Value() Value { return Value(b) }

func (b Block) _block(vm *VM) *_Block {
	return &vm.blocks[Value(b).Val()]
}

func (b Block) Bind(vm *VM, target Bindable) {
	vm.blocks[Value(b).Val()].bind(vm, target)
}

func (v Value) Block() Block { return Block(v) }

func (b Block) add(vm *VM, v Value) {
	vm.blocks[Value(b).Val()].add(vm, v)
}

func (b Block) toString(vm *VM) string {
	return vm.blocks[Value(b).Val()].toString(vm)
}

func (b *_Block) add(vm *VM, v Value) {
	b.values = append(b.values, vm.alloc(v))
}

func (b *_Block) bind(vm *VM, target Bindable) {
	for _, v := range b.values {
		vm.heap[v].bind(vm, target)
	}
}

func (b *_Block) toString(vm *VM) string {
	var elements []string
	for _, v := range b.values {
		elements = append(elements, vm.heap[v].toString(vm))
	}
	return "[" + strings.Join(elements, " ") + "]"
}

type Map Value

type _Map struct {
	index map[sym]int
}

func (m Map) Value() Value { return Value(m) }

func (m Map) put(vm *VM, sym sym, v Value) {
	vm.maps[m.Value().Val()].put(vm, sym, v)
}

func (vm *VM) allocMap() Map {
	pos := len(vm.blocks)
	vm.maps = append(vm.maps, _Map{index: make(map[sym]int)})
	return Map(makeValue(pos, MapType))
}

func (m _Map) put(vm *VM, sym sym, v Value) {
	m.index[sym] = vm.alloc(v)
}
