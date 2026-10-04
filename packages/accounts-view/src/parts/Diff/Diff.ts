import type { AccountsState } from '../AccountsState/AccountsState.ts'
import * as DiffType from '../DiffType/DiffType.ts'

export const diff = (oldState: AccountsState, newState: AccountsState): readonly number[] => {
  if (oldState.accounts === newState.accounts && oldState.provider === newState.provider && oldState.initialized === newState.initialized) {
    return []
  }
  return [DiffType.RenderAccounts]
}
