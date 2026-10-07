import { beforeEach, expect, test } from '@jest/globals'
import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { Account } from '../src/parts/Account/Account.ts'
import * as AccountsStates from '../src/parts/AccountsStates/AccountsStates.ts'
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
    expect(dom.filter((node) => node.disabled)).toHaveLength(accounts.length > 0 ? 1 : 0)
    expect(dom.some((node) => node.name === 'use-account:second')).toBe(accounts.length > 1)
  }
})
