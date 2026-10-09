export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  assert(accounts().querySelector('.AccountChildren')?.textContent.includes('OpenRouter'), 'Expected the active login connection to be nested')
  document.querySelector('button[aria-label="Sign out Test User"]').click()
  await waitFor(() => !accounts().textContent.includes('OpenRouter'), 'Signing out left the login connection visible')
  assert(accounts().children.length === 1, 'Expected the fallback login to remain')
  assert(accounts().textContent.includes('Other User'), 'Expected the remaining login to become visible')
  assert(document.querySelector('[role="status"]')?.textContent === '1 account connected', 'Incorrect count after signing out')
}
