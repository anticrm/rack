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

const config = JSON.parse('{"rpc":{"new-video":{"auth":true,"response":{"type":"string"}},"video-chunk":{"auth":true,"parameters":[{"name":"id","schema":{"type":"string"}},{"name":"chunk","schema":{"type":"integer"}},{"name":"data","schema":{"type":"stream","format":"application/octet-stream"}}]}},"http":{"/video-chunk":{"post":{"map":"video-chunk","parameters":[{"name":"id","in":"query"},{"name":"chunk","in":"query"},{"name":"data","in":"body"}]}},"/new-video":{"post":{"map":"new-video","parameters":"json-rpc"}}},"http-auth":{"jwt":{"type":"bearer","bearerFormat":"jwt"}}}')

import { configure } from '@anticrm/rack'
import api from './api'

const impl = {}
impl['/add'] = {}
import { get as __get_add } from './http/add'
impl['/add']['get'] = __get_add

const runtime = configure(config, { api, impl })
runtime.start()


