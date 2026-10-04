import { WebWorkerRpcClient } from '@lvce-editor/rpc'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import * as AccountsStates from '../AccountsStates/AccountsStates.ts'
import * as CommandMap from '../CommandMap/CommandMap.ts'

export const listen = async (): Promise<void> => {
  AccountsStates.registerCommands(CommandMap.commandMap)
  const rpc = await WebWorkerRpcClient.create({ commandMap: CommandMap.commandMap })
  RendererWorker.set(rpc)
}
