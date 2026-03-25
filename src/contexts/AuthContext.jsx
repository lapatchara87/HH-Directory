import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isAllowedDomain } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (isAllowedDomain(firebaseUser.email)) {
          // Save/update user profile in Firestore
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
            // If Firestore is not set up yet, still allow login
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
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function signInWithGoogle() {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message)
      }
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setUser(null)
  }

  // For demo/development: allow bypassing auth
  function devSignIn() {
    setUser({
      uid: 'dev-user',
      email: 'dev@huahed.com',
      displayName: 'Dev User',
      photoURL: null,
      role: 'admin',
    })
    setLoading(false)
  }

  const isAdmin = user?.role === 'admin' || user?.uid === 'dev-user'

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
