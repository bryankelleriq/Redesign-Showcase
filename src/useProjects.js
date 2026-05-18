import { useCallback, useEffect, useState } from 'react'
import { toEmbedUrl } from './figma.js'
import { RAW_PROJECTS } from './projects.js'

/** Attach computed embed URLs to a raw project list. */
function withEmbeds(rawList) {
  return rawList.map((p) => ({
    ...p,
    embedDesktop: toEmbedUrl(p.protoDesktop, 'desktop'),
    embedMobile: toEmbedUrl(p.protoMobile, 'mobile'),
  }))
}

/** Slugify a title into a stable id, e.g. "Laurel Road Redesign" → "laurel-road-redesign" */
export function toId(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

function basicAuthHeader(user, pass) {
  return `Basic ${btoa(`${user}:${pass}`)}`
}

async function apiFetchProjects() {
  const res = await fetch('/api/projects')
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

async function apiSaveProjects(list, authHeader) {
  const headers = { 'Content-Type': 'application/json' }
  if (authHeader) headers.Authorization = authHeader
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers,
    body: JSON.stringify(list),
  })
  if (res.status === 401) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  if (!res.ok) throw new Error('Failed to save projects')
}

/** Verify credentials against the server. Returns true on success. */
export async function verifyCredentials(user, pass) {
  const res = await fetch('/api/auth/check', {
    headers: { Authorization: basicAuthHeader(user, pass) },
  })
  return res.ok
}

/** Check whether the server requires auth for writes. */
export async function fetchAuthStatus() {
  try {
    const res = await fetch('/api/auth/status')
    if (!res.ok) return { authRequired: false }
    return res.json()
  } catch {
    return { authRequired: false }
  }
}

/**
 * Hook that exposes the project list backed by the server API.
 * Pass an Authorization header value (or null) for writes to be authenticated.
 */
export function useProjects(authHeader = null) {
  const [rawList, setRawList] = useState(RAW_PROJECTS)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    apiFetchProjects()
      .then(setRawList)
      .catch((err) => console.warn('Could not load projects from server, using defaults.', err))
      .finally(() => setLoading(false))
  }, [])

  const update = useCallback(
    async (newList) => {
      setRawList(newList)
      setSaveError(null)
      try {
        await apiSaveProjects(newList, authHeader)
      } catch (err) {
        console.error('Failed to save projects to server:', err)
        setSaveError(err)
      }
    },
    [authHeader],
  )

  const addProject = useCallback(
    (raw) => update([...rawList, raw]),
    [rawList, update],
  )

  const removeProject = useCallback(
    (id) => update(rawList.filter((p) => p.id !== id)),
    [rawList, update],
  )

  const updateProject = useCallback(
    (id, changes) =>
      update(rawList.map((p) => (p.id === id ? { ...p, ...changes } : p))),
    [rawList, update],
  )

  const moveProject = useCallback(
    (id, direction) => {
      const idx = rawList.findIndex((p) => p.id === id)
      if (idx === -1) return
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= rawList.length) return
      const newList = [...rawList]
      ;[newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]]
      update(newList)
    },
    [rawList, update],
  )

  const resetProjects = useCallback(
    () => update(RAW_PROJECTS),
    [update],
  )

  return {
    projects: withEmbeds(rawList),
    rawList,
    loading,
    saveError,
    addProject,
    updateProject,
    moveProject,
    removeProject,
    resetProjects,
  }
}

/** Build a Basic Auth header value from a username/password pair. */
export { basicAuthHeader }
