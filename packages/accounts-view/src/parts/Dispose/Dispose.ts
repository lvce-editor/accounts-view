import type { AccountsState } from '../AccountsState/AccountsState.ts'
import * as AccountsStates from '../AccountsStates/AccountsStates.ts'

export const dispose = (uid: number): void => {
  const state = AccountsStates.get(uid)?.newState as AccountsState | undefined
  if (state) {
    const { accounts } = state
    for (const account of accounts) {
      if (account.avatarSrc) {
        URL.revokeObjectURL(account.avatarSrc)
      }
    }
  }
  AccountsStates.dispose(uid)
}
