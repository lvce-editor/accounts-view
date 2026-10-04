import * as ViewletRegistry from '@lvce-editor/viewlet-registry'
import type { AccountsState } from '../AccountsState/AccountsState.ts'

export const { clear, createDirectEventCommandMap, dispose, get, getCommandIds, registerCommands, set, wrapSerialCommand } =
  ViewletRegistry.create<AccountsState>()
