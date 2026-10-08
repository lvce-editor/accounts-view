import * as CacheWorker from '../CacheWorker/CacheWorker.ts'

const cacheName = 'accounts-view-avatars'

export interface AvatarImage {
  readonly body: ArrayBuffer
  readonly contentType: string
}

export const getAvatarImage = async (avatarUrl: string): Promise<AvatarImage> => {
  try {
    const cached = await CacheWorker.invoke('Cache.getCacheStorageItem', avatarUrl, cacheName)
    if (cached?.body instanceof ArrayBuffer) {
      return {
        body: cached.body,
        contentType: cached.headers?.['content-type'] || 'application/octet-stream',
      }
    }
  } catch {
    // Fetch the avatar even when reading persistent cache fails.
  }
  const response = await fetch(avatarUrl)
  if (!response.ok) {
    throw new Error(`Avatar request failed with status ${response.status}`)
  }
  const body = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  try {
    await CacheWorker.invoke('Cache.setCacheStorageItem', avatarUrl, body, cacheName, { 'content-type': contentType })
  } catch {
    // The image is still usable when persistent caching is unavailable.
  }
  return { body, contentType }
}
