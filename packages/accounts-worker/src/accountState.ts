export interface Account {
  readonly color: string
  readonly displayName: string
  readonly email: string
  readonly id: string
  readonly provider: string
}

export type AccountAction =
  { readonly type: 'get-accounts' } | { readonly type: 'login'; readonly provider: string } | { readonly type: 'logout'; readonly accountId: string }

export type AccountResponse =
  { readonly type: 'accounts'; readonly accounts: readonly Account[] } | { readonly type: 'error'; readonly message: string }

const mockAccounts: readonly Account[] = [
  {
    color: 'violet',
    displayName: 'Ava Chen',
    email: 'ava.chen@example.com',
    id: 'github-ava',
    provider: 'GitHub',
  },
  {
    color: 'blue',
    displayName: 'Sam Rivera',
    email: 'sam.rivera@example.com',
    id: 'microsoft-sam',
    provider: 'Microsoft',
  },
]

export const createAccountState = (empty = false): Account[] => (empty ? [] : mockAccounts.map((account) => ({ ...account })))

export const updateAccounts = (accounts: readonly Account[], action: AccountAction): Account[] => {
  switch (action.type) {
    case 'get-accounts':
      return accounts.map((account) => ({ ...account }))
    case 'login': {
      const account: Account = {
        color: 'green',
        displayName: 'New demo account',
        email: 'new.account@example.com',
        id: `mock-added-${crypto.randomUUID()}`,
        provider: action.provider,
      }
      return [...accounts, account]
    }
    case 'logout':
      return accounts.filter((account) => account.id !== action.accountId)
  }
}
