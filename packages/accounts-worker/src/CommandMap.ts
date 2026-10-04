import { dispose, get, set, type AccountsState } from './AccountsState.ts'
import { createAccountState, updateAccounts } from './accountState.ts'
import { renderAccounts } from './RenderAccounts.ts'

interface AccountsRender {
  readonly count: number
  readonly dom: ReturnType<typeof renderAccounts>
}

const render = (accounts: AccountsState['accounts']): AccountsRender => ({
  count: accounts.length,
  dom: renderAccounts(accounts),
})

const create = (uid: number, empty: boolean): AccountsRender => {
  const state = { accounts: createAccountState(empty) }
  set(uid, state, state)
  const { accounts } = state
  return render(accounts)
}

const getAccounts = (uid: number): AccountsRender => render(get(uid).newState.accounts)

const login = (uid: number, provider: string): AccountsRender => {
  const { newState: state } = get(uid)
  const { accounts } = state
  const nextState = { accounts: updateAccounts(accounts, { provider, type: 'login' }) }
  set(uid, state, nextState)
  return render(nextState.accounts)
}

const logout = (uid: number, accountId: string): AccountsRender => {
  const { newState: state } = get(uid)
  const { accounts } = state
  const nextState = { accounts: updateAccounts(accounts, { accountId, type: 'logout' }) }
  set(uid, state, nextState)
  return render(nextState.accounts)
}

const disposeView = (uid: number): void => dispose(uid)

export const commandMap = {
  'Accounts.create': create,
  'Accounts.dispose': disposeView,
  'Accounts.getAccounts': getAccounts,
  'Accounts.login': login,
  'Accounts.logout': logout,
}
