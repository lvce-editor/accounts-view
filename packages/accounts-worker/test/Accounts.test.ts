import assert from 'node:assert/strict'
import test from 'node:test'
import { commandMap } from '../src/CommandMap.ts'

void test('account view state is isolated per uid and disposed independently', () => {
  const first = commandMap['Accounts.create'](1, false)
  const second = commandMap['Accounts.create'](2, true)
  assert.equal(first.count, 2)
  assert.equal(second.count, 0)

  const loggedIn = commandMap['Accounts.login'](2, 'Google')
  assert.equal(loggedIn.count, 1)
  assert.equal(commandMap['Accounts.getAccounts'](1).count, 2)

  const loggedOut = commandMap['Accounts.logout'](1, 'github-ava')
  assert.equal(loggedOut.count, 1)
  assert.equal(commandMap['Accounts.getAccounts'](2).count, 1)

  commandMap['Accounts.dispose'](2)
  assert.equal(commandMap['Accounts.getAccounts'](1).count, 1)
})

void test('worker renders account list and empty state as virtual DOM', () => {
  const empty = commandMap['Accounts.create'](3, true)
  assert.ok(empty.dom.some((node) => node.id === 'account-list'))
  assert.ok(empty.dom.some((node) => node.id === 'empty-state'))

  const initial = commandMap['Accounts.create'](4, false)
  assert.ok(initial.dom.some((node) => node.ariaLabel === 'Connected accounts'))
  assert.ok(initial.dom.some((node) => node.ariaLabel === 'Sign out Ava Chen'))
})
