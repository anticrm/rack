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

package node

import "github.com/anticrm/rack/yar"

func clusterInit(vm *yar.VM) yar.Value {
	// nodes := vm.Dictionary.Find(vm, vm.GetSymbolID("cluster"))
	// nodes.Add(vm, vm.AllocString("localhost:63001").Value())
	// vm.Dictionary.Put(vm, vm.GetSymbolID("nodes"), nodes.Value())
	return 0
}

func clusterPackage() *yar.Pkg {
	result := yar.NewPackage("cluster")
	result.AddFunc("init", clusterInit)
	return result
}

// repeat cpu node/cpus [
// 	append node/docker-procs make-object [image: _image port: _port]
// ]

const clusterY = `
cluster: make-object [
  nodes: []
	services: []
	docker-service: func [_image _port] [
		foreach node nodes [
			repeat core node/cores [
				append node/docker-procs make-object [image: _image port: _port]
			]
		]
	]
	update-node-info: func [_nodeID _nodeName _cores _cpuModelName /local node] [
    forall nodes [if eq get in first nodes 'nodeID _nodeID [break]]
		either tail? nodes [
			append nodes make-object [
				nodeID: _nodeID nodeName: _nodeName cores: _cores cpuModelName: _cpuModelName docker-procs: []
			]
		] [
			node: first nodes
			node/cores: _cores
			node/cpuModelName: _cpuModelName
		]
	]
]
`

func clusterModule(vm *yar.VM) yar.Value {
	code := vm.Parse(clusterY)
	return vm.BindAndExec(code)
}
