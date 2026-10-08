import type { Rpc } from '@lvce-editor/rpc'

const state: { rpc: Rpc | undefined } = { rpc: undefined }

export const set = (cacheWorkerRpc: Rpc): void => {
  state.rpc = cacheWorkerRpc
}

export const invoke = (command: string, ...args: readonly unknown[]): Promise<any> => {
  const { rpc } = state
  if (!rpc) {
    throw new Error('Cache worker RPC is not initialized')
  }
  return rpc.invoke(command, ...args)
}
