import { expect, test } from '@jest/globals'
import * as IsGithubAvatarUrl from '../src/parts/IsGithubAvatarUrl/IsGithubAvatarUrl.ts'

test('accepts HTTPS GitHub avatars and keeps other providers on initials', () => {
  expect(IsGithubAvatarUrl.isGithubAvatarUrl('GitHub', 'https://avatars.githubusercontent.com/u/1')).toBe(true)
  expect(IsGithubAvatarUrl.isGithubAvatarUrl('Microsoft', 'https://avatars.githubusercontent.com/u/1')).toBe(false)
  // eslint-disable-next-line unicorn/prefer-https -- Verify that insecure avatar URLs are rejected.
  expect(IsGithubAvatarUrl.isGithubAvatarUrl('GitHub', 'http://avatars.githubusercontent.com/u/1')).toBe(false)
  expect(IsGithubAvatarUrl.isGithubAvatarUrl('GitHub', 'https://example.com/avatar.png')).toBe(false)
})
