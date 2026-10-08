import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { AccountsState } from '../AccountsState/AccountsState.ts'
import { loadContent } from '../LoadContent/LoadContent.ts'

export const handleClick = async (state: AccountsState, name: string): Promise<AccountsState> => {
  const { accounts } = state
  if (name === 'add-account') {
    await RendererWorker.invoke('Layout.signIn')
    return loadContent(state)
  }
  for (const [prefix, command] of [
    ['use-account:', 'Layout.useAccount'],
    ['sign-out:', 'Layout.removeAccount'],
  ] as const) {
    if (name.startsWith(prefix)) {
      const id = name.slice(prefix.length)
      const account = accounts.find((item) => item.id === id)
      if (!account || account.kind === 'integration') {
        return state
      }
      await RendererWorker.invoke(command, id)
      return loadContent(state)
    }
  }
  if (name.startsWith('disconnect:')) {
    const account = accounts.find((item) => item.id === name.slice('disconnect:'.length))
    if (account?.kind !== 'integration' || !account.connectionId) {
      return state
    }
    try {
      await RendererWorker.invoke('Layout.disconnectConnectedAccount', account.connectionId)
      return loadContent({ ...state, errorMessage: '' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to disconnect account.'
      return { ...state, errorMessage }
    }
  }
  return state
}
