import type { AccountsState } from '../AccountsState/AccountsState.ts'

export const handleChange = (state: AccountsState, provider: string): AccountsState => {
  if (provider !== 'GitHub' && provider !== 'Microsoft') {
    throw new Error(`Unknown account provider: ${provider}`)
  }
  return { ...state, provider }
}
