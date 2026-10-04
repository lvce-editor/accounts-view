import { mergeClassNames, text, VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { Account } from '../Account/Account.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

const accountCard: VirtualDomNode = { childCount: 4, className: 'AccountCard', type: VirtualDomElements.Li }

const accountDetails: VirtualDomNode = { childCount: 2, className: 'AccountDetails', type: VirtualDomElements.Div }

const accountHeading: VirtualDomNode = { childCount: 1, type: VirtualDomElements.H2 }

const accountEmail: VirtualDomNode = { childCount: 1, type: VirtualDomElements.P }

const accountProvider: VirtualDomNode = { childCount: 1, className: 'AccountProvider', type: VirtualDomElements.Span }

const buttonClassName = mergeClassNames('Button', 'ButtonSecondary')

export const getAccountVirtualDom = (account: Account): readonly VirtualDomNode[] => {
  const initials = account.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
  return [
    accountCard,
    { ariaHidden: true, childCount: 1, className: mergeClassNames('AccountAvatar', `AccountAvatar-${account.color}`), type: VirtualDomElements.Span },
    text(initials),
    accountDetails,
    accountHeading,
    text(account.displayName),
    accountEmail,
    text(account.email),
    accountProvider,
    text(account.provider),
    {
      ariaLabel: `Sign out ${account.displayName}`,
      childCount: 1,
      className: buttonClassName,
      inputType: 'button',
      name: `sign-out:${account.id}`,
      onClick: DomEventListenerFunctions.HandleClick,
      type: VirtualDomElements.Button,
    },
    text('Sign out'),
  ]
}
