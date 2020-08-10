#!./node_modules/.bin/ts-node
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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import path from 'path'
import { Command } from 'commander'
import config, { PACKAGE } from './shared/config'
import ServiceServer from './server'

// handle script parameters
const program = new Command(PACKAGE.name)

// process parameters
program
  .version(PACKAGE.version)
  .description('auth-service cli')
  .option('-p, --port <number>', 'listen on port', config.PORT.toString())
  .option('-H, --host <string>', 'listen on host', config.HOST)
  .parse(process.argv)

// update also config from program parameters
config.PORT = parseInt(program.port)
config.HOST = program.host

const apiPath = path.resolve(__dirname, '../src/interface/api.yaml')
// setup & start @hapi server
ServiceServer.setupAndStart(config, apiPath)
