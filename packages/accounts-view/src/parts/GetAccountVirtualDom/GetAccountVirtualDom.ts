import { mergeClassNames, text, VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { Account } from '../Account/Account.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'

const accountCard: VirtualDomNode = { childCount: 5, className: 'AccountCard', type: VirtualDomElements.Li }

const accountDetails: VirtualDomNode = { childCount: 2, className: 'AccountDetails', type: VirtualDomElements.Div }

const accountHeading: VirtualDomNode = { childCount: 1, type: VirtualDomElements.H2 }

const accountEmail: VirtualDomNode = { childCount: 1, type: VirtualDomElements.P }

const accountProvider: VirtualDomNode = { childCount: 1, className: 'AccountProvider', type: VirtualDomElements.Span }

const buttonClassName = mergeClassNames('Button', 'ButtonSecondary')

const getAvatarFallback = (avatarSrc: string | undefined, initials: string): readonly VirtualDomNode[] => {
  if (avatarSrc) {
    return []
  }
  return [text(initials)]
}

export const getAccountVirtualDom = (account: Account): readonly VirtualDomNode[] => {
  const initials = account.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
  const avatarClassName = mergeClassNames('AccountAvatar', `AccountAvatar-${account.color}`)
  const avatar = account.avatarSrc
    ? { alt: '', ariaHidden: true, className: avatarClassName, src: account.avatarSrc, type: VirtualDomElements.Img }
    : { ariaHidden: true, childCount: 1, className: avatarClassName, type: VirtualDomElements.Span }
  return [
    accountCard,
    avatar,
    ...getAvatarFallback(account.avatarSrc, initials),
    accountDetails,
    accountHeading,
    text(account.displayName),
    accountEmail,
    text(account.email),
    accountProvider,
    text(account.provider),
    {
      ariaLabel: account.active ? `Active account ${account.displayName}` : `Use account ${account.displayName}`,
      childCount: 1,
      className: buttonClassName,
      disabled: account.active === true,
      inputType: 'button',
      name: `use-account:${account.id}`,
      onClick: DomEventListenerFunctions.HandleClick,
      type: VirtualDomElements.Button,
    },
    text(account.active ? 'Active Account' : 'Use This Account'),
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
