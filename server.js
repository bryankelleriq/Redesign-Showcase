import express from 'express'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, 'data', 'projects.json')
const DIST_DIR = join(__dirname, 'dist')
const PORT = process.env.PORT || 3001

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

app.get('/api/projects', (_req, res) => {
  try {
    res.json(readProjects())
  } catch (err) {
    console.error('Failed to read projects:', err)
    res.status(500).json({ error: 'Failed to read projects' })
  }
})

app.post('/api/projects', (req, res) => {
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
  if (!existsSync(DIST_DIR)) {
    console.log('(No dist/ found — run `npm run build` to enable static file serving)')
  }
})
