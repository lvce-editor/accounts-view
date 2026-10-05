import { beforeEach, expect, test } from '@jest/globals'
import * as AccountsStates from '../src/parts/AccountsStates/AccountsStates.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import { getAccountsVirtualDom } from '../src/parts/GetAccountsVirtualDom/GetAccountsVirtualDom.ts'

const UNKNOWN_PROVIDER = /Unknown account provider/
const MISSING_COMMAND = /Viewlet command not found/

const account = { color: 'blue', displayName: 'Test User', email: 'test@example.com', id: 'test', provider: 'GitHub' }

beforeEach(() => {
  AccountsStates.clear()
  AccountsStates.registerCommands(commandMap)
})

test('initial render includes empty state and is consumed once', async () => {
  commandMap['Accounts.create'](1)
  await commandMap['Accounts.loadContent'](1)
  const diff = commandMap['Accounts.diff2'](1)
  expect(diff).toHaveLength(1)
  const commands = await commandMap['Accounts.render2'](1, diff)
  expect(commands[0][0]).toBe('Viewlet.setDom2')
  expect(getAccountsVirtualDom(AccountsStates.get(1).newState).some((node) => node.className === 'AccountsEmptyState')).toBe(true)
  expect(commandMap['Accounts.diff2'](1)).toEqual([])
  expect(await commandMap['Accounts.render2'](1, [])).toEqual([])
})

test('account state and disposal are isolated by uid', async () => {
  commandMap['Accounts.create'](1)
  commandMap['Accounts.create'](2)
  await commandMap['Accounts.loadContent'](1, [account])
  await commandMap['Accounts.loadContent'](2)
  await commandMap['Accounts.handleChange'](2, 'Microsoft')
  await commandMap['Accounts.handleClick'](2, 'add-account')
  expect(AccountsStates.get(1).newState.accounts).toEqual([account])
  expect(AccountsStates.get(2).newState.accounts[0].provider).toBe('Microsoft')
  await commandMap['Accounts.handleClick'](1, 'sign-out:test')
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(0)
  expect(AccountsStates.get(2).newState.accounts).toHaveLength(1)
  commandMap['Accounts.dispose'](2)
  expect(AccountsStates.get(2)).toBeUndefined()
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(0)
})

test('concurrent add commands preserve both accounts', async () => {
  commandMap['Accounts.create'](1)
  await Promise.all([commandMap['Accounts.handleClick'](1, 'add-account'), commandMap['Accounts.handleClick'](1, 'add-account')])
  const { accounts } = AccountsStates.get(1).newState
  expect(accounts).toHaveLength(2)
  expect(accounts[0].id).not.toBe(accounts[1].id)
})

test('load snapshots caller data and no-op actions do not schedule a render', async () => {
  commandMap['Accounts.create'](1)
  const input = [{ ...account }]
  await commandMap['Accounts.loadContent'](1, input)
  input[0].displayName = 'Changed externally'
  expect(AccountsStates.get(1).newState.accounts[0].displayName).toBe('Test User')
  await commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  await commandMap['Accounts.handleClick'](1, 'unknown')
  await commandMap['Accounts.handleClick'](1, 'sign-out:missing')
  expect(commandMap['Accounts.diff2'](1)).toEqual([])
  await expect(commandMap['Accounts.handleChange'](1, 'Invalid')).rejects.toThrow(UNKNOWN_PROVIDER)
})

test('virtual DOM is a complete flat tree with named event handlers', async () => {
  commandMap['Accounts.create'](1)
  for (const accounts of [[], [account], [account, { ...account, id: 'second' }]]) {
    await commandMap['Accounts.loadContent'](1, accounts)
    const dom = getAccountsVirtualDom(AccountsStates.get(1).newState)
    let remaining = 1
    for (const node of dom) {
      expect(remaining).toBeGreaterThan(0)
      remaining += (node.childCount || 0) - 1
    }
    expect(remaining).toBe(0)
    expect(dom.some((node) => node.name === 'add-account' && node.onClick === 'handleClick')).toBe(true)
    expect(dom.some((node) => node.name === 'provider' && node.onChange === 'handleChange')).toBe(true)
    expect(dom.some((node) => node.ariaLabel === 'Sign out Test User')).toBe(accounts.length > 0)
    expect(dom.every((node) => node.className !== 'AccountsEmptyState')).toBe(accounts.length > 0)
  }
})

test('direct events dispatch through registered commands and request rendering', async () => {
  commandMap['Accounts.create'](1)
  const rendered: number[] = []
  const events = AccountsStates.createDirectEventCommandMap(async (uid) => {
    rendered.push(uid)
  })
  await events['Viewlet.executeViewletCommand'](1, 'handleClick', 'add-account')
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(1)
  expect(rendered).toEqual([1])
  await expect(events['Viewlet.executeViewletCommand'](1, 'missing')).rejects.toThrow(MISSING_COMMAND)
})
