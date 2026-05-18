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

async function apiFetch() {
  const res = await fetch('/api/projects')
  if (!res.ok) throw new Error('Failed to fetch projects')
  return res.json()
}

async function apiSave(list) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(list),
  })
  if (!res.ok) throw new Error('Failed to save projects')
}

/**
 * Hook that exposes the project list backed by the server API.
 * Falls back to the hardcoded RAW_PROJECTS if the API is unreachable.
 */
export function useProjects() {
  // Start with defaults so the UI renders immediately on first paint
  const [rawList, setRawList] = useState(RAW_PROJECTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch()
      .then(setRawList)
      .catch((err) => console.warn('Could not load projects from server, using defaults.', err))
      .finally(() => setLoading(false))
  }, [])

  const update = useCallback(async (newList) => {
    setRawList(newList)
    try {
      await apiSave(newList)
    } catch (err) {
      console.error('Failed to save projects to server:', err)
    }
  }, [])

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

  const resetProjects = useCallback(
    () => update(RAW_PROJECTS),
    [update],
  )

  return {
    projects: withEmbeds(rawList),
    rawList,
    loading,
    addProject,
    updateProject,
    removeProject,
    resetProjects,
  }
}
