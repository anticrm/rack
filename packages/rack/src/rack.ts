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

import { VM, parse } from '@anticrm/yarilo'

function createModule() {
  return { 
    getServiceConfig (service: string) {
      return ({} as any)[service]
    }
  }
}

const rackY = `
get-service-config: native [service] rack/getServiceConfig
get-deployments: proc [] [get "deployments"]
new-deployment:
`

export default function (vm: VM) {
  vm.dictionary['rack'] = createModule()
  const bootCode = parse(rackY)
  vm.bind(bootCode)
  vm.exec(bootCode)
}
