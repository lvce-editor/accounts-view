import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
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

void test('initial render includes empty state and is consumed once', async () => {
  commandMap['Accounts.create'](1)
  await commandMap['Accounts.loadContent'](1)
  const diff = commandMap['Accounts.diff2'](1)
  assert.equal(diff.length, 1)
  const commands = await commandMap['Accounts.render2'](1, diff)
  assert.equal(commands[0][0], 'Viewlet.setDom2')
  assert.ok(getAccountsVirtualDom(AccountsStates.get(1).newState).some((node) => node.className === 'AccountsEmptyState'))
  assert.deepEqual(commandMap['Accounts.diff2'](1), [])
  assert.deepEqual(await commandMap['Accounts.render2'](1, []), [])
})

void test('account state and disposal are isolated by uid', async () => {
  commandMap['Accounts.create'](1)
  commandMap['Accounts.create'](2)
  await commandMap['Accounts.loadContent'](1, [account])
  await commandMap['Accounts.loadContent'](2)
  await commandMap['Accounts.handleChange'](2, 'Microsoft')
  await commandMap['Accounts.handleClick'](2, 'add-account')
  assert.deepEqual(AccountsStates.get(1).newState.accounts, [account])
  assert.equal(AccountsStates.get(2).newState.accounts[0].provider, 'Microsoft')
  await commandMap['Accounts.handleClick'](1, 'sign-out:test')
  assert.equal(AccountsStates.get(1).newState.accounts.length, 0)
  assert.equal(AccountsStates.get(2).newState.accounts.length, 1)
  commandMap['Accounts.dispose'](2)
  assert.equal(AccountsStates.get(2), undefined)
  assert.equal(AccountsStates.get(1).newState.accounts.length, 0)
})

void test('concurrent add commands preserve both accounts', async () => {
  commandMap['Accounts.create'](1)
  await Promise.all([commandMap['Accounts.handleClick'](1, 'add-account'), commandMap['Accounts.handleClick'](1, 'add-account')])
  const { accounts } = AccountsStates.get(1).newState
  assert.equal(accounts.length, 2)
  assert.notEqual(accounts[0].id, accounts[1].id)
})

void test('load snapshots caller data and no-op actions do not schedule a render', async () => {
  commandMap['Accounts.create'](1)
  const input = [{ ...account }]
  await commandMap['Accounts.loadContent'](1, input)
  input[0].displayName = 'Changed externally'
  assert.equal(AccountsStates.get(1).newState.accounts[0].displayName, 'Test User')
  await commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  await commandMap['Accounts.handleClick'](1, 'unknown')
  await commandMap['Accounts.handleClick'](1, 'sign-out:missing')
  assert.deepEqual(commandMap['Accounts.diff2'](1), [])
  await assert.rejects(commandMap['Accounts.handleChange'](1, 'Invalid'), UNKNOWN_PROVIDER)
})

void test('virtual DOM is a complete flat tree with named event handlers', async () => {
  commandMap['Accounts.create'](1)
  for (const accounts of [[], [account], [account, { ...account, id: 'second' }]]) {
    await commandMap['Accounts.loadContent'](1, accounts)
    const dom = getAccountsVirtualDom(AccountsStates.get(1).newState)
    let remaining = 1
    for (const node of dom) {
      assert.ok(remaining > 0)
      remaining += (node.childCount || 0) - 1
    }
    assert.equal(remaining, 0)
    assert.ok(dom.some((node) => node.name === 'add-account' && node.onClick === 'handleClick'))
    assert.ok(dom.some((node) => node.name === 'provider' && node.onChange === 'handleChange'))
    if (accounts.length > 0) {
      assert.ok(dom.some((node) => node.ariaLabel === 'Sign out Test User'))
      assert.ok(dom.every((node) => node.className !== 'AccountsEmptyState'))
    }
  }
})

void test('direct events dispatch through registered commands and request rendering', async () => {
  commandMap['Accounts.create'](1)
  const rendered: number[] = []
  const events = AccountsStates.createDirectEventCommandMap(async (uid) => {
    rendered.push(uid)
  })
  await events['Viewlet.executeViewletCommand'](1, 'handleClick', 'add-account')
  assert.equal(AccountsStates.get(1).newState.accounts.length, 1)
  assert.deepEqual(rendered, [1])
  await assert.rejects(events['Viewlet.executeViewletCommand'](1, 'missing'), MISSING_COMMAND)
})
