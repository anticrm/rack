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

import request from 'superagent'
import { configure } from '../config'


describe("http", () => {

  const url = 'localhost:8080'
  let stop: (() => void)[]

  beforeAll(() => {
    const config = {
      rpc: {
        add: {
          parameters: [
            { name: 'a', schema: { type: 'integer'} },
            { name: 'b', schema: { type: 'integer'} },
          ]
        }
      },
      http: {
        '/add': {
          get: {
            parameters: [
              { name: 'a', in: 'query', schema: { type: 'integer'} },
              { name: 'b', in: 'query', schema: { type: 'integer'} },
            ]
          }
        }
      }
    }
    const http = {
      '/add': {
        get: function(a: number, b: number): number { return a + b }
      }
    }
    const api = class {
      add(a: number, b: number): number { return a + b }
    }

    const runtime = configure(config, { http, api })
    stop = runtime.start()
  })

  afterAll(() => {
    stop.forEach(f => f())
  })

  it("should return 404 when access non-existing endpoint", done => {
    request
      .get(url + '/non-existing')
      .end((err, res) => {
        expect(res.status).toBe(404)
        done()
      })
  })

  it("should return 400 when missed required parameters", done => {
    request
      .get(url + '/add')
      .end((err, res) => {
        expect(res.status).toBe(400)
        done()
      })
  })

  it("should call add method", done => {
    request
      .get(url + '/add?a=1&b=2')
      .end((err, res) => {
        expect(res.status).toBe(200)
        console.log(res.text)
        done()
      })
  })

})
