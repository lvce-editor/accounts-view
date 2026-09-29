import { createAccountState, updateAccounts, type AccountAction, type AccountResponse } from './accountState.ts'

const workerScope = globalThis as DedicatedWorkerGlobalScope
const empty = new URL(workerScope.location.href).searchParams.get('empty') === '1'
const accountData = { accounts: createAccountState(empty) }

// This dedicated worker only accepts messages from its owning page.
// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Worker message listeners use the platform's MessageEvent type.
workerScope.addEventListener('message', (event: MessageEvent<AccountAction>) => {
  accountData.accounts = updateAccounts(accountData.accounts, event.data)
  const response: AccountResponse = { accounts: accountData.accounts, type: 'accounts' }
  workerScope.postMessage(response)
})
