import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isAllowedDomain } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (isAllowedDomain(session.user.email)) {
          setUser(session.user)
        } else {
          supabase.auth.signOut()
          setError('กรุณาใช้ email บริษัทเท่านั้น')
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (isAllowedDomain(session.user.email)) {
          setUser(session.user)
          setError(null)
        } else {
          supabase.auth.signOut()
          setError('กรุณาใช้ email บริษัทเท่านั้น')
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'huahed.com',
        },
      },
    })
    if (error) setError(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  // For demo/development: allow bypassing auth
  function devSignIn() {
    setUser({
      id: 'dev-user',
      email: 'dev@huahed.com',
      user_metadata: {
        full_name: 'Dev User',
        avatar_url: null,
      },
    })
    setLoading(false)
  }

  const isAdmin = user?.email === 'admin@huahed.com' ||
    user?.user_metadata?.role === 'admin' ||
    user?.id === 'dev-user'

  return (
    <AuthContext.Provider value={{ user, loading, error, isAdmin, signInWithGoogle, signOut, devSignIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
