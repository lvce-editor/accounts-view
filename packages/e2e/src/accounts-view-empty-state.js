export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  const emptyState = () => document.querySelector('.AccountsEmptyState h2')
  assert(emptyState()?.textContent === 'No accounts connected', 'Empty state heading missing')
  const provider = document.querySelector('select[name="provider"]')
  provider.value = 'Microsoft'
  provider.dispatchEvent(new Event('change', { bubbles: true }))
  document.querySelector('button[name="add-account"]').click()
  await waitFor(() => accounts().children.length === 1, 'Login from empty state failed')
  assert(!emptyState(), 'Empty state remained after login')
  assert(accounts().textContent.includes('Microsoft'), 'Selected provider was not used')
  document.querySelector('button[aria-label="Sign out New demo account"]').click()
  await waitFor(() => accounts().children.length === 0, 'Sign out did not return to empty state')
  assert(emptyState()?.textContent === 'No accounts connected', 'Empty state did not return')
  assert(document.querySelector('[role="status"]')?.textContent === '0 accounts connected', 'Incorrect empty count')
}
