import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyACZm_F4fjMDvp3KRLW9Omwx9noj7Ggu8k",
  authDomain: "hhxfileindex.firebaseapp.com",
  projectId: "hhxfileindex",
  storageBucket: "hhxfileindex.firebasestorage.app",
  messagingSenderId: "552275735152",
  appId: "1:552275735152:web:774514602f9b6bae69fab5",
  measurementId: "G-5QX705R5VG",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  hd: 'huahed.com',
  prompt: 'select_account',
})

export const ALLOWED_DOMAINS = ['huahed.com', 'procandid.com']

export function isAllowedDomain(email) {
  if (!email) return false
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}
