// Google Drive API service
// Automatically discovers all folders and files from user's Drive

const DRIVE_API = 'https://www.googleapis.com/drive/v3'

function getFileType(mimeType, name = '') {
  if (mimeType === 'application/vnd.google-apps.document') return 'google_doc'
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'google_sheet'
  if (mimeType === 'application/vnd.google-apps.presentation') return 'google_slide'
  if (mimeType === 'application/vnd.google-apps.folder') return 'folder'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.startsWith('video/')) return 'video'
  if (name?.match(/\.(mp4|avi|mov|mkv)$/i)) return 'video'
  return 'link'
}

function getOpenUrl(file) {
  const { mimeType, webViewLink, webContentLink, id } = file
  if (mimeType === 'application/vnd.google-apps.document') return `https://docs.google.com/document/d/${id}/edit`
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return `https://docs.google.com/spreadsheets/d/${id}/edit`
  if (mimeType === 'application/vnd.google-apps.presentation') return `https://docs.google.com/presentation/d/${id}/edit`
  return webViewLink || webContentLink || `https://drive.google.com/file/d/${id}/view`
}

function formatFileSize(bytes) {
  if (!bytes) return null
  const size = Number(bytes)
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

function transformFile(file, categoryId = null, categoryName = null) {
  return {
    id: file.id,
    name: file.name,
    description: file.description || '',
    category_id: categoryId,
    category_name: categoryName,
    file_type: getFileType(file.mimeType, file.name),
    file_url: file.webContentLink || null,
    drive_link: getOpenUrl(file),
    tags: [],
    uploaded_by: file.owners?.[0]?.emailAddress || '',
    uploader_name: file.owners?.[0]?.displayName || '',
    created_at: file.createdTime || new Date().toISOString(),
    updated_at: file.modifiedTime || new Date().toISOString(),
    is_archived: file.trashed || false,
    file_size: formatFileSize(file.size),
    mime_type: file.mimeType,
    thumbnail: file.thumbnailLink || null,
  }
}

// Helper to fetch with auth
async function driveFetch(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    console.error('Drive API error:', res.status, await res.text().catch(() => ''))
    return null
  }
  return res.json()
}

// Fetch files from a folder (non-folder files only)
async function fetchFilesInFolder(accessToken, folderId, categoryId, categoryName) {
  const fields = 'files(id,name,mimeType,description,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,trashed,thumbnailLink),nextPageToken'
  const query = `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`

  let allFiles = []
  let pageToken = null

  do {
    let url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=100&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`
    if (pageToken) url += `&pageToken=${pageToken}`

    const data = await driveFetch(url, accessToken)
    if (!data) break

    const files = (data.files || []).map((f) => transformFile(f, categoryId, categoryName))
    allFiles.push(...files)
    pageToken = data.nextPageToken
  } while (pageToken)

  return allFiles
}

// Fetch subfolders from a parent
async function fetchFolders(accessToken, parentId) {
  const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  const fields = 'files(id,name)'
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=100&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`

  const data = await driveFetch(url, accessToken)
  return data?.files || []
}

// Fetch all Shared Drives
async function fetchSharedDrives(accessToken) {
  const url = `${DRIVE_API}/drives?pageSize=100`
  const data = await driveFetch(url, accessToken)
  return data?.drives || []
}

// === MAIN FUNCTION ===
// Discovers ALL folders and files from Shared Drives + My Drive
// Returns { documents: [...], categories: [...] }
export async function discoverAllDriveContent(accessToken) {
  const allDocuments = []
  const discoveredCategories = []
  let categoryCounter = 1

  // Helper to register a folder as a category
  function registerCategory(folderId, folderName) {
    const existing = discoveredCategories.find((c) => c.folderId === folderId)
    if (existing) return existing.id
    const id = categoryCounter++
    discoveredCategories.push({
      id,
      folderId,
      name: folderName,
      slug: folderId,
    })
    return id
  }

  // 1. Fetch Shared Drives
  const sharedDrives = await fetchSharedDrives(accessToken)

  for (const drive of sharedDrives) {
    // Get top-level folders in this shared drive
    const folders = await fetchFolders(accessToken, drive.id)

    if (folders.length > 0) {
      // Each subfolder = a category
      for (const folder of folders) {
        const catId = registerCategory(folder.id, folder.name)
        const files = await fetchFilesInFolder(accessToken, folder.id, catId, folder.name)
        allDocuments.push(...files)
      }
    }

    // Also get files directly in the shared drive root (uncategorized)
    const rootFiles = await fetchFilesInFolder(accessToken, drive.id, null, drive.name)
    if (rootFiles.length > 0) {
      const catId = registerCategory(drive.id, drive.name)
      rootFiles.forEach((f) => { f.category_id = catId; f.category_name = drive.name })
      allDocuments.push(...rootFiles)
    }
  }

  // 2. Fetch My Drive top-level folders
  const myDriveFolders = await fetchFolders(accessToken, 'root')

  for (const folder of myDriveFolders) {
    const catId = registerCategory(folder.id, folder.name)
    const files = await fetchFilesInFolder(accessToken, folder.id, catId, folder.name)
    allDocuments.push(...files)
  }

  // 3. Also get loose files in My Drive root
  const myRootFiles = await fetchFilesInFolder(accessToken, 'root', null, 'My Drive')
  if (myRootFiles.length > 0) {
    const catId = registerCategory('root', 'My Drive')
    myRootFiles.forEach((f) => { f.category_id = catId; f.category_name = 'My Drive' })
    allDocuments.push(...myRootFiles)
  }

  return { documents: allDocuments, categories: discoveredCategories }
}

// Search files across entire Drive
export async function searchDriveFiles(accessToken, searchQuery) {
  const fields = 'files(id,name,mimeType,description,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,trashed,thumbnailLink)'
  const query = `name contains '${searchQuery.replace(/'/g, "\\'")}' and trashed = false`
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=50&orderBy=modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`

  const data = await driveFetch(url, accessToken)
  return (data?.files || []).map((f) => transformFile(f))
}
