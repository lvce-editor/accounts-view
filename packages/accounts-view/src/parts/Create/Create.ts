import type { AccountsState } from '../AccountsState/AccountsState.ts'
import * as AccountsStates from '../AccountsStates/AccountsStates.ts'

export const create = (uid: number): void => {
  const state: AccountsState = { accounts: [], initialized: false, provider: 'GitHub', uid }
  AccountsStates.set(uid, state, state)
}
