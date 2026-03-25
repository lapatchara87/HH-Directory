import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { fetchFilesFromFolder, fetchSubFolders, searchDriveFiles } from '../lib/drive'
import { matchFolderToCategory } from '../lib/categories'

const DocumentContext = createContext(null)

// Demo data — used when no Google Drive access token is available
const DEMO_DOCUMENTS = [
  { id: '1', name: 'Company Policy 2026', description: 'นโยบายบริษัทประจำปี 2026', category_id: 1, file_type: 'google_doc', file_url: null, drive_link: 'https://docs.google.com/document/d/example1', tags: ['policy'], uploaded_by: 'admin@huahed.com', uploader_name: 'Admin', created_at: '2026-03-01T09:00:00Z', updated_at: '2026-03-20T14:30:00Z', is_archived: false, file_size: null },
  { id: '2', name: 'Organization Chart', description: 'ผังองค์กร HuaHed', category_id: 1, file_type: 'google_sheet', file_url: null, drive_link: 'https://docs.google.com/spreadsheets/d/example2', tags: ['org'], uploaded_by: 'hr@huahed.com', uploader_name: 'HR', created_at: '2026-01-15T10:00:00Z', updated_at: '2026-03-18T11:00:00Z', is_archived: false, file_size: null },
  { id: '3', name: 'Client Onboarding Workflow', description: 'ขั้นตอน onboard ลูกค้าใหม่', category_id: 2, file_type: 'google_doc', file_url: null, drive_link: 'https://docs.google.com/document/d/example3', tags: ['workflow'], uploaded_by: 'admin@huahed.com', uploader_name: 'Admin', created_at: '2026-02-10T09:00:00Z', updated_at: '2026-03-22T16:00:00Z', is_archived: false, file_size: null },
  { id: '4', name: 'Leave Request Form', description: 'แบบฟอร์มขอลา', category_id: 3, file_type: 'google_doc', file_url: null, drive_link: 'https://docs.google.com/document/d/example4', tags: ['hr'], uploaded_by: 'hr@huahed.com', uploader_name: 'HR', created_at: '2026-01-05T08:00:00Z', updated_at: '2026-03-15T09:30:00Z', is_archived: false, file_size: null },
  { id: '5', name: 'Employee Handbook', description: 'คู่มือพนักงาน', category_id: 3, file_type: 'pdf', file_url: null, drive_link: 'https://docs.google.com/document/d/example5', tags: ['handbook'], uploaded_by: 'hr@huahed.com', uploader_name: 'HR', created_at: '2026-01-02T08:00:00Z', updated_at: '2026-03-10T10:00:00Z', is_archived: false, file_size: '2.4 MB' },
]

const DEMO_ONBOARDING_STEPS = [
  { id: '1', title: 'อ่านคู่มือพนักงาน', description: 'อ่านคู่มือพนักงานเพื่อทำความเข้าใจนโยบายบริษัท', document_id: '5', display_order: 1, is_active: true },
  { id: '2', title: 'ทำความเข้าใจผังองค์กร', description: 'ดูผังองค์กรเพื่อทราบโครงสร้างทีม', document_id: '2', display_order: 2, is_active: true },
  { id: '3', title: 'ศึกษา Workflow', description: 'เรียนรู้ขั้นตอนการทำงานกับลูกค้า', document_id: '3', display_order: 3, is_active: true },
  { id: '4', title: 'ทำแบบฟอร์ม HR', description: 'กรอกเอกสาร HR สำหรับพนักงานใหม่', document_id: '4', display_order: 4, is_active: true },
  { id: '5', title: 'อ่านนโยบายบริษัท', description: 'อ่านนโยบายและกฎระเบียบต่างๆ', document_id: '1', display_order: 5, is_active: true },
]

export function DocumentProvider({ children }) {
  const { accessToken } = useAuth()
  const [documents, setDocuments] = useState(DEMO_DOCUMENTS)
  const [onboardingSteps, setOnboardingSteps] = useState(DEMO_ONBOARDING_STEPS)
  const [searchQuery, setSearchQuery] = useState('')
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState(null)
  const [folderMap, setFolderMap] = useState({}) // folderId -> categoryId

  // Fetch files from Google Drive when access token is available
  useEffect(() => {
    if (!accessToken) return

    async function loadFromDrive() {
      setDriveLoading(true)
      setDriveError(null)

      try {
        // Step 1: Find all files the user has access to via Shared Drives and My Drive
        // We'll search for all top-level folders and map them to categories
        const allDocuments = []

        // Fetch files from Shared Drives
        const sharedDrivesRes = await fetch(
          'https://www.googleapis.com/drive/v3/drives?pageSize=50',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        let sharedDrives = []
        if (sharedDrivesRes.ok) {
          const data = await sharedDrivesRes.json()
          sharedDrives = data.drives || []
        }

        // For each shared drive, get subfolders and files
        for (const drive of sharedDrives) {
          const subFolders = await fetchSubFolders(accessToken, drive.id)

          // Files directly in the shared drive root
          const rootFiles = await fetchFilesFromFolder(accessToken, drive.id, null)
          // Try to match the drive name itself to a category
          const driveCategory = matchFolderToCategory(drive.name)
          rootFiles.forEach((f) => { if (!f.category_id) f.category_id = driveCategory })
          allDocuments.push(...rootFiles)

          // Files in subfolders
          const newFolderMap = {}
          for (const folder of subFolders) {
            const categoryId = matchFolderToCategory(folder.name)
            newFolderMap[folder.id] = categoryId
            const files = await fetchFilesFromFolder(accessToken, folder.id, categoryId)
            allDocuments.push(...files)
          }
          setFolderMap((prev) => ({ ...prev, ...newFolderMap }))
        }

        // Also fetch from My Drive root folders
        const myDriveFolders = await fetchSubFolders(accessToken, 'root')
        for (const folder of myDriveFolders) {
          const categoryId = matchFolderToCategory(folder.name)
          if (categoryId) {
            const files = await fetchFilesFromFolder(accessToken, folder.id, categoryId)
            allDocuments.push(...files)
          }
        }

        // If we got files, replace demo data
        if (allDocuments.length > 0) {
          setDocuments(allDocuments)
        }
      } catch (err) {
        console.error('Drive fetch error:', err)
        setDriveError('ไม่สามารถโหลดไฟล์จาก Google Drive ได้')
      }

      setDriveLoading(false)
    }

    loadFromDrive()
  }, [accessToken])

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

    // If we have an access token and a query, also search Drive
    if (q && accessToken) {
      try {
        const driveResults = await searchDriveFiles(accessToken, q)
        // Merge with local, avoiding duplicates
        const existingIds = new Set(results.map((d) => d.id))
        driveResults.forEach((d) => {
          if (!existingIds.has(d.id)) results.push(d)
        })
      } catch {
        // Fall back to local search only
      }
    }

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
  }, [documents, accessToken])

  const addDocument = useCallback((docData) => {
    const newDoc = {
      ...docData,
      id: String(Date.now()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_archived: false,
    }
    setDocuments((prev) => [newDoc, ...prev])
    return newDoc
  }, [])

  const updateDocument = useCallback((id, updates) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
      )
    )
  }, [])

  const deleteDocument = useCallback((id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const uploadFile = useCallback((file) => {
    return URL.createObjectURL(file)
  }, [])

  const addOnboardingStep = useCallback((step) => {
    const newStep = {
      ...step,
      id: String(Date.now()),
      display_order: onboardingSteps.length + 1,
      is_active: true,
    }
    setOnboardingSteps((prev) => [...prev, newStep])
  }, [onboardingSteps])

  const updateOnboardingStep = useCallback((id, updates) => {
    setOnboardingSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }, [])

  const deleteOnboardingStep = useCallback((id) => {
    setOnboardingSteps((prev) => prev.filter((s) => s.id !== id))
  }, [])

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
        driveLoading,
        driveError,
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
