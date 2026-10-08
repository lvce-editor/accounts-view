import * as AccountsStates from '../AccountsStates/AccountsStates.ts'
import * as Create from '../Create/Create.ts'
import * as Diff2 from '../Diff2/Diff2.ts'
import * as Dispose from '../Dispose/Dispose.ts'
import * as GetKeyBindings from '../GetKeyBindings/GetKeyBindings.ts'
import * as HandleChange from '../HandleChange/HandleChange.ts'
import * as HandleClick from '../HandleClick/HandleClick.ts'
import * as HandleMessagePort from '../HandleMessagePort/HandleMessagePort.ts'
import * as LoadContent from '../LoadContent/LoadContent.ts'
import * as Render2 from '../Render2/Render2.ts'
import * as RenderEventListeners from '../RenderEventListeners/RenderEventListeners.ts'

export const commandMap = {
  'Accounts.create': Create.create,
  'Accounts.diff2': Diff2.diff2,
  'Accounts.dispose': Dispose.dispose,
  'Accounts.getCommandIds': AccountsStates.getCommandIds,
  'Accounts.getKeyBindings': GetKeyBindings.getKeyBindings,
  'Accounts.handleChange': AccountsStates.wrapSerialCommand(HandleChange.handleChange),
  'Accounts.handleClick': AccountsStates.wrapSerialCommand(HandleClick.handleClick),
  'Accounts.handleMessagePort': HandleMessagePort.handleMessagePort,
  'Accounts.loadContent': AccountsStates.wrapSerialCommand(LoadContent.loadContent),
  'Accounts.render2': Render2.render2,
  'Accounts.renderEventListeners': RenderEventListeners.renderEventListeners,
}
