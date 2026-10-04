/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- Browser events use platform Event types. */
import { ModuleWorkerWithMessagePortRpcParent, PlainMessagePortRpc, type Rpc } from '@lvce-editor/rpc'
import { createRenderer } from '@lvce-editor/virtual-dom'

const renderer = createRenderer()
const root = document.createElement('div')
document.body.append(root)
const pending = new Map<number, readonly (readonly unknown[])[]>()
const state = { nextTransaction: 0 }

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
  commandMap: { 'Viewlet.requestRender': render },
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
const accounts =
  new URL(location.href).searchParams.has('populated') || location.pathname.endsWith('/accounts-view-initial-render.html')
    ? [{ color: 'blue', displayName: 'Test User', email: 'test@example.com', id: 'test', provider: 'GitHub' }]
    : []
await workerRpc.invoke('Accounts.loadContent', 1, accounts)
await render()
