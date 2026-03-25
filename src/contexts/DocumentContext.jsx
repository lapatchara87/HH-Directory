import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'

const DocumentContext = createContext(null)

// Demo data — used when Firebase is not configured yet
const DEMO_DOCUMENTS = [
  {
    id: '1',
    name: 'Company Policy 2026',
    description: 'นโยบายบริษัทประจำปี 2026',
    category_id: 1,
    file_type: 'google_doc',
    file_url: null,
    drive_link: 'https://docs.google.com/document/d/example1',
    tags: ['policy', 'company'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-20T14:30:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '2',
    name: 'Organization Chart',
    description: 'ผังองค์กร HuaHed Agency',
    category_id: 1,
    file_type: 'google_sheet',
    file_url: null,
    drive_link: 'https://docs.google.com/spreadsheets/d/example2',
    tags: ['org', 'chart'],
    uploaded_by: 'hr@huahed.com',
    uploader_name: 'HR Team',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-03-18T11:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '3',
    name: 'Client Onboarding Workflow',
    description: 'ขั้นตอนการ onboard ลูกค้าใหม่',
    category_id: 2,
    file_type: 'google_doc',
    file_url: null,
    drive_link: 'https://docs.google.com/document/d/example3',
    tags: ['workflow', 'onboarding', 'client'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-02-10T09:00:00Z',
    updated_at: '2026-03-22T16:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '4',
    name: 'Leave Request Form',
    description: 'แบบฟอร์มขอลา',
    category_id: 3,
    file_type: 'google_doc',
    file_url: null,
    drive_link: 'https://docs.google.com/document/d/example4',
    tags: ['hr', 'leave', 'form'],
    uploaded_by: 'hr@huahed.com',
    uploader_name: 'HR Team',
    created_at: '2026-01-05T08:00:00Z',
    updated_at: '2026-03-15T09:30:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '5',
    name: 'Employee Handbook',
    description: 'คู่มือพนักงาน',
    category_id: 3,
    file_type: 'pdf',
    file_url: '/files/handbook.pdf',
    drive_link: null,
    tags: ['hr', 'handbook', 'onboarding'],
    uploaded_by: 'hr@huahed.com',
    uploader_name: 'HR Team',
    created_at: '2026-01-02T08:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
    is_archived: false,
    file_size: '2.4 MB',
  },
  {
    id: '6',
    name: 'Monthly Expense Report Template',
    description: 'เทมเพลตรายงานค่าใช้จ่ายรายเดือน',
    category_id: 4,
    file_type: 'google_sheet',
    file_url: null,
    drive_link: 'https://docs.google.com/spreadsheets/d/example6',
    tags: ['accounting', 'expense', 'template'],
    uploaded_by: 'accounting@huahed.com',
    uploader_name: 'Accounting',
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-03-24T08:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '7',
    name: 'AE Proposal Template',
    description: 'เทมเพลตเสนองาน AE',
    category_id: 5,
    file_type: 'google_slide',
    file_url: null,
    drive_link: 'https://docs.google.com/presentation/d/example7',
    tags: ['template', 'ae', 'proposal'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-02-20T09:00:00Z',
    updated_at: '2026-03-21T15:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '8',
    name: 'HuaHedHub Project Plan',
    description: 'แผนโปรเจค HuaHedHub',
    category_id: 6,
    file_type: 'google_sheet',
    file_url: null,
    drive_link: 'https://docs.google.com/spreadsheets/d/example8',
    tags: ['project', 'plan', 'huahedhub'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-25T10:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '9',
    name: 'Procandid Brand Guidelines',
    description: 'แนวทางการใช้แบรนด์ Procandid',
    category_id: 7,
    file_type: 'pdf',
    file_url: '/files/procandid-brand.pdf',
    drive_link: null,
    tags: ['brand', 'procandid', 'guidelines'],
    uploaded_by: 'design@procandid.com',
    uploader_name: 'Design Team',
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-03-05T11:00:00Z',
    is_archived: false,
    file_size: '5.1 MB',
  },
  {
    id: '10',
    name: 'Allerguard Product Catalog',
    description: 'แคตตาล็อกสินค้า Allerguard',
    category_id: 8,
    file_type: 'google_slide',
    file_url: null,
    drive_link: 'https://docs.google.com/presentation/d/example10',
    tags: ['allerguard', 'product', 'catalog'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-03-19T14:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '11',
    name: 'TOR Template 2026',
    description: 'แบบฟอร์ม TOR ประจำปี 2026',
    category_id: 9,
    file_type: 'google_doc',
    file_url: null,
    drive_link: 'https://docs.google.com/document/d/example11',
    tags: ['tor', 'template', 'government'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-03-12T09:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '12',
    name: 'Project Brief - Campaign Q2',
    description: 'บรีฟงาน Campaign ไตรมาส 2',
    category_id: 10,
    file_type: 'google_doc',
    file_url: null,
    drive_link: 'https://docs.google.com/document/d/example12',
    tags: ['brief', 'campaign', 'q2'],
    uploaded_by: 'ae@huahed.com',
    uploader_name: 'AE Team',
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-03-23T17:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '13',
    name: 'Digital Marketing 101',
    description: 'ความรู้พื้นฐาน Digital Marketing',
    category_id: 11,
    file_type: 'pdf',
    file_url: '/files/digital-marketing-101.pdf',
    drive_link: null,
    tags: ['knowledge', 'marketing', 'digital'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-02-05T09:00:00Z',
    updated_at: '2026-03-08T10:00:00Z',
    is_archived: false,
    file_size: '3.2 MB',
  },
  {
    id: '14',
    name: 'Social Media Strategy Guide',
    description: 'คู่มือกลยุทธ์ Social Media',
    category_id: 11,
    file_type: 'google_doc',
    file_url: null,
    drive_link: 'https://docs.google.com/document/d/example14',
    tags: ['knowledge', 'social media', 'strategy'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-02-20T09:00:00Z',
    updated_at: '2026-03-17T13:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '15',
    name: 'Training Video - Canva',
    description: 'วิดีโอสอนใช้ Canva สำหรับทีม',
    category_id: 11,
    file_type: 'video',
    file_url: null,
    drive_link: 'https://www.youtube.com/watch?v=example',
    tags: ['knowledge', 'training', 'canva', 'video'],
    uploaded_by: 'admin@huahed.com',
    uploader_name: 'Admin',
    created_at: '2026-03-05T09:00:00Z',
    updated_at: '2026-03-05T09:00:00Z',
    is_archived: false,
    file_size: null,
  },
  {
    id: '16',
    name: 'Company Logo Pack',
    description: 'ไฟล์โลโก้บริษัททุกขนาด',
    category_id: 1,
    file_type: 'image',
    file_url: '/files/logo-pack.png',
    drive_link: null,
    tags: ['logo', 'brand', 'image'],
    uploaded_by: 'design@huahed.com',
    uploader_name: 'Design Team',
    created_at: '2026-01-08T09:00:00Z',
    updated_at: '2026-01-08T09:00:00Z',
    is_archived: false,
    file_size: '1.8 MB',
  },
]

const DEMO_ONBOARDING_STEPS = [
  {
    id: '1',
    title: 'อ่านคู่มือพนักงาน',
    description: 'อ่านคู่มือพนักงานเพื่อทำความเข้าใจนโยบายและวัฒนธรรมบริษัท',
    document_id: '5',
    display_order: 1,
    is_active: true,
  },
  {
    id: '2',
    title: 'ทำความเข้าใจผังองค์กร',
    description: 'ดูผังองค์กรเพื่อทราบโครงสร้างทีมและหัวหน้างาน',
    document_id: '2',
    display_order: 2,
    is_active: true,
  },
  {
    id: '3',
    title: 'ศึกษา Workflow การทำงาน',
    description: 'เรียนรู้ขั้นตอนการทำงานกับลูกค้าตั้งแต่ต้นจนจบ',
    document_id: '3',
    display_order: 3,
    is_active: true,
  },
  {
    id: '4',
    title: 'ทำแบบฟอร์ม HR',
    description: 'กรอกเอกสาร HR ที่จำเป็นสำหรับพนักงานใหม่',
    document_id: '4',
    display_order: 4,
    is_active: true,
  },
  {
    id: '5',
    title: 'อ่านนโยบายบริษัท',
    description: 'อ่านนโยบายบริษัทเพิ่มเติมรวมถึงกฎระเบียบต่างๆ',
    document_id: '1',
    display_order: 5,
    is_active: true,
  },
  {
    id: '6',
    title: 'ดูวิดีโอ Training',
    description: 'ดูวิดีโอสอนเครื่องมือที่ใช้ในบริษัท',
    document_id: '15',
    display_order: 6,
    is_active: true,
  },
]

function isFirebaseConfigured() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  return projectId && projectId !== 'demo-project'
}

export function DocumentProvider({ children }) {
  const [documents, setDocuments] = useState(DEMO_DOCUMENTS)
  const [onboardingSteps, setOnboardingSteps] = useState(DEMO_ONBOARDING_STEPS)
  const [searchQuery, setSearchQuery] = useState('')
  const [useFirestore, setUseFirestore] = useState(false)

  // Listen to Firestore if configured
  useEffect(() => {
    if (!isFirebaseConfigured()) return

    setUseFirestore(true)

    const docsQuery = query(collection(db, 'documents'), orderBy('updated_at', 'desc'))
    const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        created_at: d.data().created_at?.toDate?.()?.toISOString() || d.data().created_at,
        updated_at: d.data().updated_at?.toDate?.()?.toISOString() || d.data().updated_at,
      }))
      if (docs.length > 0) setDocuments(docs)
    }, () => {
      // Firestore error — fall back to demo data
      setUseFirestore(false)
    })

    const stepsQuery = query(collection(db, 'onboarding_steps'), orderBy('display_order', 'asc'))
    const unsubSteps = onSnapshot(stepsQuery, (snapshot) => {
      const steps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (steps.length > 0) setOnboardingSteps(steps)
    })

    return () => {
      unsubDocs()
      unsubSteps()
    }
  }, [])

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

  const searchDocuments = useCallback((q, filters = {}) => {
    let results = [...documents]

    if (q) {
      const lower = q.toLowerCase()
      results = results.filter((d) =>
        d.name.toLowerCase().includes(lower) ||
        (d.description && d.description.toLowerCase().includes(lower)) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(lower)))
      )
    }

    if (filters.category) results = results.filter((d) => d.category_id === filters.category)
    if (filters.fileType) results = results.filter((d) => d.file_type === filters.fileType)
    if (filters.includeArchived !== true) results = results.filter((d) => !d.is_archived)

    if (filters.sort === 'oldest') {
      results.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
    } else if (filters.sort === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    }

    return results
  }, [documents])

  const addDocument = useCallback(async (docData) => {
    if (useFirestore) {
      await addDoc(collection(db, 'documents'), {
        ...docData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        is_archived: false,
      })
    } else {
      const newDoc = {
        ...docData,
        id: String(Date.now()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false,
      }
      setDocuments((prev) => [newDoc, ...prev])
      return newDoc
    }
  }, [useFirestore])

  const updateDocument = useCallback(async (id, updates) => {
    if (useFirestore) {
      await updateDoc(doc(db, 'documents', id), {
        ...updates,
        updated_at: serverTimestamp(),
      })
    } else {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
        )
      )
    }
  }, [useFirestore])

  const deleteDocument = useCallback(async (id) => {
    if (useFirestore) {
      await deleteDoc(doc(db, 'documents', id))
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    }
  }, [useFirestore])

  const uploadFile = useCallback(async (file) => {
    if (!useFirestore) return URL.createObjectURL(file)
    const fileRef = ref(storage, `documents/${Date.now()}_${file.name}`)
    await uploadBytes(fileRef, file)
    return getDownloadURL(fileRef)
  }, [useFirestore])

  const addOnboardingStep = useCallback(async (step) => {
    if (useFirestore) {
      await addDoc(collection(db, 'onboarding_steps'), {
        ...step,
        display_order: onboardingSteps.length + 1,
        is_active: true,
      })
    } else {
      const newStep = {
        ...step,
        id: String(Date.now()),
        display_order: onboardingSteps.length + 1,
        is_active: true,
      }
      setOnboardingSteps((prev) => [...prev, newStep])
    }
  }, [useFirestore, onboardingSteps])

  const updateOnboardingStep = useCallback(async (id, updates) => {
    if (useFirestore) {
      await updateDoc(doc(db, 'onboarding_steps', id), updates)
    } else {
      setOnboardingSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      )
    }
  }, [useFirestore])

  const deleteOnboardingStep = useCallback(async (id) => {
    if (useFirestore) {
      await deleteDoc(doc(db, 'onboarding_steps', id))
    } else {
      setOnboardingSteps((prev) => prev.filter((s) => s.id !== id))
    }
  }, [useFirestore])

  const reorderOnboardingSteps = useCallback((newOrder) => {
    setOnboardingSteps(newOrder.map((s, i) => ({ ...s, display_order: i + 1 })))
  }, [])

  return (
    <DocumentContext.Provider
      value={{
        documents,
        onboardingSteps,
        searchQuery,
        setSearchQuery,
        getDocumentsByCategory,
        getDocumentById,
        getRecentDocuments,
        getCategoryFileCount,
        getCategoryLastUpdated,
        searchDocuments,
        addDocument,
        updateDocument,
        deleteDocument,
        uploadFile,
        addOnboardingStep,
        updateOnboardingStep,
        deleteOnboardingStep,
        reorderOnboardingSteps,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  const context = useContext(DocumentContext)
  if (!context) throw new Error('useDocuments must be used within DocumentProvider')
  return context
}
