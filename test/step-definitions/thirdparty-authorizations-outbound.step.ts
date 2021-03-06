/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License")
 and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed
 on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 - Sridhar Voruganti <sridhar.voruganti@modusbox.com>

 --------------
 ******/

import { Handlers, ServerAPI, ServerConfig } from '~/server'
import { Server, ServerInjectResponse } from '@hapi/hapi'
import { defineFeature, loadFeature } from 'jest-cucumber'
import { NotificationCallback, Message, PubSub } from '~/shared/pub-sub'
import { RedisConnectionConfig } from '~/shared/redis-connection'
import {
  OutboundThirdpartyAuthorizationsModelState,
} from '~/models/thirdparty.authorizations.interface'
import {
  thirdparty as tpAPI
} from '@mojaloop/api-snippets'
import Config from '~/shared/config'
import index from '~/index'
import path from 'path'

const apiPath = path.resolve(__dirname, '../../src/interface/api-outbound.yaml')
const featurePath = path.resolve(__dirname, '../features/thirdparty-authorizations-outbound.feature')
const feature = loadFeature(featurePath)

jest.mock('~/shared/pub-sub', () => {
  let handler: NotificationCallback
  let subId = 0
  return {
    PubSub: jest.fn(() => ({
      isConnected: true,
      subscribe: jest.fn(
        (_channel: string, cb: NotificationCallback) => {
          handler = cb
          return ++subId
        }
      ),
      unsubscribe: jest.fn(),
      publish: jest.fn(
        async (channel: string, message: Message) => {
          return handler(channel, message, subId)
        }
      ),
      connect: jest.fn(() => Promise.resolve()),
      disconnect: jest.fn()
    }))
  }
})

async function prepareOutboundAPIServer (): Promise<Server> {
  const serverConfig: ServerConfig = {
    port: Config.OUTBOUND.PORT,
    host: Config.OUTBOUND.HOST,
    api: ServerAPI.outbound
  }
  const serverHandlers = {
    ...Handlers.Shared,
    ...Handlers.Outbound
  }
  return index.server.setupAndStart(serverConfig, apiPath, serverHandlers)
}

defineFeature(feature, (test): void => {
  let server: Server
  let response: ServerInjectResponse

  afterEach((done): void => {
    server.events.on('stop', done)
    server.stop()
  })

  test('VerifyThirdPartyAuthorization', ({ given, when, then }): void => {
    const putThirdpartyAuthResponse: tpAPI.Schemas.ThirdpartyRequestsTransactionsIDAuthorizationsPutResponse = {
      challenge: 'challenge',
      consentId: '8e34f91d-d078-4077-8263-2c047876fcf6',
      sourceAccountId: 'dfspa.alice.1234',
      status: 'VERIFIED',
      value: 'value'
    }

    given('Outbound API server', async (): Promise<void> => {
      server = await prepareOutboundAPIServer()
    })

    when('I send a \'VerifyThirdPartyAuthorization\' request', async (): Promise<ServerInjectResponse> => {
      const request = {
        method: 'POST',
        url: '/thirdpartyRequests/transactions/12345/authorizations',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: {
          toParticipantId: 'dfspA',
          challenge: 'challenge',
          consentId: '8e34f91d-d078-4077-8263-2c047876fcf6',
          sourceAccountId: 'dfspa.alice.1234',
          status: 'PENDING',
          value: 'value'
        }
      }
      const pubSub = new PubSub({} as RedisConnectionConfig)
      // defer publication to notification channel
      setTimeout(() => pubSub.publish(
        'some-channel',
        putThirdpartyAuthResponse as unknown as Message
      ), 10)
      response = await server.inject(request)
      return response
    })

    then('I get a response with a status code of \'200\'', (): void => {
      expect(response.statusCode).toBe(200)
      expect(response.result).toEqual({
        ...putThirdpartyAuthResponse,
        currentState: OutboundThirdpartyAuthorizationsModelState.succeeded
      })
    })
  })
})
