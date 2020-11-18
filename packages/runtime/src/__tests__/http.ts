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
import { Platform } from '../platform'
import { createJsonRpcMethod } from '../modules/rpc'

describe("http", () => {

  const url = 'localhost:8080'
  let platform: Platform

  beforeAll(() => {
    const config = {
      services: {
        redis: {
          development: {},
          production: {}
        }
      },
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
        },
        '/json-rpc': {
          post: {
            requestBody: {
              content: 'application/json'
            }
          }
        }
      }
    }
    const http = {
      '/add': {
        get: function(a: number, b: number): number { return a + b }
      },
      '/json-rpc': {
        post: createJsonRpcMethod()
      }
    }
    const api = class {
      add(a: number, b: number): number { return a + b }
    }

    platform = new Platform(config, { http, api }, 'development')
    platform.start('http')
    platform.start('rpc-local')
    platform.start('rpc-subscriber')
  })

  afterAll(() => {
    platform.shutdown()
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

  it("should call add via json rpc over http", done => {
    request
      .post(url + '/json-rpc')
      .send({ method: 'add', params: [5,6] })
      .end((err, res) => {
        console.log(err?.status)
        console.log(res?.text)
        expect(res.status).toBe(200)
        done()
      })
  })

})
