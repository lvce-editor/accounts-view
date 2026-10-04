export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  const provider = document.querySelector('select[name="provider"]')
  provider.value = 'Microsoft'
  provider.dispatchEvent(new Event('change', { bubbles: true }))
  document.querySelector('button[name="add-account"]').click()
  await waitFor(() => accounts().children.length === 1, 'Login did not add exactly one account')
  assert(accounts().textContent.includes('Microsoft'), 'Selected provider was not used')
  document.querySelector('button[name="add-account"]').click()
  await waitFor(() => accounts().children.length === 2, 'Repeated login did not add exactly one account')
  assert(document.querySelector('[role="status"]')?.textContent === '2 accounts connected', 'Incorrect count after repeated login')
  document.querySelector('button[aria-label="Sign out New demo account"]').click()
  await waitFor(() => accounts().children.length === 1, 'Sign out did not remove one account')
  assert(document.querySelector('[role="status"]')?.textContent === '1 account connected', 'Incorrect count after sign out')
}
