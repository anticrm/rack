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

package storage

import (
	"testing"

	"github.com/anticrm/rack/yar"
)

func createTestVM() *yar.VM {
	vm := yar.NewVM(100)
	vm.Library.Add(yar.CorePackage())
	vm.Library.Add(StoragePackage())
	yar.CoreModule(vm)
	storageModule(vm)
	return vm
}

func Test1(t *testing.T) {
	vm := createTestVM()
	code := vm.Parse(`storage/upload storage/make-bucket "test-bucket3" ".."`)
	vm.Bind(code)
	result := vm.Exec(code)
	println(result.ToString(vm))
	// if result.Kind() != IntegerType || result.Val() != 6 {
	// 	t.Error("!= 6")
	// }
}
