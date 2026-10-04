import * as AccountsStates from '../AccountsStates/AccountsStates.ts'
import * as Diff from '../Diff/Diff.ts'

export const diff2 = (uid: number): readonly number[] => {
  const { oldState, scheduledState } = AccountsStates.get(uid)
  return Diff.diff(oldState, scheduledState)
}
