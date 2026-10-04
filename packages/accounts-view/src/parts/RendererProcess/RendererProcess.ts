import type { Rpc } from '@lvce-editor/rpc'
import { RendererProcess as RendererProcessRegistry } from '@lvce-editor/rpc-registry'

const state = {
  connected: false,
}

export const isConnected = (): boolean => {
  const { connected } = state
  return connected
}

export const invoke = (method: string, ...params: readonly unknown[]): Promise<any> => {
  return RendererProcessRegistry.invoke(method, ...params)
}

export const set = (rpc: Rpc): void => {
  RendererProcessRegistry.set(rpc)
  state.connected = true
}
