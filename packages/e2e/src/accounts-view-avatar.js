export const test = async ({ document, assert, waitFor }) => {
  const avatar = () => document.querySelector('.AccountCard .AccountAvatar[src]')
  await waitFor(() => avatar()?.complete && avatar().naturalWidth === 1, 'Cached GitHub avatar did not render')
  assert(avatar().getAttribute('src').startsWith('blob:'), 'Avatar did not render from cached image bytes')
  assert(!document.querySelector('.AccountCard .AccountAvatar')?.textContent.includes('TU'), 'Initials remained beside the loaded avatar')
}
