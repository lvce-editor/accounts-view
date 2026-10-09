import { AriaRoles, mergeClassNames, text, VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { AccountsState } from '../AccountsState/AccountsState.ts'
import * as DomEventListenerFunctions from '../DomEventListenerFunctions/DomEventListenerFunctions.ts'
import * as GetAccountVirtualDom from '../GetAccountVirtualDom/GetAccountVirtualDom.ts'

const actions: VirtualDomNode = { childCount: 1, className: 'AccountsActions', type: VirtualDomElements.Div }

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
  const { accounts, errorMessage } = state
  const loginIds = new Set(accounts.filter((account) => account.kind !== 'integration').map((account) => account.id))
  const childrenByAccountId = new Map<string, (typeof accounts)[number][]>()
  for (const account of accounts) {
    if (account.kind !== 'integration' || !account.parentAccountId || !loginIds.has(account.parentAccountId)) {
      continue
    }
    const children = childrenByAccountId.get(account.parentAccountId) || []
    children.push(account)
    childrenByAccountId.set(account.parentAccountId, children)
  }
  const topLevelAccounts = accounts.filter(
    (account) => account.kind !== 'integration' || !account.parentAccountId || !loginIds.has(account.parentAccountId),
  )
  const dom: VirtualDomNode[] = [
    { ariaLabel: 'Accounts', childCount: accounts.length === 0 ? 4 : 3, className: viewletClassName, type: VirtualDomElements.Div },
    actions,
    addButton,
    text('Add Another Account'),
    status,
    text(errorMessage || `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} connected`),
    { ariaLabel: 'Connected accounts', childCount: topLevelAccounts.length, className: 'AccountList', type: VirtualDomElements.Ul },
    ...topLevelAccounts.flatMap((account) =>
      GetAccountVirtualDom.getAccountVirtualDom(account, accounts.length, childrenByAccountId.get(account.id)),
    ),
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
