const testName = document.querySelector('script[data-test]')?.dataset.test
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
  await waitFor(() => document.querySelector('.Accounts button[name="add-account"]'), 'Accounts worker did not render')
  const { test } = await import(`./${testName}.js`)
  await test({ document, assert, waitFor })
  overlay.dataset.state = 'pass'
  overlay.textContent = `${testName}: passed`
} catch (error) {
  overlay.dataset.state = 'fail'
  overlay.textContent = error.stack || String(error)
}
document.body.append(overlay)
