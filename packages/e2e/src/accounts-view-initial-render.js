export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  assert(accounts().children.length === 1, 'Expected the supplied account to render')
  assert(accounts().textContent.includes('Test User'), 'Supplied account was missing')
  assert(accounts().textContent.includes('test@example.com'), 'Supplied account email was missing')
  assert(document.querySelector('[role="status"]')?.textContent === '1 account connected', 'Incorrect initial count')
  document.querySelector('button[aria-label="Sign out Test User"]').click()
  await waitFor(() => accounts().children.length === 0, 'Sign out did not remove the supplied account')
  assert(document.querySelector('.AccountsEmptyState h2')?.textContent === 'No accounts connected', 'Sign out did not show the empty state')
  assert(document.querySelector('[role="status"]')?.textContent === '0 accounts connected', 'Incorrect count after sign out')
}
