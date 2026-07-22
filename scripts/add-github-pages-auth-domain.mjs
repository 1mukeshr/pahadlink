/**
 * Add GitHub Pages host to Firebase Auth authorized domains.
 *
 * Prerequisites:
 *   npx firebase-tools login
 *   (must be an owner/editor on pahadlink-56803)
 *
 * Usage:
 *   node scripts/add-github-pages-auth-domain.mjs
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PROJECT_ID = 'pahadlink-56803'
const DOMAIN = '1mukeshr.github.io'

function readFirebaseToken() {
  const path = join(homedir(), '.config', 'configstore', 'firebase-tools.json')
  if (!existsSync(path)) {
    throw new Error('Not logged in. Run: npx firebase-tools login')
  }
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  const token =
    raw?.tokens?.access_token ||
    raw?.tokens?.refresh_token ||
    raw?.token ||
    ''
  if (!token) {
    throw new Error('Firebase login token missing. Run: npx firebase-tools login')
  }
  return { accessToken: raw?.tokens?.access_token, refreshToken: raw?.tokens?.refresh_token, raw }
}

async function main() {
  // Use Identity Toolkit admin API with Application Default / gcloud if present
  let token = process.env.FIREBASE_TOKEN || process.env.GOOGLE_ACCESS_TOKEN || ''
  if (!token) {
    try {
      token = execFileSync('gcloud', ['auth', 'print-access-token'], {
        encoding: 'utf8',
        timeout: 15000,
      }).trim()
    } catch {
      token = ''
    }
  }

  if (!token) {
    try {
      const cfg = readFirebaseToken()
      token = cfg.accessToken || cfg.refreshToken || ''
    } catch {
      token = ''
    }
  }

  if (!token) {
    console.error(`
Cannot update Firebase authorized domains from this machine (not logged in).

Do this once in the browser (required for Google login on GitHub Pages):

1. Open:
   https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings

2. Under Authorized domains → Add domain
3. Enter: ${DOMAIN}
4. Save

Also confirm Authentication → Sign-in method → Google is Enabled.
`)
    process.exit(1)
  }

  const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`
  const getRes = await fetch(base, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const current = await getRes.json()
  if (!getRes.ok) {
    throw new Error(`GET config failed: ${JSON.stringify(current)}`)
  }

  const domains = Array.isArray(current.authorizedDomains)
    ? [...current.authorizedDomains]
    : []
  if (domains.includes(DOMAIN)) {
    console.log(`Already authorized: ${DOMAIN}`)
    console.log(domains.join(', '))
    return
  }
  domains.push(DOMAIN)

  const patchRes = await fetch(`${base}?updateMask=authorizedDomains`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizedDomains: domains }),
  })
  const patched = await patchRes.json()
  if (!patchRes.ok) {
    throw new Error(`PATCH config failed: ${JSON.stringify(patched)}`)
  }

  console.log('Updated authorized domains:')
  console.log((patched.authorizedDomains || domains).join(', '))
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
