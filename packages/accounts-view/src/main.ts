import { renderInto } from '@lvce-editor/virtual-dom'
import { mergeClassNames, text, VirtualDomElements, type VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import type { Account, AccountAction, AccountResponse } from '../../accounts-worker/src/accountState.ts'

const accountContent = document.querySelector<HTMLElement>('#account-content')
const status = document.querySelector<HTMLElement>('#status')
const loginButton = document.querySelector<HTMLButtonElement>('#login-button')
const providerSelect = document.querySelector<HTMLSelectElement>('#provider')

if (!accountContent || !status || !loginButton || !providerSelect) {
  throw new Error('Account view markup is incomplete')
}

const workerUrl = new URL('/accounts-view/accounts-worker.js', location.origin)
workerUrl.search = location.search
const worker = new Worker(workerUrl, { type: 'module' })

interface TreeNode {
  readonly children: readonly TreeNode[]
  readonly node: VirtualDomNode
}

const node = (type: number, properties: Readonly<Record<string, unknown>> = {}, children: readonly TreeNode[] = []): TreeNode => ({
  children,
  node: { ...properties, childCount: children.length, type },
})

const textNode = (value: string): TreeNode => ({ children: [], node: text(value) })
const logoutClassName = mergeClassNames('button', 'button-secondary', 'logout-button')

const flatten = (tree: TreeNode): readonly VirtualDomNode[] => {
  const nodes: VirtualDomNode[] = []
  const pending = [tree]
  while (pending.length > 0) {
    const current = pending.pop()!
    nodes.push(current.node)
    for (let index = current.children.length - 1; index >= 0; index--) {
      pending.push(current.children[index])
    }
  }
  return nodes
}

const renderAccount = (account: Account): TreeNode => {
  const initials = account.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
  const avatar = node(VirtualDomElements.Span, { ariaHidden: 'true', className: mergeClassNames('avatar', `avatar-${account.color}`) }, [
    textNode(initials),
  ])
  const details = node(VirtualDomElements.Div, { className: 'account-details' }, [
    node(VirtualDomElements.H2, {}, [textNode(account.displayName)]),
    node(VirtualDomElements.P, {}, [textNode(account.email)]),
  ])
  const provider = node(VirtualDomElements.Span, { className: 'provider' }, [textNode(account.provider)])
  const signOut = node(
    VirtualDomElements.Button,
    {
      ariaLabel: `Sign out ${account.displayName}`,
      className: logoutClassName,
      name: account.id,
      onClick: 'handleSignOut',
      inputType: 'button',
    },
    [textNode('Sign out')],
  )
  return node(VirtualDomElements.Li, { className: 'account-card', 'data-accountId': account.id }, [avatar, details, provider, signOut])
}

const renderAccounts = (accounts: readonly Account[]): readonly VirtualDomNode[] => {
  const list = node(
    VirtualDomElements.Ul,
    { ariaLabel: 'Connected accounts', className: 'account-list', id: 'account-list' },
    accounts.map(renderAccount),
  )
  const children = [list]
  if (accounts.length === 0) {
    const emptyIcon = node(VirtualDomElements.Span, { ariaHidden: 'true', className: 'empty-icon' }, [textNode('◎')])
    const emptyTitle = node(VirtualDomElements.H2, {}, [textNode('No accounts connected')])
    const emptyDescription = node(VirtualDomElements.P, {}, [textNode('Add an account to get started. You can connect more than one.')])
    const emptyState = node(VirtualDomElements.Div, { className: 'empty-state', id: 'empty-state', role: 'status' }, [
      emptyIcon,
      emptyTitle,
      emptyDescription,
    ])
    children.push(emptyState)
  }
  return flatten(node(VirtualDomElements.Div, {}, children))
}

const send = (action: AccountAction): void => worker.postMessage(action)

const createAccountRenderer = (): ((accounts: readonly Account[]) => void) => {
  const eventMap = {
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Virtual DOM click handlers receive the platform MouseEvent type.
    handleSignOut: (event: Readonly<MouseEvent>): void => {
      const button = event.currentTarget as HTMLButtonElement
      send({ accountId: button.name, type: 'logout' })
    },
  }
  return (accounts: readonly Account[]): void => {
    renderInto(accountContent, renderAccounts(accounts), eventMap)
    status.textContent = `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} connected`
  }
}

const updateView = createAccountRenderer()

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- DOM event listeners require the platform's MessageEvent type.
worker.addEventListener('message', (event: MessageEvent<AccountResponse>) => {
  if (event.data.type === 'accounts') {
    updateView(event.data.accounts)
  }
})

loginButton.addEventListener('click', () => send({ provider: providerSelect.value, type: 'login' }))
send({ type: 'get-accounts' })
