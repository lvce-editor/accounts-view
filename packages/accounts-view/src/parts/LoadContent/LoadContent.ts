import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { Account } from '../Account/Account.ts'
import type { AccountsState } from '../AccountsState/AccountsState.ts'
import * as LoadAvatar from '../LoadAvatar/LoadAvatar.ts'

export const loadContent = async (state: AccountsState, accounts?: readonly Account[]): Promise<AccountsState> => {
  const { uid } = state
  const { accounts: previousAccounts } = state
  const connected = accounts ?? ((await RendererWorker.invoke('Layout.getAccounts')) as readonly Account[])
  const currentAccounts = new Map(previousAccounts.map((account) => [account.id, account]))
  const nextAccounts = connected.map((account) => {
    const previous = currentAccounts.get(account.id)
    return {
      ...account,
      ...(previous?.provider === account.provider &&
        previous.avatarUrl === account.avatarUrl &&
        previous.avatarSrc && { avatarSrc: previous.avatarSrc }),
    }
  })
  for (const account of previousAccounts) {
    const replacement = nextAccounts.find((item) => item.id === account.id)
    if (account.avatarSrc && (replacement?.provider !== account.provider || replacement.avatarUrl !== account.avatarUrl)) {
      URL.revokeObjectURL(account.avatarSrc)
    }
  }
  const nextState = { ...state, accounts: nextAccounts, initialized: true }
  for (const account of nextAccounts) {
    void LoadAvatar.loadAvatar(uid, account)
  }
  return nextState
}
