import { AriaRoles, mergeClassNames, text, VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { AccountsState } from '../AccountsState/AccountsState.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as GetAccountVirtualDom from '../GetAccountVirtualDom/GetAccountVirtualDom.ts'

const heading: VirtualDomNode = { childCount: 1, type: VirtualDomElements.H1 }

const actions: VirtualDomNode = { childCount: 3, className: 'AccountsActions', type: VirtualDomElements.Div }

const providerLabel: VirtualDomNode = { childCount: 1, htmlFor: 'AccountsProvider', type: VirtualDomElements.Label }

const githubOption: VirtualDomNode = { childCount: 1, type: VirtualDomElements.Option, value: 'GitHub' }

const microsoftOption: VirtualDomNode = { childCount: 1, type: VirtualDomElements.Option, value: 'Microsoft' }

const addButton: VirtualDomNode = {
  childCount: 1,
  className: mergeClassNames('Button', 'ButtonPrimary'),
  inputType: 'button',
  name: 'add-account',
  onClick: DomEventListenerFunctions.HandleClick,
  type: VirtualDomElements.Button,
}

const status: VirtualDomNode = { childCount: 1, className: 'AccountsStatus', role: AriaRoles.Status, type: VirtualDomElements.P }

const emptyState: VirtualDomNode = { childCount: 2, className: 'AccountsEmptyState', type: VirtualDomElements.Div }

const emptyHeading: VirtualDomNode = { childCount: 1, type: VirtualDomElements.H2 }

const emptyDescription: VirtualDomNode = { childCount: 1, type: VirtualDomElements.P }

const viewletClassName = mergeClassNames('Viewlet', 'Accounts')

export const getAccountsVirtualDom = (state: AccountsState): readonly VirtualDomNode[] => {
  const { accounts, provider } = state
  const dom: VirtualDomNode[] = [
    { ariaLabel: 'Accounts', childCount: accounts.length === 0 ? 5 : 4, className: viewletClassName, type: VirtualDomElements.Div },
    heading,
    text('Accounts'),
    actions,
    providerLabel,
    text('Provider'),
    {
      childCount: 2,
      id: 'AccountsProvider',
      name: 'provider',
      onChange: DomEventListenerFunctions.HandleChange,
      type: VirtualDomElements.Select,
      value: provider,
    },
    githubOption,
    text('GitHub'),
    microsoftOption,
    text('Microsoft'),
    addButton,
    text('Add account'),
    status,
    text(`${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} connected`),
    { ariaLabel: 'Connected accounts', childCount: accounts.length, className: 'AccountList', type: VirtualDomElements.Ul },
    ...accounts.flatMap(GetAccountVirtualDom.getAccountVirtualDom),
  ]
  if (accounts.length === 0) {
    dom.push(
      emptyState,
      emptyHeading,
      text('No accounts connected'),
      emptyDescription,
      text('Add an account to get started. You can connect more than one.'),
    )
  }
  return dom
}
