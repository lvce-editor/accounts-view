import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { Account } from '../Account/Account.ts'
import type { AccountsState } from '../AccountsState/AccountsState.ts'

export const loadContent = async (state: AccountsState, accounts?: readonly Account[]): Promise<AccountsState> => {
  const connected = accounts ?? ((await RendererWorker.invoke('Layout.getAccounts')) as readonly Account[])
  return { ...state, accounts: connected.map((account) => ({ ...account })), initialized: true }
}
