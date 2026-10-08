export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  assert(accounts().children.length === 2, 'Expected the login and connected integration to render')
  assert(accounts().textContent.includes('OpenRouter'), 'Connected OpenRouter account was missing')
  assert(document.querySelector('[role="status"]')?.textContent === '2 accounts connected', 'Incorrect connected account count')
  assert(!accounts().querySelector('button[name="use-account:connection:openrouter"]'), 'Integration exposed login switching')
  document.querySelector('button[aria-label="Disconnect OpenRouter"]').click()
  await waitFor(() => accounts().children.length === 1, 'Disconnect did not remove the integration')
  assert(accounts().textContent.includes('Test User'), 'Disconnect removed the LVCE login')
  assert(document.querySelector('[role="status"]')?.textContent === '1 account connected', 'Incorrect count after disconnect')
}
