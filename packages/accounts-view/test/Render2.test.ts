import { beforeEach, expect, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import * as AccountsStates from '../src/parts/AccountsStates/AccountsStates.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import * as RendererProcess from '../src/parts/RendererProcess/RendererProcess.ts'

beforeEach(() => {
  AccountsStates.clear()
  commandMap['Accounts.create'](1)
})

test('queues a render transaction and retains updates made while queueing', async () => {
  const queued = Promise.withResolvers<number>()
  const rpc = createMockRpc({ commandMap: { 'Viewlet.queueCommands': () => queued.promise } })
  RendererProcess.set(rpc)
  await commandMap['Accounts.loadContent'](1)
  const rendering = commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  await commandMap['Accounts.handleClick'](1, 'add-account')
  queued.resolve(42)
  expect(await rendering).toEqual([['Viewlet.commitPending', 1, 42]])
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(1)
  expect(commandMap['Accounts.diff2'](1)).toHaveLength(1)
  expect(rpc.invocations[0][0]).toBe('Viewlet.queueCommands')
  expect(rpc.invocations[0][2].at(-1)).toEqual(['Viewlet.setUid', 1, 1])
})

test('failed queueing can be retried without losing newer state', async () => {
  const queued = Promise.withResolvers<number>()
  RendererProcess.set(createMockRpc({ commandMap: { 'Viewlet.queueCommands': () => queued.promise } }))
  await commandMap['Accounts.loadContent'](1)
  const rendering = commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  await commandMap['Accounts.handleClick'](1, 'add-account')
  queued.reject(new Error('queue failed'))
  await expect(rendering).rejects.toMatchObject({ message: 'queue failed' })
  expect(AccountsStates.get(1).newState.accounts).toHaveLength(1)
  expect(AccountsStates.get(1).oldState.initialized).toBe(false)
  expect(commandMap['Accounts.diff2'](1)).toHaveLength(1)
})

test('failed queueing does not recreate a disposed view', async () => {
  const queued = Promise.withResolvers<number>()
  RendererProcess.set(createMockRpc({ commandMap: { 'Viewlet.queueCommands': () => queued.promise } }))
  await commandMap['Accounts.loadContent'](1)
  const rendering = commandMap['Accounts.render2'](1, commandMap['Accounts.diff2'](1))
  commandMap['Accounts.dispose'](1)
  queued.reject(new Error('queue failed'))
  await expect(rendering).rejects.toMatchObject({ message: 'queue failed' })
  expect(AccountsStates.get(1)).toBeUndefined()
})

test('unchanged views do not queue renderer work', async () => {
  const rpc = createMockRpc({})
  RendererProcess.set(rpc)
  expect(await commandMap['Accounts.render2'](1, [])).toEqual([])
  expect(rpc.invocations).toHaveLength(0)
})
