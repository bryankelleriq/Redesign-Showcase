import express from 'express'
import { timingSafeEqual } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, 'data', 'projects.json')
const DIST_DIR = join(__dirname, 'dist')
const PORT = process.env.PORT || 3001

// Basic Auth credentials for write access to /api/projects.
// Set both via env vars in production. If unset, writes are open (dev convenience).
const MANAGE_USER = process.env.MANAGE_USER || ''
const MANAGE_PASS = process.env.MANAGE_PASS || ''
const AUTH_ENABLED = Boolean(MANAGE_USER && MANAGE_PASS)

if (Boolean(MANAGE_USER) !== Boolean(MANAGE_PASS)) {
  console.error('Configuration error: MANAGE_USER and MANAGE_PASS must both be set, or both unset.')
  process.exit(1)
}

/** Constant-time string compare to avoid timing attacks on the password. */
function safeEqual(a, b) {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

/**
 * Express middleware: requires HTTP Basic Auth when MANAGE_USER/PASS are configured.
 *
 * Returns 401 without `WWW-Authenticate` to avoid triggering the browser's native
 * Basic Auth prompt — the React app handles login via its own form. This also
 * prevents the browser from caching credentials, which neutralizes the classic
 * CSRF risk of Basic Auth (no auto-sent credentials → no CSRF).
 */
function requireAuth(req, res, next) {
  if (!AUTH_ENABLED) return next()

  const header = req.headers.authorization || ''
  const [scheme, encoded] = header.split(' ')

  if (scheme !== 'Basic' || !encoded) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8')
  const sep = decoded.indexOf(':')
  const user = sep >= 0 ? decoded.slice(0, sep) : decoded
  const pass = sep >= 0 ? decoded.slice(sep + 1) : ''

  if (!safeEqual(user, MANAGE_USER) || !safeEqual(pass, MANAGE_PASS)) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  next()
}

function readProjects() {
  if (!existsSync(DATA_FILE)) {
    // Seed from the checked-in defaults if the file was never created
    const seed = join(__dirname, 'data', 'projects.seed.json')
    const initial = existsSync(seed)
      ? readFileSync(seed, 'utf8')
      : '[]'
    mkdirSync(dirname(DATA_FILE), { recursive: true })
    writeFileSync(DATA_FILE, initial)
    return JSON.parse(initial)
  }
  return JSON.parse(readFileSync(DATA_FILE, 'utf8'))
}

const app = express()
app.use(express.json())

app.get('/api/auth/status', (_req, res) => {
  res.json({ authRequired: AUTH_ENABLED })
})

app.get('/api/auth/check', requireAuth, (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/projects', (_req, res) => {
  try {
    res.json(readProjects())
  } catch (err) {
    console.error('Failed to read projects:', err)
    res.status(500).json({ error: 'Failed to read projects' })
  }
})

app.post('/api/projects', requireAuth, (req, res) => {
  try {
    const list = req.body
    if (!Array.isArray(list)) return res.status(400).json({ error: 'Expected an array' })
    mkdirSync(dirname(DATA_FILE), { recursive: true })
    writeFileSync(DATA_FILE, JSON.stringify(list, null, 2))
    res.json({ ok: true })
  } catch (err) {
    console.error('Failed to save projects:', err)
    res.status(500).json({ error: 'Failed to save projects' })
  }
})

// In production: serve the built React app and handle SPA routing
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('/{*splat}', (_req, res) => res.sendFile(join(DIST_DIR, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  if (AUTH_ENABLED) {
    console.log(`Auth: enabled (Basic Auth required for POST /api/projects)`)
  } else {
    console.warn('Auth: DISABLED — anyone with network access can edit projects.')
    console.warn('  Set MANAGE_USER and MANAGE_PASS env vars to require authentication.')
  }
  if (!existsSync(DIST_DIR)) {
    console.log('(No dist/ found — run `npm run build` to enable static file serving)')
  }
})
