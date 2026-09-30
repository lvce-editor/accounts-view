export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  const empty = () => document.querySelector('.empty-state h2')
  assert(empty()?.textContent === 'No accounts connected', 'Empty state heading missing')
  assert(empty().getBoundingClientRect().height > 0, 'Empty state must be visible')
  assert(accounts().children.length === 0, 'Empty mode has accounts')
  document.querySelector('#provider').value = 'Microsoft'
  document.querySelector('#login-button').click()
  await waitFor(() => accounts().children.length === 1, 'Login from empty state failed')
  assert(!empty(), 'Empty state remained after login')
  assert(accounts().textContent.includes('Microsoft'), 'Selected provider was not used')
  document.querySelector('button[aria-label="Sign out New demo account"]').click()
  await waitFor(() => accounts().children.length === 0, 'Sign out did not return to empty state')
  assert(empty()?.textContent === 'No accounts connected', 'Empty state did not return')
  assert(document.querySelector('#status').textContent === '0 accounts connected', 'Incorrect empty count')
}
