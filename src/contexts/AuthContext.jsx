import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isAllowedDomain } from '../lib/firebase'

const AuthContext = createContext(null)
const TOKEN_KEY = 'hh_drive_token'
const TOKEN_EXPIRY_KEY = 'hh_drive_token_expiry'

function saveToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    // Google OAuth tokens last ~1 hour
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 55 * 60 * 1000))
  } catch { /* sessionStorage unavailable */ }
}

function loadToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY)
    const expiry = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || 0)
    if (token && Date.now() < expiry) return token
    // Expired — clear
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  } catch { /* ignore */ }
  return null
}

function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(loadToken())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (isAllowedDomain(firebaseUser.email)) {
          try {
            const userRef = doc(db, 'users', firebaseUser.uid)
            const userSnap = await getDoc(userRef)
            const userData = {
              email: firebaseUser.email,
              full_name: firebaseUser.displayName || '',
              avatar_url: firebaseUser.photoURL || '',
              domain: firebaseUser.email.split('@')[1],
              updated_at: new Date().toISOString(),
            }
            if (!userSnap.exists()) {
              userData.role = 'staff'
              userData.created_at = new Date().toISOString()
            }
            await setDoc(userRef, userData, { merge: true })
            const role = userSnap.exists() ? userSnap.data().role : 'staff'
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role,
            })
          } catch {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'staff',
            })
          }
          setError(null)
        } else {
          await firebaseSignOut(auth)
          setError('กรุณาใช้ email บริษัทเท่านั้น')
        }
      } else {
        setUser(null)
        setAccessToken(null)
        clearToken()
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  async function signInWithGoogle() {
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken)
        saveToken(credential.accessToken)
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message)
      }
    }
  }

  // Re-authenticate to get a fresh token (e.g. when token expired)
  const refreshToken = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken)
        saveToken(credential.accessToken)
        return credential.accessToken
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('ไม่สามารถรีเฟรช token ได้ — กรุณา login ใหม่')
      }
    }
    return null
  }, [])

  async function signOut() {
    await firebaseSignOut(auth)
    setUser(null)
    setAccessToken(null)
    clearToken()
  }

  function devSignIn() {
    setUser({
      uid: 'dev-user',
      email: 'dev@huahed.com',
      displayName: 'Dev User',
      photoURL: null,
      role: 'admin',
    })
    setAccessToken(null)
    setLoading(false)
  }

  const isAdmin = user?.role === 'admin' || user?.uid === 'dev-user'
  const tokenExpired = user && !accessToken && user.uid !== 'dev-user'

  return (
    <AuthContext.Provider value={{
      user, accessToken, loading, error, isAdmin, tokenExpired,
      signInWithGoogle, signOut, devSignIn, refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
