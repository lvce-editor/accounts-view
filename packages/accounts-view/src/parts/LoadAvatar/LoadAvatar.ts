import { RendererWorker } from '@lvce-editor/rpc-registry'
import type { Account } from '../Account/Account.ts'
import * as AccountsStates from '../AccountsStates/AccountsStates.ts'
import * as GetAvatarImage from '../GetAvatarImage/GetAvatarImage.ts'
import * as IsGithubAvatarUrl from '../IsGithubAvatarUrl/IsGithubAvatarUrl.ts'

const pendingImages = new Map<string, Promise<GetAvatarImage.AvatarImage>>()

const getImage = async (avatarUrl: string): Promise<GetAvatarImage.AvatarImage> => {
  let pending = pendingImages.get(avatarUrl)
  if (!pending) {
    pending = GetAvatarImage.getAvatarImage(avatarUrl)
    pendingImages.set(avatarUrl, pending)
  }
  try {
    return await pending
  } finally {
    if (pendingImages.get(avatarUrl) === pending) {
      pendingImages.delete(avatarUrl)
    }
  }
}

export const loadAvatar = async (uid: number, account: Account): Promise<void> => {
  const { avatarUrl, id, provider } = account
  if (!IsGithubAvatarUrl.isGithubAvatarUrl(provider, avatarUrl) || account.avatarSrc) {
    return
  }
  let image: GetAvatarImage.AvatarImage
  try {
    image = await getImage(avatarUrl)
  } catch {
    return
  }
  const current = AccountsStates.get(uid)?.newState
  if (!current) {
    return
  }
  const currentAccount = current.accounts.find((item) => item.id === id)
  if (!currentAccount || currentAccount.provider !== provider || currentAccount.avatarUrl !== avatarUrl || currentAccount.avatarSrc) {
    return
  }
  let avatarSrc: string
  try {
    avatarSrc = URL.createObjectURL(new Blob([image.body], { type: image.contentType }))
  } catch {
    return
  }
  const accounts = current.accounts.map((item) => (item.id === id ? { ...item, avatarSrc } : item))
  const nextState = { ...current, accounts }
  AccountsStates.set(uid, current, nextState)
  try {
    await RendererWorker.invoke('Viewlet.requestRender', uid)
  } catch {
    URL.revokeObjectURL(avatarSrc)
    const latest = AccountsStates.get(uid)?.newState
    if (latest) {
      const revertedAccounts = latest.accounts.map((item) => {
        if (item.id !== id || item.avatarSrc !== avatarSrc) {
          return item
        }
        const { avatarSrc: _avatarSrc, ...accountWithoutAvatarSrc } = item
        return accountWithoutAvatarSrc
      })
      AccountsStates.set(uid, latest, { ...latest, accounts: revertedAccounts })
    }
  }
}
