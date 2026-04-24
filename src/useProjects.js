import { useCallback, useState } from 'react'
import { toEmbedUrl } from './figma.js'
import { RAW_PROJECTS } from './projects.js'

const STORAGE_KEY = 'iq-showcase-projects'

/** Attach computed embed URLs to a raw project list. */
function withEmbeds(rawList) {
  return rawList.map((p) => ({
    ...p,
    embedDesktop: toEmbedUrl(p.protoDesktop, 'desktop'),
    embedMobile: toEmbedUrl(p.protoMobile, 'mobile'),
  }))
}

function loadRaw() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return RAW_PROJECTS
}

function persist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
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

/**
 * Hook that exposes the project list backed by localStorage.
 * Falls back to the hardcoded RAW_PROJECTS when localStorage is empty.
 */
export function useProjects() {
  const [rawList, setRawList] = useState(loadRaw)

  const update = useCallback((newList) => {
    persist(newList)
    setRawList(newList)
  }, [])

  const addProject = useCallback(
    (raw) => update([...rawList, raw]),
    [rawList, update],
  )

  const removeProject = useCallback(
    (id) => update(rawList.filter((p) => p.id !== id)),
    [rawList, update],
  )

  /** Reset to the built-in project list and clear localStorage. */
  const updateProject = useCallback(
    (id, changes) =>
      update(rawList.map((p) => (p.id === id ? { ...p, ...changes } : p))),
    [rawList, update],
  )

  const resetProjects = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRawList(RAW_PROJECTS)
  }, [])

  return {
    projects: withEmbeds(rawList),
    rawList,
    addProject,
    updateProject,
    removeProject,
    resetProjects,
  }
}
