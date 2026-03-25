import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDocuments } from '../contexts/DocumentContext'
import {
  Search,
  Upload,
  Menu,
  X,
  Home,
  Rocket,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import UploadModal from './UploadModal'

export default function Layout({ children }) {
  const { user, isAdmin, signOut } = useAuth()
  const { searchQuery, setSearchQuery } = useDocuments()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navLinks = [
    { to: '/', label: 'หน้าหลัก', icon: Home },
    { to: '/onboarding', label: 'Start Here', icon: Rocket },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Settings }] : []),
  ]

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-slate-900 hidden sm:block">
                HuaHed Docs
              </span>
            </Link>

            {/* Search bar - desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาเอกสาร..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={() => setUploadOpen(true)}
                className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                อัปโหลด
              </button>

              {/* Profile dropdown */}
              <div className="relative ml-2">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          signOut()
                        }}
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาเอกสาร..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </form>
            </div>
            <div className="px-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      location.pathname === link.to
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                )
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setUploadOpen(true)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                <Upload className="w-5 h-5" />
                อัปโหลดเอกสาร
              </button>
              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>

      {/* Floating upload button - mobile */}
      <button
        onClick={() => setUploadOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center z-40"
      >
        <Upload className="w-6 h-6" />
      </button>

      {/* Upload modal */}
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </div>
  )
}
