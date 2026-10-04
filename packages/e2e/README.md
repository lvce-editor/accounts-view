# Accounts worker browser tests

Run `npm run build` followed by `npm run e2e` from the repository root. The shared runner starts the browser and test server, then runs each scenario in a fresh page. Tests launch the built accounts worker, connect its RPC transports, and render its virtual DOM with the shared renderer. The fixture exercises direct message-port events and queued render transactions; no browser application assets are shipped in the accounts package.
