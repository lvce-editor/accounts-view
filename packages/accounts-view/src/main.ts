import type { VirtualDomNode } from '@lvce-editor/virtual-dom-worker'
import { ModuleWorkerRpcParent } from '@lvce-editor/rpc'
import { renderInto } from '@lvce-editor/virtual-dom'

interface AccountsRender {
  readonly count: number
  readonly dom: readonly VirtualDomNode[]
}

const accountContent = document.querySelector<HTMLElement>('#account-content')
const status = document.querySelector<HTMLElement>('#status')
const loginButton = document.querySelector<HTMLButtonElement>('#login-button')
const providerSelect = document.querySelector<HTMLSelectElement>('#provider')

if (!accountContent || !status || !loginButton || !providerSelect) {
  throw new Error('Account view markup is incomplete')
}

const workerUrl = new URL('accounts-worker.js', import.meta.url)
workerUrl.search = location.search
const rpcPromise = ModuleWorkerRpcParent.create({ commandMap: {}, url: workerUrl.href })
const uid = 1

const render = (view: AccountsRender): void => {
  renderInto(accountContent, view.dom, eventMap)
  status.textContent = `${view.count} ${view.count === 1 ? 'account' : 'accounts'} connected`
}

const update = async (command: string, ...args: readonly unknown[]): Promise<void> => {
  const rpc = await rpcPromise
  const view = (await rpc.invoke(command, uid, ...args)) as AccountsRender
  render(view)
}

const eventMap = {
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Virtual DOM click handlers receive the platform MouseEvent type.
  handleSignOut: (event: Readonly<MouseEvent>): void => {
    const button = event.currentTarget as HTMLButtonElement
    void update('Accounts.logout', button.name).catch((error: unknown) => console.error(error))
  },
}

loginButton.addEventListener('click', () => {
  void update('Accounts.login', providerSelect.value).catch((error: unknown) => console.error(error))
})

await update('Accounts.create', new URLSearchParams(location.search).get('empty') === '1')

window.addEventListener('pagehide', () => {
  void rpcPromise.then((rpc) => rpc.invoke('Accounts.dispose', uid)).catch((error: unknown) => console.error(error))
})
