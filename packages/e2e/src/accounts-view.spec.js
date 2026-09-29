import { expect, test } from '@playwright/test'

test('lists mock accounts and signs out only the selected account', async ({ page }) => {
  await page.goto('/accounts-view/')
  const accounts = page.getByRole('list', { name: 'Connected accounts' })
  await expect(accounts.getByRole('listitem')).toHaveCount(2)
  await expect(accounts.getByText('Ava Chen')).toBeVisible()
  await expect(accounts.getByText('Sam Rivera')).toBeVisible()

  await page.getByRole('button', { name: 'Sign out Ava Chen' }).click()

  await expect(accounts.getByRole('listitem')).toHaveCount(1)
  await expect(accounts.getByText('Ava Chen')).toHaveCount(0)
  await expect(accounts.getByText('Sam Rivera')).toBeVisible()
})

test('adds a mock account without replacing connected accounts', async ({ page }) => {
  await page.goto('/accounts-view/')
  const accounts = page.getByRole('list', { name: 'Connected accounts' })
  await page.getByLabel('Account provider').selectOption('Google')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(accounts.getByRole('listitem')).toHaveCount(3)
  await expect(accounts.getByText('Ava Chen')).toBeVisible()
  await expect(accounts.getByText('Sam Rivera')).toBeVisible()
  await expect(accounts.getByText('new.account@example.com')).toBeVisible()
})

test('shows the empty state and allows a mock account to be added', async ({ page }) => {
  await page.goto('/accounts-view/?empty=1')
  await expect(page.getByRole('heading', { name: 'No accounts connected' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Connected accounts' }).getByRole('listitem')).toHaveCount(0)

  await page.getByLabel('Account provider').selectOption('Microsoft')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'No accounts connected' })).toBeHidden()
  await expect(page.getByRole('list', { name: 'Connected accounts' }).getByRole('listitem')).toHaveCount(1)
})
