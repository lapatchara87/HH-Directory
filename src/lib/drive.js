// Google Drive API service
// Uses the OAuth access token from Firebase Auth to read files from Drive

const DRIVE_API = 'https://www.googleapis.com/drive/v3'

// File type detection from MIME type
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

// Get the correct "open" URL for a file
function getOpenUrl(file) {
  const { mimeType, webViewLink, webContentLink, id } = file

  // Google Workspace files — open in their respective editors
  if (mimeType === 'application/vnd.google-apps.document') {
    return `https://docs.google.com/document/d/${id}/edit`
  }
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return `https://docs.google.com/spreadsheets/d/${id}/edit`
  }
  if (mimeType === 'application/vnd.google-apps.presentation') {
    return `https://docs.google.com/presentation/d/${id}/edit`
  }

  // Other files — use webViewLink or webContentLink
  return webViewLink || webContentLink || `https://drive.google.com/file/d/${id}/view`
}

// Format file size
function formatFileSize(bytes) {
  if (!bytes) return null
  const size = Number(bytes)
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

// Transform a Drive API file into our app's document format
function transformFile(file, categoryId = null) {
  const fileType = getFileType(file.mimeType, file.name)
  const openUrl = getOpenUrl(file)

  return {
    id: file.id,
    name: file.name,
    description: file.description || '',
    category_id: categoryId,
    file_type: fileType,
    file_url: file.webContentLink || null,
    drive_link: openUrl,
    tags: [],
    uploaded_by: file.owners?.[0]?.emailAddress || '',
    uploader_name: file.owners?.[0]?.displayName || '',
    created_at: file.createdTime || new Date().toISOString(),
    updated_at: file.modifiedTime || new Date().toISOString(),
    is_archived: file.trashed || false,
    file_size: formatFileSize(file.size),
    mime_type: file.mimeType,
    thumbnail: file.thumbnailLink || null,
    icon_link: file.iconLink || null,
  }
}

// Fetch files from a specific folder
export async function fetchFilesFromFolder(accessToken, folderId, categoryId = null) {
  const fields = 'files(id,name,mimeType,description,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,trashed,thumbnailLink,iconLink)'
  const query = `'${folderId}' in parents and trashed = false`
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=100&orderBy=modifiedTime desc`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    console.error('Drive API error:', error)
    return []
  }

  const data = await res.json()
  return (data.files || [])
    .filter((f) => f.mimeType !== 'application/vnd.google-apps.folder')
    .map((f) => transformFile(f, categoryId))
}

// Fetch all subfolders from a parent folder
export async function fetchSubFolders(accessToken, parentFolderId) {
  const query = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  const fields = 'files(id,name,mimeType)'
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=50&orderBy=name`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return []

  const data = await res.json()
  return data.files || []
}

// Fetch ALL files from a parent folder and all its subfolders (one level deep)
// Maps subfolders to categories by matching folder names
export async function fetchAllDriveFiles(accessToken, rootFolderId, categoryMapping) {
  const allDocuments = []

  // Get subfolders from root
  const subFolders = await fetchSubFolders(accessToken, rootFolderId)

  // Also get files directly in root folder
  const rootFiles = await fetchFilesFromFolder(accessToken, rootFolderId, null)
  allDocuments.push(...rootFiles)

  // Fetch files from each subfolder and map to category
  const folderPromises = subFolders.map(async (folder) => {
    // Try to match folder name to a category
    const categoryId = categoryMapping[folder.name] || categoryMapping[folder.id] || null
    const files = await fetchFilesFromFolder(accessToken, folder.id, categoryId)
    return files
  })

  const folderResults = await Promise.all(folderPromises)
  folderResults.forEach((files) => allDocuments.push(...files))

  return allDocuments
}

// Search files across entire Drive
export async function searchDriveFiles(accessToken, searchQuery) {
  const fields = 'files(id,name,mimeType,description,size,createdTime,modifiedTime,webViewLink,webContentLink,owners,trashed,thumbnailLink,iconLink,parents)'
  const query = `name contains '${searchQuery.replace(/'/g, "\\'")}' and trashed = false`
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=50&orderBy=modifiedTime desc`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return []

  const data = await res.json()
  return (data.files || []).map((f) => transformFile(f))
}
