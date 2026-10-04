import type { AccountsState } from '../AccountsState/AccountsState.ts'
import * as GetAccountsVirtualDom from '../GetAccountsVirtualDom/GetAccountsVirtualDom.ts'

export const renderAccounts = (_oldState: AccountsState, newState: AccountsState): readonly unknown[] => {
  return ['Viewlet.setDom2', newState.uid, GetAccountsVirtualDom.getAccountsVirtualDom(newState)]
}
