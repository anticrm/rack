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

type Pkg struct {
	name string
	fn   map[string]ProcFunc
}

type Library struct {
	packages []*Pkg
}

func (l *Library) Add(pkg *Pkg) {
	l.packages = append(l.packages, pkg)
}

func (l *Library) getFunction(name string) ProcFunc {
	s := strings.Split(name, "/")
	for _, p := range l.packages {
		if p.name == s[0] {
			return p.fn[s[1]]
		}
	}
	panic("function not found")
}

func NewPackage(name string) *Pkg {
	return &Pkg{name: name, fn: make(map[string]ProcFunc)}
}

func (p *Pkg) AddFunc(name string, fn ProcFunc) {
	p.fn[name] = fn
}

func (vm *VM) LoadPackage(pkg *Pkg, target Map) {
	for name, fn := range pkg.fn {
		fullName := pkg.name + "/" + name
		native := vm.allocNative(fn, fullName)
		sym := sym(vm.GetSymbol(name))
		target.put(vm, sym, native.Value())
	}
}

func loadNative(vm *VM) Value {
	name := vm.Next().String().Val(vm)
	f := vm.Library.getFunction(name)
	return Value(vm.allocNative(f, name))
}
