export const name = 'viewlet.accounts-view-open'

export const test = async ({ Command, expect, Locator }) => {
  const accounts = Locator('.Accounts')
  const openAccounts = async () => {
    await Command.execute('Main.openUri', 'accounts:///1')
    await expect(accounts).toBeVisible()
    await expect(accounts.locator('h1')).toHaveText('Accounts')
    await expect(accounts.locator('[role="status"]')).toHaveText('0 accounts connected')
    await expect(accounts.locator('.AccountsEmptyState h2')).toHaveText('No accounts connected')
  }

  await openAccounts()
  await Command.execute('Main.closeActiveEditor')
  await expect(accounts).toHaveCount(0)
  await openAccounts()
}
