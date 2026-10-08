import type { Account } from '../Account/Account.ts'

export interface AccountsState {
  readonly accounts: readonly Account[]
  readonly initialized: boolean
  readonly errorMessage?: string
  readonly provider: string
  readonly uid: number
}
