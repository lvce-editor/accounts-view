export const name = 'viewlet.accounts-view-open'

export const test = async ({ Command, expect, Locator, page }) => {
  const accounts = Locator('.Accounts')
  const main = Locator('.Main')
  const openAccounts = async () => {
    await Command.execute('Main.openUri', 'accounts:///1')
    await expect(accounts).toBeVisible()
    await expect(accounts.locator('h1')).toHaveText('Accounts')
    await expect(accounts.locator('[role="status"]')).toHaveText('0 accounts connected')
    await expect(accounts.locator('.AccountsEmptyState h2')).toHaveText('No accounts connected')
  }
  const expectAccountsToFillMain = async () => {
    const accountsBox = await accounts.boundingBox()
    const mainBox = await main.boundingBox()
    expect(accountsBox).not.toBeNull()
    expect(mainBox).not.toBeNull()
    expect(accountsBox.width).toBeGreaterThan(mainBox.width * 0.9)
  }

  await openAccounts()
  await expectAccountsToFillMain()
  await page.setViewportSize({ width: 800, height: 600 })
  await expectAccountsToFillMain()
  await Command.execute('Main.closeActiveEditor')
  await expect(accounts).toHaveCount(0)
  await openAccounts()
  await expectAccountsToFillMain()
}
