import { useEffect, useMemo, useRef, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import ManagePage from './ManagePage.jsx'
import { useProjects } from './useProjects.js'
import './App.css'

/** Returns initials from the first two words of a title, e.g. "Laurel Road Redesign" → "LR" */
function initials(title) {
  return title.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

const LOGO_URL =
  'https://www.iquanti.com/wp-content/uploads/2026/01/Slate-grey-without-tagline.png'

function Showcase() {
  const { projects, rawList, addProject, removeProject, resetProjects } = useProjects()
  const [projectId, setProjectId] = useState(null)
  const [breakpoint, setBreakpoint] = useState('desktop')
  const [navCollapsed, setNavCollapsed] = useState(true)

  // Intrinsic size of the mobile iframe content (phone + device chrome)
  const MOBILE_W = 500
  const MOBILE_H = 1060

  const mobileContainerRef = useRef(null)
  const [mobileScale, setMobileScale] = useState(1)

  useEffect(() => {
    const container = mobileContainerRef.current
    if (!container || breakpoint !== 'mobile') return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setMobileScale(Math.min(width / MOBILE_W, height / MOBILE_H))
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [breakpoint])

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? projects[0],
    [projectId, projects],
  )

  const embedSrc =
    breakpoint === 'mobile' ? project?.embedMobile : project?.embedDesktop

  return (
    <div className="shell">
      <header className="appHeader">
        <div className="appHeader__brand">
          <img
            className="appHeader__logo"
            src={LOGO_URL}
            alt="iQuanti"
            width={120}
            height={40}
            decoding="async"
          />
          <div className="appHeader__divider" aria-hidden />
          <h1 className="appHeader__title">
            Creative &amp; Experience
            <span className="appHeader__pipe" aria-hidden> | </span>
            <span className="appHeader__project">{project.title}</span>
          </h1>
        </div>
        <div className="appHeader__tabs" role="tablist" aria-label="Breakpoint">
          <button
            type="button"
            role="tab"
            aria-selected={breakpoint === 'desktop'}
            className={`appHeader__tab ${breakpoint === 'desktop' ? 'appHeader__tab--active' : ''}`}
            onClick={() => setBreakpoint('desktop')}
          >
            Desktop
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={breakpoint === 'mobile'}
            className={`appHeader__tab ${breakpoint === 'mobile' ? 'appHeader__tab--active' : ''}`}
            onClick={() => setBreakpoint('mobile')}
          >
            Mobile
          </button>
        </div>
      </header>

      <div className="body">
        <main id="showcase-main" className="main">
          <div
            className={`embedChrome embedChrome--${breakpoint}`}
            ref={breakpoint === 'mobile' ? mobileContainerRef : undefined}
          >
            {breakpoint === 'mobile' ? (
              <iframe
                key={`${project.id}-mobile`}
                title={`${project.title} — mobile design`}
                className="embedChrome__iframe--mobile"
                src={embedSrc}
                allowFullScreen
                width={MOBILE_W}
                height={MOBILE_H}
                style={{ transform: `scale(${mobileScale})` }}
              />
            ) : (
              <iframe
                key={`${project.id}-desktop`}
                title={`${project.title} — desktop design`}
                className="embedChrome__iframe--desktop"
                src={embedSrc}
                allowFullScreen
              />
            )}
          </div>
        </main>

        <aside
          className={`sidebar ${navCollapsed ? 'sidebar--collapsed' : ''}`}
          aria-label="Projects"
          onMouseEnter={() => setNavCollapsed(false)}
          onMouseLeave={() => setNavCollapsed(true)}
        >
          {!navCollapsed && (
            <p className="sidebar__label">Projects</p>
          )}
          <nav className="sidebar__nav">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`sidebar__item ${p.id === project?.id ? 'sidebar__item--active' : ''}`}
                onClick={() => { setProjectId(p.id); setNavCollapsed(true) }}
                aria-current={p.id === project?.id ? 'page' : undefined}
                aria-label={navCollapsed ? p.title : undefined}
                title={navCollapsed ? p.title : undefined}
              >
                {navCollapsed ? (
                  <span className="sidebar__abbr">{initials(p.title)}</span>
                ) : (
                  p.title
                )}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Showcase />} />
      <Route path="/manage" element={<ManagePage />} />
    </Routes>
  )
}
