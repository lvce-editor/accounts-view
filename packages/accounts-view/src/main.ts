import type { Account, AccountAction, AccountResponse } from '../../accounts-worker/src/accountState.ts'

const accountList = document.querySelector<HTMLUListElement>('#account-list')
const emptyState = document.querySelector<HTMLElement>('#empty-state')
const status = document.querySelector<HTMLElement>('#status')
const loginButton = document.querySelector<HTMLButtonElement>('#login-button')
const providerSelect = document.querySelector<HTMLSelectElement>('#provider')

if (!accountList || !emptyState || !status || !loginButton || !providerSelect) {
  throw new Error('Account view markup is incomplete')
}

const workerUrl = new URL('/accounts-view/accounts-worker.js', location.origin)
workerUrl.search = location.search
const worker = new Worker(workerUrl, { type: 'module' })

const renderAccounts = (accounts: readonly Account[]): void => {
  accountList.replaceChildren()
  emptyState.hidden = accounts.length > 0
  for (const account of accounts) {
    const item = document.createElement('li')
    item.className = 'account-card'
    item.dataset.accountId = account.id

    const avatar = document.createElement('span')
    avatar.className = `avatar avatar-${account.color}`
    avatar.setAttribute('aria-hidden', 'true')
    avatar.textContent = account.displayName
      .split(' ')
      .map((part) => part[0])
      .join('')

    const details = document.createElement('div')
    details.className = 'account-details'
    const name = document.createElement('h2')
    name.textContent = account.displayName
    const email = document.createElement('p')
    email.textContent = account.email
    details.append(name, email)

    const provider = document.createElement('span')
    provider.className = 'provider'
    provider.textContent = account.provider

    const logout = document.createElement('button')
    logout.className = 'button button-secondary logout-button'
    logout.type = 'button'
    logout.textContent = 'Sign out'
    logout.setAttribute('aria-label', `Sign out ${account.displayName}`)
    logout.addEventListener('click', () => send({ accountId: account.id, type: 'logout' }))

    item.append(avatar, details, provider, logout)
    accountList.append(item)
  }
  status.textContent = `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} connected`
}

const send = (action: AccountAction): void => worker.postMessage(action)

// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- DOM event listeners require the platform's MessageEvent type.
worker.addEventListener('message', (event: MessageEvent<AccountResponse>) => {
  if (event.data.type === 'accounts') {
    renderAccounts(event.data.accounts)
  }
})

loginButton.addEventListener('click', () => send({ provider: providerSelect.value, type: 'login' }))
send({ type: 'get-accounts' })
