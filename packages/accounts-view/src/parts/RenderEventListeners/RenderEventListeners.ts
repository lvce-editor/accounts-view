import { EventExpression } from '@lvce-editor/constants'
import type { DomEventListener } from '../DomEventListener/DomEventListener.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

export const renderEventListeners = (): readonly DomEventListener[] => {
  return [
    { name: DomEventListenerFunctions.HandleClick, params: ['handleClick', EventExpression.TargetName] },
    { name: DomEventListenerFunctions.HandleChange, params: ['handleChange', EventExpression.TargetValue] },
  ]
}
