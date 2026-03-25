import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { DocumentProvider } from './contexts/DocumentContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import OnboardingPage from './pages/OnboardingPage'
import AdminPage from './pages/AdminPage'
import BookmarksPage from './pages/BookmarksPage'
import RecentPage from './pages/RecentPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DocumentProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/bookmarks" element={<BookmarksPage />} />
                  <Route path="/recent" element={<RecentPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/:tab" element={<AdminPage />} />
                </Routes>
              </Layout>
            </DocumentProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
