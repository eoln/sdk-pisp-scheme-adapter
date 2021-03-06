/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Sridhar Voruganti <sridhar.voruganti@modusbox.com>
 --------------
 ******/

import { StateResponseToolkit } from '~/server/plugins/state'
import { Request, ResponseObject } from '@hapi/hapi'
import {
  OutboundAccountsData,
  OutboundAccountsModelConfig,
  OutboundAccountsGetResponse
} from '~/models/accounts.interface'
import {
  OutboundAccountsModel,
  create
} from '~/models/outbound/accounts.model'

/**
 * Handles outbound GET /accounts/{ID} request
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get (_context: any, request: Request, h: StateResponseToolkit): Promise<ResponseObject> {

  const userId: string = request.params.ID
  // prepare config
  const data: OutboundAccountsData = {
    toParticipantId: request.headers['fspiop-destination'],
    userId: userId,
    currentState: 'start'
  }
  const config: OutboundAccountsModelConfig = {
    key: userId,
    kvs: h.getKVS(),
    logger: h.getLogger(),
    pubSub: h.getPubSub(),
    requests: h.getThirdpartyRequests()
  }

  const model: OutboundAccountsModel = await create(data, config)
  const result = (await model.run()) as OutboundAccountsGetResponse
  const statusCode = (result.errorInformation) ? 500 : 200

  return h.response(result).code(statusCode)
}

export default {
  get
}
