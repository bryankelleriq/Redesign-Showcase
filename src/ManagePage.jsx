import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toId } from './useProjects.js'

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

function ProjectRow({ p, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: p.title, protoDesktop: p.protoDesktop, protoMobile: p.protoMobile })
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setDraft((d) => ({ ...d, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
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
        <button type="button" className="manage__editBtn" onClick={() => setEditing(true)} aria-label={`Edit ${p.title}`}>Edit</button>
        <button type="button" className="manage__removeBtn" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.title}`}>Remove</button>
      </div>
    </li>
  )
}

export default function ManagePage({ rawList, addProject, updateProject, removeProject, resetProjects }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [confirmReset, setConfirmReset] = useState(false)

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
        <Link to="/" className="manage__backLink">← Back to Showcase</Link>
      </header>

      <div className="manage__body">
        {/* Project list */}
        <section className="manage__section">
          <h2 className="manage__sectionTitle">Current Projects</h2>

          {rawList.length === 0 && (
            <p className="manage__empty">No projects yet. Add one below.</p>
          )}

          <ul className="manage__list">
            {rawList.map((p) => (
              <ProjectRow key={p.id} p={p} onUpdate={updateProject} onRemove={removeProject} />
            ))}
          </ul>
        </section>

        {/* Add project form */}
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

        {/* Reset */}
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
    </div>
  )
}
