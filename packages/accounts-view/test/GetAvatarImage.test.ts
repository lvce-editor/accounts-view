import { expect, jest, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import * as CacheWorker from '../src/parts/CacheWorker/CacheWorker.ts'
import * as GetAvatarImage from '../src/parts/GetAvatarImage/GetAvatarImage.ts'

test('downloads and caches image bytes with their content type', async () => {
  const body = Uint8Array.from([1, 2, 3]).buffer
  const rpc = createMockRpc({
    commandMap: {
      'Cache.getCacheStorageItem': () => null,
      'Cache.setCacheStorageItem': () => ({ success: true }),
    },
  })
  CacheWorker.set(rpc)
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { headers: { 'content-type': 'image/png' } }))
  try {
    await expect(GetAvatarImage.getAvatarImage('https://avatars.githubusercontent.com/u/1')).resolves.toEqual({ body, contentType: 'image/png' })
    expect(rpc.invocations).toEqual([
      ['Cache.getCacheStorageItem', 'https://avatars.githubusercontent.com/u/1', 'accounts-view-avatars'],
      ['Cache.setCacheStorageItem', 'https://avatars.githubusercontent.com/u/1', body, 'accounts-view-avatars', { 'content-type': 'image/png' }],
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  } finally {
    fetchMock.mockRestore()
  }
})

test('uses cached bytes without downloading again', async () => {
  const body = Uint8Array.from([4, 5, 6]).buffer
  CacheWorker.set(createMockRpc({ commandMap: { 'Cache.getCacheStorageItem': () => ({ body, headers: { 'content-type': 'image/webp' } }) } }))
  const fetchMock = jest.spyOn(globalThis, 'fetch')
  try {
    await expect(GetAvatarImage.getAvatarImage('https://avatars.githubusercontent.com/u/2')).resolves.toEqual({ body, contentType: 'image/webp' })
    expect(fetchMock).not.toHaveBeenCalled()
  } finally {
    fetchMock.mockRestore()
  }
})

test('cache read failures fall back to an image download', async () => {
  const body = Uint8Array.from([7, 8, 9]).buffer
  CacheWorker.set(
    createMockRpc({
      commandMap: {
        'Cache.getCacheStorageItem': () => Promise.reject(new Error('cache unavailable')),
        'Cache.setCacheStorageItem': () => Promise.reject(new Error('cache unavailable')),
      },
    }),
  )
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { headers: { 'content-type': 'image/jpeg' } }))
  try {
    await expect(GetAvatarImage.getAvatarImage('https://avatars.githubusercontent.com/u/3')).resolves.toEqual({ body, contentType: 'image/jpeg' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  } finally {
    fetchMock.mockRestore()
  }
})
