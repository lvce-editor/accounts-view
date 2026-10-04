import { createMockRpc } from '@lvce-editor/rpc'
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import * as AccountsStates from '../src/parts/AccountsStates/AccountsStates.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import * as RendererProcess from '../src/parts/RendererProcess/RendererProcess.ts'

beforeEach(() => {
  AccountsStates.clear()
  commandMap['Accounts.create'](1)
})

void test('queues a render transaction and retains updates made while queueing', async () => {
  const queued = Promise.withResolvers<number>()
  const rpc = createMockRpc({ commandMap: { 'Viewlet.queueCommands': () => queued.promise } })
  RendererProcess.set(rpc)
  await commandMap['Accounts.loadContent'](1)
  const rendering = commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  await commandMap['Accounts.handleClick'](1, 'add-account')
  queued.resolve(42)
  assert.deepEqual(await rendering, [['Viewlet.commitPending', 1, 42]])
  assert.equal(AccountsStates.get(1).newState.accounts.length, 1)
  assert.equal(commandMap['Accounts.diff2'](1).length, 1)
  assert.equal(rpc.invocations[0][0], 'Viewlet.queueCommands')
  assert.deepEqual(rpc.invocations[0][2].at(-1), ['Viewlet.setUid', 1, 1])
})

void test('failed queueing can be retried without losing newer state', async () => {
  const queued = Promise.withResolvers<number>()
  RendererProcess.set(createMockRpc({ commandMap: { 'Viewlet.queueCommands': () => queued.promise } }))
  await commandMap['Accounts.loadContent'](1)
  const rendering = commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  await commandMap['Accounts.handleClick'](1, 'add-account')
  queued.reject(new Error('queue failed'))
  await assert.rejects(rendering, { message: 'queue failed' })
  assert.equal(AccountsStates.get(1).newState.accounts.length, 1)
  assert.equal(AccountsStates.get(1).oldState.initialized, false)
  assert.equal(commandMap['Accounts.diff2'](1).length, 1)
})

void test('failed queueing does not recreate a disposed view', async () => {
  const queued = Promise.withResolvers<number>()
  RendererProcess.set(createMockRpc({ commandMap: { 'Viewlet.queueCommands': () => queued.promise } }))
  await commandMap['Accounts.loadContent'](1)
  const rendering = commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  commandMap['Accounts.dispose'](1)
  queued.reject(new Error('queue failed'))
  await assert.rejects(rendering, { message: 'queue failed' })
  assert.equal(AccountsStates.get(1), undefined)
})

void test('unchanged views do not queue renderer work', async () => {
  const rpc = createMockRpc({})
  RendererProcess.set(rpc)
  assert.deepEqual(await commandMap['Accounts.render2'](1, []), [])
  assert.equal(rpc.invocations.length, 0)
})
