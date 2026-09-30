# Accounts View

An LVCE Editor account-view prototype. It demonstrates a worker-backed account list with mock sign-in and sign-out actions; it does not connect to an identity provider or store credentials.

## Development

- `npm ci` installs the workspace dependencies.
- `npm run dev` builds and watches the view and worker, then serves the demo at <http://127.0.0.1:4173/accounts-view/>. Press Ctrl+C to stop.
- `npm run build` builds the accounts worker.
- `npm run build:static` exports the demo to `.tmp/static`.
- `npm run e2e` runs the mock account scenarios in Chromium.

The GitHub Pages demo is published from the `main` branch. Sign-in and sign-out only change in-memory mock state.
