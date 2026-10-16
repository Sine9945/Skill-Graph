import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../services/api"

function NavIcon({ type }) {
  const props = {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }

  switch (type) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      )
    case "profile":
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    case "skills":
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      )
    case "projects":
      return (
        <svg {...props}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    case "jobs":
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    case "applications":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    case "companies":
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="9" y1="22" x2="9" y2="22.01"></line>
          <line x1="15" y1="22" x2="15" y2="22.01"></line>
          <line x1="9" y1="6" x2="9" y2="6.01"></line>
          <line x1="15" y1="6" x2="15" y2="6.01"></line>
          <line x1="9" y1="10" x2="9" y2="10.01"></line>
          <line x1="15" y1="10" x2="15" y2="10.01"></line>
          <line x1="9" y1="14" x2="9" y2="14.01"></line>
          <line x1="15" y1="14" x2="15" y2="14.01"></line>
        </svg>
      )
    default:
      return null
  }
}

const studentLinks = [
  ["/student/dashboard", "Dashboard", "dashboard"],
  ["/profile", "Profile", "profile"],
  ["/skills", "Skills", "skills"],
  ["/projects", "Projects", "projects"],
  ["/jobs", "Jobs", "jobs"],
  ["/applications", "Applications", "applications"],
]

const adminLinks = [
  ["/admin/dashboard", "Dashboard", "dashboard"],
  ["/admin/companies", "Companies", "companies"],
  ["/admin/jobs", "Jobs", "jobs"],
  ["/admin/skills", "Skills", "skills"],
  ["/admin/applications", "Applications", "applications"],
]

const hrLinks = [
  ["/hr/dashboard", "Dashboard", "dashboard"],
  ["/hr/jobs", "Jobs", "jobs"],
  ["/hr/skills", "Skills", "skills"],
  ["/hr/applications", "Applications", "applications"],
]

function AppShell({ role }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [identity, setIdentity] = useState({ name: "", company_name: "" })
  const navigate = useNavigate()
  const links = role === "admin" ? adminLinks : role === "hr" ? hrLinks : studentLinks

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const endpoint =
          role === "admin" ? "/admin/me" : role === "hr" ? "/hr/me" : "/students/me"
        const response = await api.get(endpoint)
        setIdentity({
          name: response.data.name || "",
          company_name: response.data.company_name || "",
        })
      } catch {
        localStorage.clear()
        const redirect =
          role === "admin" ? "/admin/login" : role === "hr" ? "/hr/login" : "/login"
        navigate(redirect, { replace: true })
      }
    }
    loadIdentity()
  }, [navigate, role])

  const signOut = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userRole")
    const redirect =
      role === "admin" ? "/admin/login" : role === "hr" ? "/hr/login" : "/login"
    navigate(redirect)
  }

  const brandDestination =
    role === "admin"
      ? "/admin/dashboard"
      : role === "hr"
      ? "/hr/dashboard"
      : "/student/dashboard"

  const sidebarRoleText =
    role === "admin"
      ? "ADMIN PORTAL"
      : role === "hr"
      ? `${identity.company_name ? identity.company_name.toUpperCase() + " · " : ""}HR PORTAL`
      : "STUDENT WORKSPACE"

  const userRoleLabel =
    role === "admin"
      ? "Administrator"
      : role === "hr"
      ? `${identity.company_name || "Company"} · HR`
      : "Student"

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-top">
          <NavLink
            to={brandDestination}
            className="brand"
            onClick={() => setMenuOpen(false)}
          >
            <span className="brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m8 12 3 3 5-6"></path>
              </svg>
            </span>
            <span className="brand-text">SkillGraph</span>
          </NavLink>

          <p className="sidebar-role">{sidebarRoleText}</p>

          <nav className="nav-links">
            {links.map(([to, label, iconType]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="nav-link__icon" aria-hidden="true">
                  <NavIcon type={iconType} />
                </span>
                <span className="nav-link__label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="identity">
            <span className="avatar">
              {identity.name ? identity.name[0].toUpperCase() : "U"}
            </span>
            <div className="identity-text">
              <span className="identity-name">{identity.name || "Signed in"}</span>
              <span className="identity-role">{userRoleLabel}</span>
            </div>
          </div>
          <button className="nav-link nav-link--button" type="button" onClick={signOut}>
            <span className="nav-link__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="backdrop"
          aria-label="Close menu"
          type="button"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-panel">
        <header className="mobile-header">
          <button
            type="button"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="mobile-brand">
            <span className="brand-mark brand-mark--small">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m8 12 3 3 5-6"></path>
              </svg>
            </span>
            <span>SkillGraph</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
