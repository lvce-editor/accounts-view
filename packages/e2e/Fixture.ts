/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- Browser events use platform Event types. */
import { ModuleWorkerWithMessagePortRpcParent, PlainMessagePortRpc, type Rpc } from '@lvce-editor/rpc'
import { createRenderer } from '@lvce-editor/virtual-dom'

const renderer = createRenderer()
const root = document.createElement('div')
document.body.append(root)
const pending = new Map<number, readonly (readonly unknown[])[]>()
interface Account {
  readonly active?: boolean
  readonly avatarUrl?: string
  readonly color: string
  readonly connectionId?: string
  readonly displayName: string
  readonly email: string
  readonly id: string
  readonly kind?: 'integration' | 'login'
  readonly provider: string
}

const state: { accounts: readonly Account[]; nextAccount: number; nextTransaction: number } = {
  accounts:
    new URL(location.href).searchParams.has('populated') ||
    location.pathname.endsWith('/accounts-view-initial-render.html') ||
    location.pathname.endsWith('/accounts-view-avatar.html') ||
    location.pathname.endsWith('/accounts-view-connected-account.html')
      ? [
          ...(location.pathname.endsWith('/accounts-view-connected-account.html')
            ? [
                {
                  active: true,
                  color: 'blue',
                  displayName: 'Test User',
                  email: 'test@example.com',
                  id: 'test',
                  provider: 'LVCE Editor',
                },
                {
                  color: 'purple',
                  connectionId: 'openrouter',
                  displayName: 'OpenRouter',
                  email: 'Connected integration',
                  id: 'connection:openrouter',
                  kind: 'integration' as const,
                  provider: 'OpenRouter',
                },
              ]
            : [
                {
                  active: true,
                  ...(location.pathname.endsWith('/accounts-view-avatar.html') && { avatarUrl: 'https://avatars.githubusercontent.com/u/12345' }),
                  color: 'blue',
                  displayName: 'Test User',
                  email: 'test@example.com',
                  id: 'test',
                  provider: location.pathname.endsWith('/accounts-view-avatar.html') ? 'GitHub' : 'LVCE Editor',
                },
              ]),
        ]
      : [],
  nextAccount: 0,
  nextTransaction: 0,
}

const eventMap = {
  handleChange: (event: Readonly<Event>): void => {
    const target = event.currentTarget as HTMLSelectElement
    void eventsRpc.invoke('Viewlet.executeViewletCommand', 1, 'handleChange', target.value)
  },
  handleClick: (event: Readonly<Event>): void => {
    const target = event.currentTarget as HTMLButtonElement
    void eventsRpc.invoke('Viewlet.executeViewletCommand', 1, 'handleClick', target.name)
  },
}

const render = async (): Promise<void> => {
  const diff = await workerRpc.invoke('Accounts.diff2', 1)
  const commits: readonly (readonly unknown[])[] = await workerRpc.invoke('Accounts.render2', 1, diff)
  for (const commit of commits) {
    const transactionId = commit[2] as number
    const commands = pending.get(transactionId) || []
    for (const command of commands) {
      if (command[0] === 'Viewlet.setDom2') {
        renderer.renderInto(root, command[2] as Parameters<typeof renderer.renderInto>[1], eventMap)
      }
    }
    pending.delete(transactionId)
  }
}

const channel = new MessageChannel()
await ModuleWorkerWithMessagePortRpcParent.create({ commandMap: {}, port: channel.port2, url: '/accountsWorkerMain.js' })
const workerRpc: Rpc = await PlainMessagePortRpc.create({
  commandMap: {
    'Layout.disconnectConnectedAccount': (provider: string): void => {
      const { accounts } = state
      state.accounts = accounts.filter((account) => account.connectionId !== provider)
    },
    'Layout.getAccounts': () => {
      const { accounts } = state
      return accounts
    },
    'Layout.removeAccount': (id: string): void => {
      const { accounts } = state
      const removed = accounts.find((account) => account.id === id)
      state.accounts = accounts.filter((account) => account.id !== id)
      const { accounts: remaining } = state
      if (removed?.active && remaining.length > 0) {
        state.accounts = remaining.map((account, index) => ({ ...account, active: index === 0 }))
      }
    },
    'Layout.signIn': (): void => {
      const { accounts } = state
      const id = `account-${++state.nextAccount}`
      state.accounts = [
        ...accounts.map((account) => ({ ...account, active: false })),
        {
          active: true,
          color: 'blue',
          displayName: id,
          email: `${id}@example.com`,
          id,
          provider: 'LVCE Editor',
        },
      ]
    },
    'Layout.useAccount': (id: string): void => {
      const { accounts } = state
      state.accounts = accounts.map((account) => ({ ...account, active: account.id === id }))
    },
    'SendMessagePortToExtensionHostWorker.sendMessagePortToCacheWorker': async (port: MessagePort): Promise<void> => {
      const body = Uint8Array.from([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68,
        65, 84, 8, 215, 99, 96, 96, 96, 248, 15, 0, 1, 4, 1, 0, 90, 90, 18, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
      ]).buffer
      await PlainMessagePortRpc.create({
        commandMap: {
          'Cache.getCacheStorageItem': (url: string) =>
            url === 'https://avatars.githubusercontent.com/u/12345'
              ? { body, headers: { 'content-type': 'image/png' }, status: 200, statusText: 'OK' }
              : null,
        },
        messagePort: port,
      })
    },
    'Viewlet.requestRender': render,
  },
  messagePort: channel.port1,
})
const directChannel = new MessageChannel()
const eventsRpc: Rpc = await PlainMessagePortRpc.create({
  commandMap: {
    'Viewlet.queueCommands': (uid: number, commands: readonly (readonly unknown[])[]): number => {
      const id = ++state.nextTransaction
      pending.set(id, commands)
      return id
    },
  },
  messagePort: directChannel.port1,
})
await workerRpc.invokeAndTransfer('Accounts.handleMessagePort', directChannel.port2)
await workerRpc.invoke('Accounts.create', 1)
await workerRpc.invoke('Accounts.loadContent', 1)
await render()
