import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDocuments } from '../contexts/DocumentContext'
import {
  Search, Upload, Menu, X, Home, Rocket, Settings, LogOut,
  ChevronDown, Star, Clock, Tag, FolderOpen,
} from 'lucide-react'
import UploadModal from './UploadModal'
import CommandPalette from './CommandPalette'

export default function Layout({ children }) {
  const { user, isAdmin, signOut } = useAuth()
  const { searchQuery, setSearchQuery } = useDocuments()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navLinks = [
    { to: '/', label: 'หน้าหลัก', icon: Home },
    { to: '/directory', label: 'ไดเรกทอรี่', icon: FolderOpen },
    { to: '/bookmarks', label: 'ปักหมุด', icon: Star },
    { to: '/tags', label: 'แท็ก', icon: Tag },
    { to: '/recent', label: 'เพิ่งเปิด', icon: Clock },
    { to: '/onboarding', label: 'Start Here', icon: Rocket },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Settings }] : []),
  ]

  // Mobile bottom nav — main 5 items
  const mobileNavLinks = [
    { to: '/', label: 'หน้าหลัก', icon: Home },
    { to: '/directory', label: 'ไดเรกทอรี่', icon: FolderOpen },
    { to: '/bookmarks', label: 'ปักหมุด', icon: Star },
    { to: '/tags', label: 'แท็ก', icon: Tag },
    { to: '/recent', label: 'เพิ่งเปิด', icon: Clock },
  ]

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 md:pb-0">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-slate-900 hidden sm:block">
                HuaHed Docs
              </span>
            </Link>

            {/* Search bar - desktop (click opens Cmd+K) */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex flex-1 max-w-xl mx-8 items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-400 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">ค้นหาเอกสาร...</span>
              <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={() => setUploadOpen(true)}
                className="ml-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                อัปโหลด
              </button>

              {/* Profile */}
              <div className="relative ml-1">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {user?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { setProfileOpen(false); signOut() }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile: search + menu */}
            <div className="flex items-center gap-2 md:hidden">
              <button onClick={() => setCmdOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
                <Search className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => setUploadOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
                <Upload className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-slate-100">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu (for profile, admin, etc.) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-2 py-3 space-y-1">
              <Link to="/onboarding" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                <Rocket className="w-5 h-5" /> Start Here
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                  <Settings className="w-5 h-5" /> Admin
                </Link>
              )}
              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button onClick={() => { setMobileMenuOpen(false); signOut() }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-5 h-5" /> ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {mobileNavLinks.map((link) => {
            const Icon = link.icon
            const active = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
                  active ? 'text-primary-600' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Upload modal */}
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </div>
  )
}
