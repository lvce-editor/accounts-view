export const test = async ({ document, assert, waitFor }) => {
  const accounts = () => document.querySelector('ul[aria-label="Connected accounts"]')
  assert(accounts().children.length === 0, 'Unexpected accounts were shown after the initial load failed')
  assert(
    document.querySelector('[role="status"]')?.textContent === 'Unable to load accounts: Failed to fetch',
    'Account loading failure was not reported in the status area',
  )
  assert(!document.querySelector('.AccountsEmptyState'), 'Account loading failure was shown as a successful empty state')
  assert(document.querySelector('button[name="add-account"]'), 'Account actions were unavailable after loading failed')

  document.querySelector('button[name="add-account"]').click()
  await waitFor(() => accounts().children.length === 2, 'Accounts did not recover after a successful load')
  assert(document.querySelector('[role="status"]')?.textContent === '2 accounts connected', 'Stale loading error remained after recovery')
}
