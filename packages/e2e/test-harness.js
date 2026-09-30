// The runner opens each /tests/*.html page and reads its #TestOverlay result.
// Keep the application in a fresh iframe so each scenario gets a new worker.
const frame = document.querySelector('iframe')
const testName = document.querySelector('script[data-test]').dataset.test
const overlay = document.createElement('pre')
overlay.id = 'TestOverlay'

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const waitFor = async (predicate, message) => {
  const deadline = performance.now() + 5000
  while (!predicate()) {
    assert(performance.now() < deadline, message)
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

try {
  await waitFor(() => frame.contentDocument?.querySelector('#account-list'), 'Account list did not render')
  const { test } = await import(`./${testName}.js`)
  await test({ document: frame.contentDocument, assert, waitFor })
  overlay.dataset.state = 'pass'
  overlay.textContent = `${testName}: passed`
} catch (error) {
  overlay.dataset.state = 'fail'
  overlay.textContent = error.stack || String(error)
}
document.body.append(overlay)
