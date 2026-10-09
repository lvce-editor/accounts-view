export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  assert(accounts().children.length === 2, 'Expected two login accounts to render')
  assert(accounts().querySelectorAll('.AccountChildren').length === 1, 'Expected a nested list under the owning login')
  assert(accounts().querySelector('.AccountChildren').children.length === 1, 'Expected one connected integration under the login')
  assert(accounts().textContent.includes('OpenRouter'), 'Connected OpenRouter account was missing')
  assert(document.querySelector('[role="status"]')?.textContent === '3 accounts connected', 'Incorrect connected account count')
  assert(!accounts().querySelector('button[name="use-account:connection:openrouter"]'), 'Integration exposed login switching')
  document.querySelector('button[aria-label="Disconnect OpenRouter"]').click()
  await waitFor(() => accounts().querySelector('.AccountChildren') === null, 'Disconnect did not remove the integration')
  assert(accounts().textContent.includes('Test User'), 'Disconnect removed the LVCE login')
  assert(accounts().textContent.includes('Other User'), 'The unrelated login disappeared')
  assert(document.querySelector('[role="status"]')?.textContent === '2 accounts connected', 'Incorrect count after disconnect')
}
