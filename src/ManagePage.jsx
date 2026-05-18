import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  basicAuthHeader,
  fetchAuthStatus,
  toId,
  useProjects,
  verifyCredentials,
} from './useProjects.js'

const LOGO_URL =
  'https://www.iquanti.com/wp-content/uploads/2026/01/Slate-grey-without-tagline.png'

const PROTO_PLACEHOLDER = 'https://www.figma.com/proto/...'

const EMPTY_FORM = { title: '', protoDesktop: '', protoMobile: '' }

function isValidProtoUrl(url) {
  return url.startsWith('https://www.figma.com/proto/')
}

function validateFields(fields) {
  const errs = {}
  if (!fields.title.trim()) errs.title = 'Title is required.'
  if (!isValidProtoUrl(fields.protoDesktop))
    errs.protoDesktop = 'Must be a Figma prototype URL (https://www.figma.com/proto/…)'
  if (!isValidProtoUrl(fields.protoMobile))
    errs.protoMobile = 'Must be a Figma prototype URL (https://www.figma.com/proto/…)'
  return errs
}

function LoginForm({ onSuccess }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const ok = await verifyCredentials(user, pass)
      if (!ok) {
        setError('Invalid username or password.')
        return
      }
      onSuccess(basicAuthHeader(user, pass))
    } catch {
      setError('Could not reach the server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <form className="login__form" onSubmit={handleSubmit} noValidate>
        <h2 className="login__title">Sign in to manage projects</h2>
        <div className="manage__field">
          <label className="manage__label" htmlFor="login-user">Username</label>
          <input
            id="login-user"
            type="text"
            className="manage__input"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </div>
        <div className="manage__field">
          <label className="manage__label" htmlFor="login-pass">Password</label>
          <input
            id="login-pass"
            type="password"
            className="manage__input"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="login__error">{error}</p>}
        <button type="submit" className="manage__addBtn" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function ProjectRow({ p, onUpdate, onRemove, onMoveUp, onMoveDown }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: p.title, protoDesktop: p.protoDesktop, protoMobile: p.protoMobile })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setDraft((d) => ({ ...d, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }

  function startEdit() {
    // Always reseed the draft from the current saved values, so prior edits
    // (or unsaved typing) can't leak into a fresh edit session.
    setDraft({ title: p.title, protoDesktop: p.protoDesktop, protoMobile: p.protoMobile })
    setErrors({})
    setEditing(true)
  }

  function handleSave(e) {
    e.preventDefault()
    const errs = validateFields(draft)
    if (Object.keys(errs).length) { setErrors(errs); return }
    onUpdate(p.id, { title: draft.title.trim(), protoDesktop: draft.protoDesktop.trim(), protoMobile: draft.protoMobile.trim() })
    setEditing(false)
    setErrors({})
  }

  function handleCancel() {
    setDraft({ title: p.title, protoDesktop: p.protoDesktop, protoMobile: p.protoMobile })
    setErrors({})
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="manage__row manage__row--editing">
        <form className="manage__inlineForm" onSubmit={handleSave} noValidate>
          <div className="manage__field">
            <label className="manage__label" htmlFor={`title-${p.id}`}>Project Title</label>
            <input id={`title-${p.id}`} name="title" type="text" className={`manage__input ${errors.title ? 'manage__input--error' : ''}`} value={draft.title} onChange={handleChange} />
            {errors.title && <span className="manage__error">{errors.title}</span>}
          </div>
          <div className="manage__field">
            <label className="manage__label" htmlFor={`desk-${p.id}`}>Desktop Prototype URL</label>
            <input id={`desk-${p.id}`} name="protoDesktop" type="url" className={`manage__input ${errors.protoDesktop ? 'manage__input--error' : ''}`} value={draft.protoDesktop} onChange={handleChange} />
            {errors.protoDesktop && <span className="manage__error">{errors.protoDesktop}</span>}
          </div>
          <div className="manage__field">
            <label className="manage__label" htmlFor={`mob-${p.id}`}>Mobile Prototype URL</label>
            <input id={`mob-${p.id}`} name="protoMobile" type="url" className={`manage__input ${errors.protoMobile ? 'manage__input--error' : ''}`} value={draft.protoMobile} onChange={handleChange} />
            {errors.protoMobile && <span className="manage__error">{errors.protoMobile}</span>}
          </div>
          <div className="manage__inlineActions">
            <button type="submit" className="manage__addBtn">Save</button>
            <button type="button" className="manage__cancelBtn" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="manage__row">
      <div className="manage__rowInfo">
        <span className="manage__rowTitle">{p.title}</span>
        <span className="manage__rowUrl" title={p.protoDesktop}>Desktop: {p.protoDesktop}</span>
        <span className="manage__rowUrl" title={p.protoMobile}>Mobile: {p.protoMobile}</span>
      </div>
      <div className="manage__rowActions">
        <button type="button" className="manage__moveBtn" onClick={onMoveUp} disabled={!onMoveUp} aria-label={`Move ${p.title} up`}>↑</button>
        <button type="button" className="manage__moveBtn" onClick={onMoveDown} disabled={!onMoveDown} aria-label={`Move ${p.title} down`}>↓</button>
        <button type="button" className="manage__editBtn" onClick={startEdit} aria-label={`Edit ${p.title}`}>Edit</button>
        <button type="button" className="manage__removeBtn" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.title}`}>Remove</button>
      </div>
    </li>
  )
}

function ManageBody({ authHeader, onLogout }) {
  const {
    rawList,
    saveError,
    addProject,
    updateProject,
    moveProject,
    removeProject,
    resetProjects,
  } = useProjects(authHeader)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [confirmReset, setConfirmReset] = useState(false)

  // If a save fails with 401 (e.g. credentials changed on the server), log out.
  useEffect(() => {
    if (saveError && saveError.status === 401 && onLogout) onLogout()
  }, [saveError, onLogout])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }

  function handleAdd(e) {
    e.preventDefault()
    const errs = validateFields(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    let id = toId(form.title)
    const existingIds = rawList.map((p) => p.id)
    if (existingIds.includes(id)) id = `${id}-${Date.now()}`

    addProject({ id, title: form.title.trim(), protoDesktop: form.protoDesktop.trim(), protoMobile: form.protoMobile.trim() })
    setForm(EMPTY_FORM)
    setErrors({})
  }

  return (
    <div className="manage__body">
      {saveError && saveError.status !== 401 && (
        <div className="manage__saveError" role="alert">
          Failed to save changes to the server. Check the console and try again.
        </div>
      )}

      <section className="manage__section">
        <h2 className="manage__sectionTitle">Current Projects</h2>

        {rawList.length === 0 && (
          <p className="manage__empty">No projects yet. Add one below.</p>
        )}

        <ul className="manage__list">
          {rawList.map((p, i) => (
            <ProjectRow
              key={p.id}
              p={p}
              onUpdate={updateProject}
              onRemove={removeProject}
              onMoveUp={i > 0 ? () => moveProject(p.id, 'up') : null}
              onMoveDown={i < rawList.length - 1 ? () => moveProject(p.id, 'down') : null}
            />
          ))}
        </ul>
      </section>

      <section className="manage__section">
        <h2 className="manage__sectionTitle">Add Project</h2>
        <form className="manage__form" onSubmit={handleAdd} noValidate>
          <div className="manage__field">
            <label className="manage__label" htmlFor="title">Project Title</label>
            <input
              id="title"
              name="title"
              type="text"
              className={`manage__input ${errors.title ? 'manage__input--error' : ''}`}
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Acme Corp Redesign"
            />
            {errors.title && <span className="manage__error">{errors.title}</span>}
          </div>

          <div className="manage__field">
            <label className="manage__label" htmlFor="protoDesktop">Desktop Prototype URL</label>
            <input
              id="protoDesktop"
              name="protoDesktop"
              type="url"
              className={`manage__input ${errors.protoDesktop ? 'manage__input--error' : ''}`}
              value={form.protoDesktop}
              onChange={handleChange}
              placeholder={PROTO_PLACEHOLDER}
            />
            {errors.protoDesktop && <span className="manage__error">{errors.protoDesktop}</span>}
          </div>

          <div className="manage__field">
            <label className="manage__label" htmlFor="protoMobile">Mobile Prototype URL</label>
            <input
              id="protoMobile"
              name="protoMobile"
              type="url"
              className={`manage__input ${errors.protoMobile ? 'manage__input--error' : ''}`}
              value={form.protoMobile}
              onChange={handleChange}
              placeholder={PROTO_PLACEHOLDER}
            />
            {errors.protoMobile && <span className="manage__error">{errors.protoMobile}</span>}
          </div>

          <button type="submit" className="manage__addBtn">Add Project</button>
        </form>
      </section>

      <section className="manage__section manage__section--reset">
        {!confirmReset ? (
          <button type="button" className="manage__resetBtn" onClick={() => setConfirmReset(true)}>
            Reset to defaults
          </button>
        ) : (
          <div className="manage__confirmRow">
            <span>This will restore the built-in project list and clear all your changes. Are you sure?</span>
            <button type="button" className="manage__removeBtn" onClick={() => { resetProjects(); setConfirmReset(false) }}>Yes, reset</button>
            <button type="button" className="manage__cancelBtn" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        )}
      </section>
    </div>
  )
}

const AUTH_STORAGE_KEY = 'iq-manage-auth'

function readStoredAuth() {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredAuth(value) {
  try {
    if (value) sessionStorage.setItem(AUTH_STORAGE_KEY, value)
    else sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* ignore (e.g. private-mode quota) */
  }
}

export default function ManagePage() {
  const [authRequired, setAuthRequired] = useState(null)
  const [authHeader, setAuthHeaderState] = useState(() => readStoredAuth())

  // Keep sessionStorage in sync so credentials survive refresh / navigation
  // within the same tab. Closing the tab clears them.
  const setAuthHeader = (value) => {
    writeStoredAuth(value)
    setAuthHeaderState(value)
  }

  useEffect(() => {
    fetchAuthStatus().then((s) => setAuthRequired(s.authRequired))
  }, [])

  const showLogin = authRequired === true && !authHeader

  return (
    <div className="managePage">
      <header className="appHeader">
        <div className="appHeader__brand">
          <img className="appHeader__logo" src={LOGO_URL} alt="iQuanti" width={120} height={40} decoding="async" />
          <div className="appHeader__divider" aria-hidden />
          <h1 className="appHeader__title">
            Creative &amp; Experience
            <span className="appHeader__pipe" aria-hidden> | </span>
            <span className="appHeader__project">Manage Projects</span>
          </h1>
        </div>
        <div className="manage__headerActions">
          {authHeader && (
            <button type="button" className="manage__cancelBtn" onClick={() => setAuthHeader(null)}>
              Sign out
            </button>
          )}
          <Link to="/" className="manage__backLink">← Back to Showcase</Link>
        </div>
      </header>

      {authRequired === null ? (
        <p className="manage__empty">Loading…</p>
      ) : showLogin ? (
        <LoginForm onSuccess={setAuthHeader} />
      ) : (
        <ManageBody authHeader={authHeader} onLogout={() => setAuthHeader(null)} />
      )}
    </div>
  )
}
