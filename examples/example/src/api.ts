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

import { Readable } from 'stream'

export default class {
  async v1 (
    body: Readable,
    id: string,
    chunk: number,
  ): Promise<void> {
    // return this.services('redis').set(`video-${id}-${chunk}`, body)
  }

  async v2 (
    body: Readable,
    id: string,
    chunk: number,
  ): Promise<void> {
    // return this.services('redis').set(`video-${id}-${chunk}`, body)
  }

}
