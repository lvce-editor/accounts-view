export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  const label = document.querySelector('label[for="provider"]')
  assert(label.textContent.trim() === 'Account provider', 'Provider accessible label changed')
  document.querySelector('#provider').value = 'Google'
  document.querySelector('#login-button').click()
  await waitFor(() => accounts().children.length === 3, 'Login did not add exactly one account')
  assert(accounts().textContent.includes('Ava Chen'), 'Ava missing after login')
  assert(accounts().textContent.includes('Sam Rivera'), 'Sam missing after login')
  assert(accounts().textContent.includes('new.account@example.com'), 'New account missing')
  assert(accounts().lastElementChild.textContent.includes('Google'), 'Selected provider was not used')
  assert(document.querySelector('#status').textContent === '3 accounts connected', 'Incorrect count after login')
  document.querySelector('button[aria-label="Sign out New demo account"]').click()
  await waitFor(() => accounts().children.length === 2, 'Sign out after rerender failed')
  document.querySelector('#login-button').click()
  await waitFor(() => accounts().children.length === 3, 'Repeated login did not add exactly one account')
}
