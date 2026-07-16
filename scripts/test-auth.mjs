/**
 * Quick auth smoke test against a running API.
 * Usage: node scripts/test-auth.mjs [API_BASE]
 * Default API_BASE: http://127.0.0.1:5000/api
 */
const base = (process.argv[2] || 'http://127.0.0.1:5000/api').replace(/\/$/, '')

async function main() {
  const stamp = Date.now()
  const email = `smoke_${stamp}@pahadlink.test`
  const password = 'pass1234'

  const health = await fetch(`${base}/health`)
  const healthBody = await health.json()
  if (!health.ok || !healthBody.ok) {
    throw new Error(`Health failed: ${health.status} ${JSON.stringify(healthBody)}`)
  }
  console.log('OK health', healthBody.database, healthBody.mongo)

  const regRes = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Test', email, password }),
  })
  const regBody = await regRes.json()
  if (regRes.status !== 201 || !regBody.token) {
    throw new Error(`Register failed: ${regRes.status} ${JSON.stringify(regBody)}`)
  }
  console.log('OK register', regBody.user.email)

  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  })
  const loginBody = await loginRes.json()
  if (loginRes.status !== 200 || !loginBody.token) {
    throw new Error(`Login failed: ${loginRes.status} ${JSON.stringify(loginBody)}`)
  }
  console.log('OK login', loginBody.user.username)

  const meRes = await fetch(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
  })
  const meBody = await meRes.json()
  if (meRes.status !== 200 || meBody.user?.email !== email) {
    throw new Error(`Me failed: ${meRes.status} ${JSON.stringify(meBody)}`)
  }
  console.log('OK me', meBody.user.id)
  console.log('AUTH_SMOKE_PASSED')
}

main().catch((err) => {
  console.error('AUTH_SMOKE_FAILED', err.message)
  process.exit(1)
})
