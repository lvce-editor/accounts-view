import * as AccountsStates from '../AccountsStates/AccountsStates.ts'
import * as DiffType from '../DiffType/DiffType.ts'
import * as RenderAccounts from '../RenderAccounts/RenderAccounts.ts'
import * as RendererProcess from '../RendererProcess/RendererProcess.ts'

export const render2 = async (uid: number, diffResult: readonly number[]): Promise<readonly (readonly unknown[])[]> => {
  const { oldState, scheduledState } = AccountsStates.get(uid)
  const commands = diffResult.map((diffType) => {
    if (diffType !== DiffType.RenderAccounts) {
      throw new Error(`Unknown renderer: ${diffType}`)
    }
    return RenderAccounts.renderAccounts(oldState, scheduledState)
  })
  if (commands.length === 0) {
    return []
  }
  AccountsStates.set(uid, scheduledState, scheduledState)
  if (!RendererProcess.isConnected()) {
    return commands
  }
  try {
    const transactionId = await RendererProcess.invoke('Viewlet.queueCommands', uid, [...commands, ['Viewlet.setUid', uid, uid]])
    return [['Viewlet.commitPending', uid, transactionId]]
  } catch (error) {
    const current = AccountsStates.get(uid)
    if (current?.oldState === scheduledState) {
      AccountsStates.set(uid, oldState, current.newState, current.scheduledState)
    }
    throw error
  }
}
