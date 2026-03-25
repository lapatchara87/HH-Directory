import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { discoverAllDriveContent, searchDriveFiles } from '../lib/drive'
import { collection, doc, onSnapshot, setDoc, deleteField } from 'firebase/firestore'
import { db } from '../lib/firebase'
import * as prefs from '../lib/userPrefs'

const DocumentContext = createContext(null)

const CATEGORY_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500',
  'bg-orange-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-red-500', 'bg-amber-500', 'bg-teal-500', 'bg-violet-500',
  'bg-rose-500', 'bg-lime-500', 'bg-sky-500', 'bg-fuchsia-500',
]

const DEMO_DOCUMENTS = [
  { id: '1', name: 'ตัวอย่าง — กรุณา Login ด้วย Google เพื่อดูไฟล์จริง', description: 'Login แล้วระบบจะดึงไฟล์จาก Google Drive อัตโนมัติ', category_id: 1, file_type: 'google_doc', file_url: null, drive_link: '#', tags: [], uploaded_by: '', uploader_name: 'Demo', created_at: '2026-03-25T00:00:00Z', updated_at: '2026-03-25T00:00:00Z', is_archived: false, file_size: null },
]

const DEMO_ONBOARDING = [
  { id: '1', title: 'Login ด้วย Google Account บริษัท', description: 'กด Login ด้วย @huahed.com หรือ @procandid.com เพื่อเห็นไฟล์จาก Google Drive จริง', document_id: null, display_order: 1, is_active: true },
]

export function DocumentProvider({ children }) {
  const { accessToken } = useAuth()
  const [documents, setDocuments] = useState(DEMO_DOCUMENTS)
  const [driveCategories, setDriveCategories] = useState([])
  const [onboardingSteps, setOnboardingSteps] = useState(DEMO_ONBOARDING)
  const [searchQuery, setSearchQuery] = useState('')
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState(null)
  const [bookmarks, setBookmarks] = useState(prefs.getBookmarks())
  const [recentlyViewed, setRecentlyViewed] = useState(prefs.getRecentlyViewed())
  const [sharedTags, setSharedTags] = useState({}) // { docId: ['tag1', 'tag2'] } from Firestore

  // Listen to shared tags from Firestore (real-time, all users see same tags)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'document_tags'),
      (snapshot) => {
        const tags = {}
        snapshot.docs.forEach((d) => {
          const data = d.data()
          if (data.tags && data.tags.length > 0) {
            tags[d.id] = data.tags
          }
        })
        setSharedTags(tags)
      },
      () => {
        // Firestore not available — fall back to localStorage
        setSharedTags(prefs.getAllTags())
      }
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false

    async function loadFromDrive() {
      setDriveLoading(true)
      setDriveError(null)
      try {
        const { documents: driveDocs, categories } = await discoverAllDriveContent(accessToken)
        if (cancelled) return
        if (driveDocs.length > 0) {
          setDocuments(driveDocs)
          setDriveCategories(categories)
        } else {
          setDriveError('ไม่พบไฟล์ใน Google Drive — ลอง logout แล้ว login ใหม่ แล้วกด Allow ให้สิทธิ์อ่าน Drive')
        }
      } catch (err) {
        console.error('Drive error:', err)
        if (!cancelled) setDriveError('ไม่สามารถโหลดไฟล์จาก Google Drive: ' + (err.message || ''))
      }
      if (!cancelled) setDriveLoading(false)
    }

    loadFromDrive()
    return () => { cancelled = true }
  }, [accessToken])

  const categories = driveCategories.map((cat, index) => ({
    ...cat,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    description: '',
  }))

  const getDocumentsByCategory = useCallback((categoryId) => {
    return documents.filter((d) => d.category_id === categoryId && !d.is_archived)
  }, [documents])

  const getDocumentById = useCallback((id) => {
    return documents.find((d) => d.id === id)
  }, [documents])

  const getRecentDocuments = useCallback((limit = 10) => {
    return [...documents]
      .filter((d) => !d.is_archived)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, limit)
  }, [documents])

  const getCategoryFileCount = useCallback((categoryId) => {
    return documents.filter((d) => d.category_id === categoryId && !d.is_archived).length
  }, [documents])

  const getCategoryLastUpdated = useCallback((categoryId) => {
    const catDocs = documents.filter((d) => d.category_id === categoryId && !d.is_archived)
    if (catDocs.length === 0) return null
    return catDocs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0].updated_at
  }, [documents])

  const searchDocuments = useCallback(async (q, filters = {}) => {
    let results = [...documents]
    if (q && accessToken) {
      try {
        const driveResults = await searchDriveFiles(accessToken, q)
        const existingIds = new Set(results.map((d) => d.id))
        driveResults.forEach((d) => { if (!existingIds.has(d.id)) results.push(d) })
      } catch { /* fall back to local */ }
    }
    if (q) {
      const lower = q.toLowerCase()
      results = results.filter((d) =>
        d.name.toLowerCase().includes(lower) ||
        (d.description && d.description.toLowerCase().includes(lower))
      )
    }
    if (filters.category) results = results.filter((d) => d.category_id === filters.category)
    if (filters.fileType) results = results.filter((d) => d.file_type === filters.fileType)
    if (filters.includeArchived !== true) results = results.filter((d) => !d.is_archived)
    if (filters.uploader) {
      const ul = filters.uploader.toLowerCase()
      results = results.filter((d) =>
        (d.uploader_name && d.uploader_name.toLowerCase().includes(ul)) ||
        (d.uploaded_by && d.uploaded_by.toLowerCase().includes(ul))
      )
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom)
      results = results.filter((d) => new Date(d.updated_at) >= from)
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo)
      to.setHours(23, 59, 59, 999)
      results = results.filter((d) => new Date(d.updated_at) <= to)
    }
    if (filters.tag) {
      results = results.filter((d) => (sharedTags[d.id] || []).includes(filters.tag))
    }
    if (filters.bookmarkedOnly) {
      results = results.filter((d) => bookmarks.includes(d.id))
    }
    if (filters.sort === 'oldest') results.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
    else if (filters.sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name))
    else results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    return results
  }, [documents, accessToken, bookmarks])

  const addDocument = useCallback((docData) => {
    const newDoc = { ...docData, id: String(Date.now()), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_archived: false }
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }, [])

  const updateDocument = useCallback((id, updates) => {
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d))
  }, [])

  const deleteDocument = useCallback((id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const uploadFile = useCallback((file) => URL.createObjectURL(file), [])

  // Bookmarks
  const toggleBookmark = useCallback((docId) => {
    const updated = prefs.toggleBookmark(docId)
    setBookmarks([...updated])
  }, [])

  const isBookmarked = useCallback((docId) => {
    return bookmarks.includes(docId)
  }, [bookmarks])

  const getBookmarkedDocs = useCallback(() => {
    return documents.filter((d) => bookmarks.includes(d.id))
  }, [documents, bookmarks])

  // Recently viewed
  const trackView = useCallback((docId) => {
    const updated = prefs.addRecentlyViewed(docId)
    setRecentlyViewed([...updated])
  }, [])

  const getRecentlyViewedDocs = useCallback((limit = 10) => {
    return recentlyViewed
      .slice(0, limit)
      .map((id) => documents.find((d) => d.id === id))
      .filter(Boolean)
  }, [documents, recentlyViewed])

  // Tags — shared via Firestore (all users see same tags)
  const addTag = useCallback(async (docId, tag) => {
    const currentTags = sharedTags[docId] || []
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag]
      try {
        await setDoc(doc(db, 'document_tags', docId), { tags: newTags }, { merge: true })
      } catch {
        // Firestore unavailable — fall back to localStorage
        prefs.addTagToDoc(docId, tag)
        setSharedTags((prev) => ({ ...prev, [docId]: newTags }))
      }
    }
  }, [sharedTags])

  const removeTag = useCallback(async (docId, tag) => {
    const currentTags = (sharedTags[docId] || []).filter((t) => t !== tag)
    try {
      await setDoc(doc(db, 'document_tags', docId), { tags: currentTags }, { merge: true })
    } catch {
      prefs.removeTagFromDoc(docId, tag)
      setSharedTags((prev) => ({ ...prev, [docId]: currentTags }))
    }
  }, [sharedTags])

  const getTagsForDoc = useCallback((docId) => {
    return sharedTags[docId] || []
  }, [sharedTags])

  const getAllUniqueTags = useCallback(() => {
    const tagSet = new Set()
    Object.values(sharedTags).forEach((tags) => tags.forEach((t) => tagSet.add(t)))
    return [...tagSet].sort()
  }, [sharedTags])

  // Unique uploaders for filter
  const getAllUploaders = useCallback(() => {
    const uploaders = new Set()
    documents.forEach((d) => {
      if (d.uploader_name) uploaders.add(d.uploader_name)
    })
    return [...uploaders].sort()
  }, [documents])

  const addOnboardingStep = useCallback((step) => {
    setOnboardingSteps((prev) => [...prev, { ...step, id: String(Date.now()), display_order: prev.length + 1, is_active: true }])
  }, [])
  const updateOnboardingStep = useCallback((id, updates) => {
    setOnboardingSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s))
  }, [])
  const deleteOnboardingStep = useCallback((id) => {
    setOnboardingSteps((prev) => prev.filter((s) => s.id !== id))
  }, [])
  const reorderOnboardingSteps = useCallback((newOrder) => {
    setOnboardingSteps(newOrder.map((s, i) => ({ ...s, display_order: i + 1 })))
  }, [])

  return (
    <DocumentContext.Provider value={{
      documents, categories, onboardingSteps, searchQuery, setSearchQuery,
      driveLoading, driveError,
      getDocumentsByCategory, getDocumentById, getRecentDocuments,
      getCategoryFileCount, getCategoryLastUpdated, searchDocuments,
      addDocument, updateDocument, deleteDocument, uploadFile,
      toggleBookmark, isBookmarked, getBookmarkedDocs,
      trackView, getRecentlyViewedDocs,
      addTag, removeTag, getTagsForDoc, getAllUniqueTags,
      getAllUploaders,
      addOnboardingStep, updateOnboardingStep, deleteOnboardingStep, reorderOnboardingSteps,
    }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (!context) throw new Error('useDocuments must be used within DocumentProvider')
  return context
}
