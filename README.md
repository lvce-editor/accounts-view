# Accounts View

Accounts view worker for LVCE Editor. One package, `packages/accounts-view`, owns account state, commands, event listeners, and virtual DOM rendering. Its entry point is `src/accountsWorkerMain.ts`; TypeScript modules follow the `src/parts/Name/Name.ts` layout used by explorer-view and about-view.

The host connects using `WebWorkerRpcClient` / `WebWorkerRpcParent` and the `Accounts.*` commands. Create a view with `Accounts.create(uid)`, supply account data with `Accounts.loadContent(uid, accounts)`, then use `Accounts.diff2` and `Accounts.render2`. `Accounts.handleMessagePort` connects a renderer process for direct DOM events and queued render transactions. `Accounts.dispose` removes the view state.

Account actions still use in-memory demo data. Adding an account does not authenticate with a provider; signing out removes a demo account. New views start empty. Real provider authentication and editor navigation are separate integration work.

- `npm ci` installs workspace dependencies.
- `npm run build` bundles the worker and creates the npm package in `.tmp/dist`.
- `npm run dev` watches the worker and starts the standard LVCE development server.
- `npm run build:static` exports the standard LVCE host and worker for GitHub Pages.
- `npm test` tests view state, lifecycle, and rendering.
- `npm run e2e` tests the bundled worker in Chromium using RPC and the shared virtual DOM renderer. Browser fixtures belong to the tests, not the published worker package.
