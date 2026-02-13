import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../auth/useAuth'
import RoleBadge from '../components/RoleBadge'
import { canUploadDocuments } from '../utils/user'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMenuOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleOutsideClick = event => {
      if (!menuOpen) return
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handleOutsideClick)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const doLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  const pageName = (() => {
    if (location.pathname.startsWith('/documents/upload')) return 'Upload Document'
    if (location.pathname.includes('/edit')) return 'Edit Document'
    if (/^\/documents\/\d+/.test(location.pathname)) return 'Document Details'
    if (location.pathname.startsWith('/documents')) return 'Documents'
    return 'Dashboard'
  })()

  const navClassName = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-[#eef4ff] text-[#335ec9] shadow-[inset_0_0_0_1px_rgba(72,128,255,0.16)]'
        : 'text-[#5a6073] hover:bg-[#f4f7ff] hover:text-[#335ec9]'
    }`

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#111827]/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-[#e8ecf4] bg-white px-4 pb-5 pt-6 transition-transform md:static md:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Link to="/dashboard" className="mb-8 flex items-center gap-3 px-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#4880ff] text-sm font-bold text-white shadow-[0_8px_20px_rgba(72,128,255,0.35)]">
              DS
            </span>
            <div>
              <p className="text-sm font-semibold text-[#202224]">DashStack Docs</p>
              <p className="text-xs text-[#8a92a6]">Admin Dashboard</p>
            </div>
          </Link>

          <nav className="space-y-1.5">
            <NavLink to="/dashboard" className={navClassName}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#f1f5ff] text-[11px] text-[#4e6fe5]">
                D
              </span>
              Dashboard
            </NavLink>
            <NavLink to="/documents" className={navClassName}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#f1f5ff] text-[11px] text-[#4e6fe5]">
                F
              </span>
              Documents
            </NavLink>
            {canUploadDocuments(user) ? (
              <NavLink to="/documents/upload" className={navClassName}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#f1f5ff] text-[11px] text-[#4e6fe5]">
                  U
                </span>
                Upload
              </NavLink>
            ) : null}
          </nav>

          <div className="mt-8 rounded-2xl border border-[#e8ecf4] bg-[#f8faff] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a92a6]">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-[#202224]">{user?.name || 'User'}</p>
            <div className="mt-2">
              <RoleBadge user={user} />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e8ecf4] bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-[#d9e2f1] bg-white p-2 text-[#4e6fe5] md:hidden"
                  onClick={() => setMobileOpen(prev => !prev)}
                  aria-label="Open sidebar"
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-[#202224]">{pageName}</h1>
                  <p className="text-xs text-[#8a92a6]">Welcome to your workspace</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(prev => !prev)}
                    className={`group flex items-center gap-2 rounded-2xl border bg-white px-2.5 py-1.5 text-sm shadow-sm transition sm:px-3 ${
                      menuOpen ? 'border-[#bcd0fb] shadow-[0_8px_18px_rgba(72,128,255,0.16)]' : 'border-[#d9e2f1]'
                    }`}
                    aria-label="Open user menu"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef4ff] font-semibold text-[#4e6fe5]">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                    <div className="hidden text-left sm:block">
                      <p className="text-sm font-semibold leading-none text-[#27324a]">{user?.name || 'User'}</p>
                      <p className="mt-1 text-xs leading-none text-[#8a92a6]">Account</p>
                    </div>
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-4 w-4 text-[#8a92a6] transition ${menuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M5.5 7.8L10 12.2l4.5-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>

                  {menuOpen ? (
                    <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-[#e8ecf4] bg-white shadow-[0_20px_40px_rgba(17,24,39,0.16)]">
                      <div className="border-b border-[#edf1f8] bg-[#f8faff] p-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1ff] font-semibold text-[#4368d8]">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#202224]">{user?.name}</p>
                            <p className="truncate text-xs text-[#8a92a6]">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <RoleBadge user={user} />
                        </div>
                      </div>

                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#4a5571] transition hover:bg-[#f4f7ff] hover:text-[#335ec9]"
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#edf3ff] text-[11px] font-semibold text-[#4e6fe5]">
                            D
                          </span>
                          Dashboard
                        </Link>
                        <Link
                          to="/documents"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#4a5571] transition hover:bg-[#f4f7ff] hover:text-[#335ec9]"
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#edf3ff] text-[11px] font-semibold text-[#4e6fe5]">
                            F
                          </span>
                          Documents
                        </Link>
                        {canUploadDocuments(user) ? (
                          <Link
                            to="/documents/upload"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#4a5571] transition hover:bg-[#f4f7ff] hover:text-[#335ec9]"
                          >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#edf3ff] text-[11px] font-semibold text-[#4e6fe5]">
                              U
                            </span>
                            Upload Document
                          </Link>
                        ) : null}
                      </div>

                      <div className="border-t border-[#edf1f8] p-2">
                        <button
                          type="button"
                          onClick={doLogout}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-[#dc3b5b] transition hover:bg-[#fff2f5]"
                          disabled={loggingOut}
                        >
                          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
                          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                            <path
                              d="M8 6.5V5.8a2.3 2.3 0 012.3-2.3h4a2.3 2.3 0 012.3 2.3v8.4a2.3 2.3 0 01-2.3 2.3h-4A2.3 2.3 0 018 14.2v-.7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path d="M2.8 10h9.8M9.8 7l2.9 3-2.9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="hidden rounded-xl border border-[#d9e2f1] bg-white px-3 py-2 text-right shadow-sm sm:block">
                  <p className="text-xs text-[#8a92a6]">Role</p>
                  <div className="mt-1">
                        <RoleBadge user={user} />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
