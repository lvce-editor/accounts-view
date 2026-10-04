import { WebWorkerRpcClient2 } from '@lvce-editor/rpc'
import { registerCommands } from './AccountsState.ts'
import { commandMap } from './CommandMap.ts'

export const listen = async (): Promise<void> => {
  registerCommands(commandMap)
  await WebWorkerRpcClient2.create({ commandMap })
}
