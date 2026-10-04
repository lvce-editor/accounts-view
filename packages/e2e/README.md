# Accounts worker browser tests

Run `npm run build` and `npm run e2e` from the repository root. Tests launch the built module worker, connect the standard RPC transports, and render worker virtual DOM with the shared renderer. The test-only fixture exercises direct message-port events and queued render transactions. No browser application assets are shipped in the accounts package.
