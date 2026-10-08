import { beforeEach, expect, jest, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import { VirtualDomElements } from '@lvce-editor/virtual-dom-worker'
import type { Account } from '../src/parts/Account/Account.ts'
import * as AccountsStates from '../src/parts/AccountsStates/AccountsStates.ts'
import * as CacheWorker from '../src/parts/CacheWorker/CacheWorker.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import { getAccountsVirtualDom } from '../src/parts/GetAccountsVirtualDom/GetAccountsVirtualDom.ts'

const account = { active: true, color: 'blue', displayName: 'Test User', email: 'test@example.com', id: 'test', provider: 'GitHub' }

beforeEach(() => {
  AccountsStates.clear()
  AccountsStates.registerCommands(commandMap)
})

test('loads the auth registry through the renderer and renders once', async () => {
  using rpc = RendererWorker.registerMockRpc({ 'Layout.getAccounts': () => [account] })
  commandMap['Accounts.create'](1)
  await commandMap['Accounts.loadContent'](1)
  expect(rpc.invocations).toEqual([['Layout.getAccounts']])
  expect(AccountsStates.get(1).newState.accounts).toEqual([account])
  const commands = await commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  expect(commands[0][0]).toBe('Viewlet.setDom2')
  expect(commandMap['Accounts.diff2'](1)).toEqual([])
})

test('add, switch, and sign out invoke real account commands and reload safe account metadata', async () => {
  const state: { accounts: readonly Account[] } = { accounts: [account] }
  using rpc = RendererWorker.registerMockRpc({
    'Layout.getAccounts': () => {
      const { accounts } = state
      return accounts
    },
    'Layout.removeAccount': (id: string) => {
      const { accounts } = state
      state.accounts = accounts.filter((item) => item.id !== id)
    },
    'Layout.signIn': () => {
      state.accounts = [
        { ...account, active: false },
        { ...account, id: 'second' },
      ]
    },
    'Layout.useAccount': (id: string) => {
      const { accounts } = state
      state.accounts = accounts.map((item) => ({ ...item, active: item.id === id }))
    },
  })
  commandMap['Accounts.create'](1)
  await commandMap['Accounts.loadContent'](1)
  await commandMap['Accounts.handleClick'](1, 'add-account')
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(2)
  await commandMap['Accounts.handleClick'](1, 'use-account:test')
  expect(AccountsStates.get(1).newState.accounts.map((item) => item.active)).toEqual([true, false])
  await commandMap['Accounts.handleClick'](1, 'sign-out:second')
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(1)
  expect(rpc.invocations).toContainEqual(['Layout.signIn'])
  expect(rpc.invocations).toContainEqual(['Layout.useAccount', 'test'])
  expect(rpc.invocations).toContainEqual(['Layout.removeAccount', 'second'])
})

test('failed additional login preserves the existing view state', async () => {
  using rpc = RendererWorker.registerMockRpc({
    'Layout.signIn': () => {
      throw new Error('Login cancelled.')
    },
  })
  commandMap['Accounts.create'](1)
  await commandMap['Accounts.loadContent'](1, [account])
  await expect(commandMap['Accounts.handleClick'](1, 'add-account')).rejects.toThrow('Login cancelled.')
  expect(AccountsStates.get(1).newState.accounts).toEqual([account])
  expect(rpc.invocations).toEqual([['Layout.signIn']])
})

test('snapshots supplied data, ignores missing accounts, and isolates view disposal', async () => {
  commandMap['Accounts.create'](1)
  commandMap['Accounts.create'](2)
  const input = [{ ...account }]
  await commandMap['Accounts.loadContent'](1, input)
  await commandMap['Accounts.loadContent'](2, [])
  input[0].displayName = 'Changed externally'
  expect(AccountsStates.get(1).newState.accounts[0].displayName).toBe('Test User')
  await commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  await commandMap['Accounts.handleClick'](1, 'unknown')
  await commandMap['Accounts.handleClick'](1, 'sign-out:missing')
  await commandMap['Accounts.handleClick'](1, 'use-account:missing')
  expect(commandMap['Accounts.diff2'](1)).toEqual([])
  commandMap['Accounts.dispose'](2)
  expect(AccountsStates.get(2)).toBeUndefined()
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(1)
})

test('flat virtual DOM has accessible switching controls and one active indicator', async () => {
  commandMap['Accounts.create'](1)
  for (const accounts of [[], [account], [account, { ...account, active: false, id: 'second' }]]) {
    await commandMap['Accounts.loadContent'](1, accounts)
    const dom = getAccountsVirtualDom(AccountsStates.get(1).newState)
    let remaining = 1
    for (const node of dom) {
      expect(remaining).toBeGreaterThan(0)
      remaining += (node.childCount || 0) - 1
    }
    expect(remaining).toBe(0)
    expect(dom.some((node) => node.name === 'add-account' && node.onClick === 'handleClick')).toBe(true)
    expect(dom.filter((node) => node.disabled)).toHaveLength(accounts.length > 1 ? 1 : 0)
    expect(dom.some((node) => node.text === 'Active Account')).toBe(accounts.length > 1)
    expect(dom.some((node) => node.name === 'sign-out:test')).toBe(accounts.length > 0)
    expect(dom.some((node) => node.name === 'use-account:second')).toBe(accounts.length > 1)
  }
})

test('keeps the use-account action for a sole inactive account', async () => {
  commandMap['Accounts.create'](9)
  await commandMap['Accounts.loadContent'](9, [{ ...account, active: false }])
  const dom = getAccountsVirtualDom(AccountsStates.get(9).newState)
  let remaining = 1
  for (const node of dom) {
    expect(remaining).toBeGreaterThan(0)
    remaining += (node.childCount || 0) - 1
  }
  expect(remaining).toBe(0)
  expect(dom.some((node) => node.name === 'use-account:test')).toBe(true)
  expect(dom.some((node) => node.text === 'Use This Account')).toBe(true)
})

test('renders integrations with disconnect controls instead of login switching', async () => {
  const integration: Account = {
    color: 'purple',
    connectionId: 'openrouter',
    displayName: 'OpenRouter',
    email: 'Connected integration',
    id: 'connection:openrouter',
    kind: 'integration',
    provider: 'OpenRouter',
  }
  commandMap['Accounts.create'](7)
  await commandMap['Accounts.loadContent'](7, [account, integration])
  const dom = getAccountsVirtualDom(AccountsStates.get(7).newState)
  expect(dom.find((node) => node.name === 'disconnect:connection:openrouter')).toMatchObject({
    ariaLabel: 'Disconnect OpenRouter',
  })
  expect(dom.some((node) => node.name === 'use-account:connection:openrouter')).toBe(false)
  expect(dom.some((node) => node.name === 'sign-out:connection:openrouter')).toBe(false)
  expect(dom.some((node) => node.text === '2 accounts connected')).toBe(true)
})

test('failed integration disconnect keeps the account visible and reports the error', async () => {
  const integration: Account = {
    color: 'purple',
    connectionId: 'openrouter',
    displayName: 'OpenRouter',
    email: 'Connected integration',
    id: 'connection:openrouter',
    kind: 'integration',
    provider: 'OpenRouter',
  }
  using rpc = RendererWorker.registerMockRpc({
    'Layout.disconnectConnectedAccount': () => {
      throw new Error('Unable to disconnect OpenRouter (500).')
    },
  })
  commandMap['Accounts.create'](8)
  await commandMap['Accounts.loadContent'](8, [integration])
  await commandMap['Accounts.handleClick'](8, 'disconnect:connection:openrouter')
  const state = AccountsStates.get(8).newState
  const { accounts, errorMessage } = state
  expect(accounts).toEqual([integration])
  expect(errorMessage).toBe('Unable to disconnect OpenRouter (500).')
  expect(rpc.invocations).toEqual([['Layout.disconnectConnectedAccount', 'openrouter']])
})

test('loads a GitHub avatar asynchronously and releases the image URL on dispose', async () => {
  CacheWorker.set(
    createMockRpc({
      commandMap: {
        'Cache.getCacheStorageItem': () => ({ body: Uint8Array.from([1, 2, 3]).buffer, headers: { 'content-type': 'image/png' } }),
      },
    }),
  )
  using rendererRpc = RendererWorker.registerMockRpc({ 'Viewlet.requestRender': () => undefined })
  const createObjectUrl = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:avatar')
  const revokeObjectUrl = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  commandMap['Accounts.create'](3)
  await commandMap['Accounts.loadContent'](3, [{ ...account, avatarUrl: 'https://avatars.githubusercontent.com/u/1' }])
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(AccountsStates.get(3).newState.accounts[0].avatarSrc).toBe('blob:avatar')
  expect(
    getAccountsVirtualDom(AccountsStates.get(3).newState).some((node) => node.type === VirtualDomElements.Img && node.src === 'blob:avatar'),
  ).toBe(true)
  expect(rendererRpc.invocations).toEqual([['Viewlet.requestRender', 3]])
  commandMap['Accounts.dispose'](3)
  expect(revokeObjectUrl).toHaveBeenCalledWith('blob:avatar')
  createObjectUrl.mockRestore()
  revokeObjectUrl.mockRestore()
})

test('does not restore a signed-out account after its avatar request completes', async () => {
  const cachedImage = Promise.withResolvers<{ body: ArrayBuffer; headers: { 'content-type': string } } | null>()
  CacheWorker.set(createMockRpc({ commandMap: { 'Cache.getCacheStorageItem': () => cachedImage.promise } }))
  const createObjectUrl = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:late-avatar')
  commandMap['Accounts.create'](4)
  await commandMap['Accounts.loadContent'](4, [{ ...account, avatarUrl: 'https://avatars.githubusercontent.com/u/2' }])
  await commandMap['Accounts.loadContent'](4, [])
  cachedImage.resolve({ body: Uint8Array.from([1]).buffer, headers: { 'content-type': 'image/png' } })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(AccountsStates.get(4).newState.accounts).toEqual([])
  expect(createObjectUrl).not.toHaveBeenCalled()
  createObjectUrl.mockRestore()
})

test('keeps initials when avatar download fails', async () => {
  CacheWorker.set(createMockRpc({ commandMap: { 'Cache.getCacheStorageItem': () => null } }))
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network unavailable'))
  commandMap['Accounts.create'](5)
  await commandMap['Accounts.loadContent'](5, [{ ...account, avatarUrl: 'https://avatars.githubusercontent.com/u/5' }])
  await new Promise((resolve) => setTimeout(resolve, 0))
  const dom = getAccountsVirtualDom(AccountsStates.get(5).newState)
  expect(dom.some((node) => node.type === VirtualDomElements.Img)).toBe(false)
  expect(dom.some((node) => node.text === 'TU')).toBe(true)
  fetchMock.mockRestore()
})

test('releases an avatar URL when an account avatar is replaced', async () => {
  CacheWorker.set(
    createMockRpc({
      commandMap: {
        'Cache.getCacheStorageItem': () => ({ body: Uint8Array.from([1]).buffer, headers: { 'content-type': 'image/png' } }),
      },
    }),
  )
  const createObjectUrl = jest.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:old-avatar').mockReturnValueOnce('blob:new-avatar')
  const revokeObjectUrl = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  commandMap['Accounts.create'](6)
  await commandMap['Accounts.loadContent'](6, [{ ...account, avatarUrl: 'https://avatars.githubusercontent.com/u/6?v=1' }])
  await new Promise((resolve) => setTimeout(resolve, 0))
  await commandMap['Accounts.loadContent'](6, [{ ...account, avatarUrl: 'https://avatars.githubusercontent.com/u/6?v=2' }])
  expect(revokeObjectUrl).toHaveBeenCalledWith('blob:old-avatar')
  await new Promise((resolve) => setTimeout(resolve, 0))
  commandMap['Accounts.dispose'](6)
  expect(revokeObjectUrl).toHaveBeenCalledWith('blob:new-avatar')
  createObjectUrl.mockRestore()
  revokeObjectUrl.mockRestore()
})
