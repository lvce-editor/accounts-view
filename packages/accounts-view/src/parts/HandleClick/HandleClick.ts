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
  ]) {
    if (name.startsWith(prefix)) {
      const id = name.slice(prefix.length)
      if (accounts.every((account) => account.id !== id)) {
        return state
      }
      await RendererWorker.invoke(command, id)
      return loadContent(state)
    }
  }
  return state
}
