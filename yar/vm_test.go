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
	"testing"
)

func createTestVM() *VM {
	vm := NewVM(100)
	vm.Library.Add(CorePackage())
	CoreModule(vm)
	return vm
}

func TestBlockToString(t *testing.T) {
	vm := NewVM(100)
	block := vm.allocBlock()
	block.add(vm, MakeInteger(3).Value())
	block.add(vm, MakeInteger(4).Value())
	if block.toString(vm) != "[3 4]" {
		t.Error("!= [3 4]")
	}
	b := vm.allocBlock()
	b.add(vm, block.Value())
	if b.toString(vm) != "[[3 4]]" {
		t.Error("!= [[3 4]]")
	}
}

func TestParse2(t *testing.T) {
	vm := NewVM(100)
	code := vm.Parse("add 1 2 [3 4] 5")
	if code.toString(vm) != "[add 1 2 [3 4] 5]" {
		t.Error("!= [add 1 2 [3 4] 5]")
	}
}

func TestParse3(t *testing.T) {
	vm := NewVM(100)
	vm.Parse("x: \"here\"")
	// fmt.Println(code.toString(vm))
	// if code.toString(vm) != "[add 1 2 [3 4] 5]" {
	// 	t.Error("!= [add 1 2 [3 4] 5]")
	// }
}

func TestExec(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("add 1 2")
	result := vm.BindAndExec(code)
	if result.Kind() != IntegerType || result.Val() != 3 {
		t.Error("!= 3")
	}
}

func TestAdd(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("add add 1 2 3")
	vm.Bind(code)
	result := vm.Exec(code)
	if result.Kind() != IntegerType || result.Val() != 6 {
		t.Error("!= 6")
	}
}

func TestSetWord(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("x: 5 add x 1")
	vm.Bind(code)
	result := vm.Exec(code)
	if result.Kind() != IntegerType || result.Val() != 6 {
		t.Error("!= 6")
	}
}

func TestFn(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("x: proc [n] [add n 10] x 5")
	vm.Bind(code)
	result := vm.Exec(code)
	// fmt.Println(result.toString(vm))
	if result.Kind() != IntegerType || result.Val() != 15 {
		t.Error("!= 15")
	}
}

func TestSum(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("sum: proc [n] [either gt n 1 [add n sum sub n 1] [n]] sum 100")
	vm.Bind(code)
	result := vm.Exec(code)
	// fmt.Println(result.toString(vm))
	if result.Kind() != IntegerType || result.Val() != 5050 {
		t.Error("!= 5050")
	}
}

func TestMakeObject(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("x: make-object [a: 1 b: 2]")
	result := vm.BindAndExec(code)
	fmt.Println(result.ToString(vm))
	// if result.Kind() != IntegerType || result.Val() != 5050 {
	// 	t.Error("!= 5050")
	// }
}

func TestForeach(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("foreach x [1 2 3 4 5] [print x]")
	vm.BindAndExec(code)
	// if result.Kind() != IntegerType || result.Val() != 5050 {
	// 	t.Error("!= 5050")
	// }
}

func TestRepeat(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("repeat x 5 [print x]")
	vm.BindAndExec(code)
	// if result.Kind() != IntegerType || result.Val() != 5050 {
	// 	t.Error("!= 5050")
	// }
}

func TestGetIn(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("x: make-object [a: 1 b: 2] get in x 'b")
	result := vm.BindAndExec(code)
	if result.Kind() != IntegerType || result.Val() != 2 {
		t.Error("!= 2")
	}
}

func TestPath(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("x: make-object [a: 1 b: 2] x/a")
	result := vm.BindAndExec(code)
	if result.Kind() != IntegerType || result.Val() != 1 {
		t.Error("!= 1")
	}
}

func TestPath2(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("x: make-object [a: 1 b: make-object [c: 2]] x/b/c")
	result := vm.BindAndExec(code)
	if result.Kind() != IntegerType || result.Val() != 2 {
		t.Error("!= 2")
	}
}

func TestPath3(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse("x: make-object [a: 1 b: make-object [c: 2]] x/a: 2 x/a")
	result := vm.BindAndExec(code)
	if result.Kind() != IntegerType || result.Val() != 2 {
		t.Error("!= 2")
	}
}

func BenchmarkFib(t *testing.B) {
	vm := createTestVM()
	code := vm.Parse("fib: proc [n] [either gt n 1 [add fib sub n 2 fib sub n 1] [n]] fib 40")
	vm.Bind(code)
	vm.Exec(code)
}
