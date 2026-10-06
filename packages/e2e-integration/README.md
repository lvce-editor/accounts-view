# LVCE application integration coverage

This scenario runs from the LVCE application's Playwright harness. Stage it into a disposable LVCE checkout with `node stage-accounts-view-test.mjs <lvce-editor-checkout>`, then run the `viewlet.accounts-view-open` e2e scenario. The test opens, closes and reopens the Accounts worker view and checks the rendered application DOM.
