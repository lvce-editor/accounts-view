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

const getUseAccountVirtualDom = (account: Account, accountCount: number): readonly VirtualDomNode[] => {
  if (account.kind === 'integration' || (accountCount === 1 && account.active === true)) {
    return []
  }
  return [
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
  ]
}

export const getAccountVirtualDom = (account: Account, accountCount: number, children: readonly Account[] = []): readonly VirtualDomNode[] => {
  const isIntegration = account.kind === 'integration'
  const initials = account.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
  const avatarClassName = mergeClassNames('AccountAvatar', `AccountAvatar-${account.color}`)
  const avatar = account.avatarSrc
    ? { alt: '', ariaHidden: true, className: avatarClassName, src: account.avatarSrc, type: VirtualDomElements.Img }
    : { ariaHidden: true, childCount: 1, className: avatarClassName, type: VirtualDomElements.Span }
  const useAccountVirtualDom = getUseAccountVirtualDom(account, accountCount)
  const childList: VirtualDomNode[] =
    children.length > 0
      ? [
          { childCount: children.length, className: 'AccountChildren', type: VirtualDomElements.Ul },
          ...children.flatMap((child) => getAccountVirtualDom(child, accountCount)),
        ]
      : []
  return [
    { ...accountCard, childCount: 3 + (account.avatarSrc ? 0 : 1) + (useAccountVirtualDom.length > 0 ? 1 : 0) + (children.length > 0 ? 1 : 0) },
    avatar,
    ...getAvatarFallback(account.avatarSrc, initials),
    accountDetails,
    accountHeading,
    text(account.displayName),
    accountEmail,
    text(account.email),
    accountProvider,
    text(account.provider),
    ...useAccountVirtualDom,
    {
      ariaLabel: isIntegration ? `Disconnect ${account.displayName}` : `Sign out ${account.displayName}`,
      childCount: 1,
      className: buttonClassName,
      inputType: 'button',
      name: `${isIntegration ? 'disconnect' : 'sign-out'}:${account.id}`,
      onClick: DomEventListenerFunctions.HandleClick,
      type: VirtualDomElements.Button,
    },
    text(isIntegration ? `Disconnect ${account.displayName}` : 'Sign out'),
    ...childList,
  ]
}
