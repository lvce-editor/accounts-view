import type { Account } from '../Account/Account.ts'

export interface AccountsState {
  readonly accounts: readonly Account[]
  readonly errorMessage?: string
  readonly initialized: boolean
  readonly provider: string
  readonly uid: number
}
