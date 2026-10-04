import * as ViewletRegistry from '@lvce-editor/viewlet-registry'
import type { Account } from './accountState.ts'

export interface AccountsState {
  readonly accounts: readonly Account[]
}

export const { dispose, get, registerCommands, set } = ViewletRegistry.create<AccountsState>()
