/* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- Playwright fixtures contain mutable Page instances. */
import { expect, test } from '@playwright/test'

test('renders supplied accounts and signs out through the worker', async ({ page }) => {
  await page.goto('/?populated')
  await expect(page.getByRole('heading', { exact: true, name: 'Accounts' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Connected accounts' }).getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('status')).toHaveText('1 account connected')
  await page.getByRole('button', { name: 'Sign out Test User' }).click()
  await expect(page.getByRole('heading', { name: 'No accounts connected' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('0 accounts connected')
})

test('selects a provider and adds independent accounts through direct events', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'No accounts connected' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Provider' }).selectOption('Microsoft')
  await page.getByRole('button', { name: 'Add account' }).click()
  const list = page.getByRole('list', { name: 'Connected accounts' })
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await expect(list).toContainText('Microsoft')
  await page.getByRole('button', { name: 'Add account' }).click()
  await expect(list.getByRole('listitem')).toHaveCount(2)
  await page.getByRole('button', { name: 'Sign out New demo account' }).first().click()
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('status')).toHaveText('1 account connected')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'No accounts connected' })).toBeVisible()
})
