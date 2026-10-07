export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  const emptyState = () => document.querySelector('.AccountsEmptyState h2')
  assert(emptyState()?.textContent === 'No accounts connected', 'Empty state heading missing')
  assert(document.querySelector('button[name="add-account"]').textContent === 'Add Another Account', 'Missing additional login control')
  document.querySelector('button[name="add-account"]').click()
  await waitFor(() => accounts().children.length === 1, 'Login from empty state failed')
  assert(!emptyState(), 'Empty state remained after login')
  assert(document.querySelector('button[name="use-account:account-1"]').disabled, 'Initial account was not active')
  document.querySelector('button[name="sign-out:account-1"]').click()
  await waitFor(() => accounts().children.length === 0, 'Sign out did not return to empty state')
  assert(emptyState()?.textContent === 'No accounts connected', 'Empty state did not return')
  assert(document.querySelector('[role="status"]')?.textContent === '0 accounts connected', 'Incorrect empty count')
}
