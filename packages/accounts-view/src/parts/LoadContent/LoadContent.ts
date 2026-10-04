import type { Account } from '../Account/Account.ts'
import type { AccountsState } from '../AccountsState/AccountsState.ts'

export const loadContent = (state: AccountsState, accounts: readonly Account[] = []): AccountsState => {
  return { ...state, accounts: accounts.map((account) => ({ ...account })), initialized: true }
}
