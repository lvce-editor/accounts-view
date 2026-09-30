# Standalone browser tests

Run `npm run e2e` from the repository root. This builds the static application and
runs the scenarios with `@lvce-editor/test-with-playwright`.

The configured `static-server.js` adapter serves the built application and one
HTML entry point per scenario. Each entry point loads the application in a fresh
iframe, including its real accounts worker. `test-harness.js` executes the
scenario's DOM assertions, then reports success or the thrown error using the
runner's `#TestOverlay` browser result protocol. The runner owns browser launch,
test discovery, timeouts, reporting, exit status, and server teardown. No LVCE
Editor shell or editor-specific test API is needed for this standalone page.

Scenario files belong in `src/` and must be added to the server's test allowlist.
The harness stays outside `src/` so it is not discovered as a scenario. The
server also supports `--dev`, as used by `npm run dev`.
