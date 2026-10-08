export const isGithubAvatarUrl = (provider: string, avatarUrl: string | undefined): avatarUrl is string => {
  if (provider.toLowerCase() !== 'github' || !avatarUrl) {
    return false
  }
  if (!URL.canParse(avatarUrl)) {
    return false
  }
  const url = new URL(avatarUrl)
  return url.protocol === 'https:' && url.hostname === 'avatars.githubusercontent.com'
}
