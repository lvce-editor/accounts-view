import type { AccountsState } from '../AccountsState/AccountsState.ts'

export const handleClick = (state: AccountsState, name: string): AccountsState => {
  const { accounts, provider } = state
  if (name === 'add-account') {
    return {
      ...state,
      accounts: [
        ...accounts,
        {
          color: 'green',
          displayName: 'New demo account',
          email: 'new.account@example.com',
          id: `mock-added-${crypto.randomUUID()}`,
          provider,
        },
      ],
    }
  }
  if (!name.startsWith('sign-out:')) {
    return state
  }
  const id = name.slice('sign-out:'.length)
  const remainingAccounts = accounts.filter((account) => account.id !== id)
  return remainingAccounts.length === accounts.length ? state : { ...state, accounts: remainingAccounts }
}
