import { LazyTransferMessagePortRpcParent, type Rpc } from '@lvce-editor/rpc'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import * as CacheWorker from '../CacheWorker/CacheWorker.ts'

export const initializeCacheWorker = async (): Promise<void> => {
  const rpc: Rpc = await LazyTransferMessagePortRpcParent.create({
    commandMap: {},
    send: async (port: MessagePort): Promise<void> => {
      await RendererWorker.invokeAndTransfer('SendMessagePortToExtensionHostWorker.sendMessagePortToCacheWorker', port)
    },
  })
  CacheWorker.set(rpc)
}
