// User preferences stored in localStorage
// Handles bookmarks, recently viewed, and custom tags

const BOOKMARKS_KEY = 'hh_bookmarks'
const RECENT_KEY = 'hh_recently_viewed'
const TAGS_KEY = 'hh_document_tags'
const RECENT_LIMIT = 30

function getStorage(key, fallback = []) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage full or unavailable */ }
}

// === BOOKMARKS ===
export function getBookmarks() {
  return getStorage(BOOKMARKS_KEY)
}

export function isBookmarked(docId) {
  return getBookmarks().includes(docId)
}

export function toggleBookmark(docId) {
  const bookmarks = getBookmarks()
  const index = bookmarks.indexOf(docId)
  if (index >= 0) {
    bookmarks.splice(index, 1)
  } else {
    bookmarks.unshift(docId)
  }
  setStorage(BOOKMARKS_KEY, bookmarks)
  return bookmarks
}

// === RECENTLY VIEWED ===
export function getRecentlyViewed() {
  return getStorage(RECENT_KEY)
}

export function addRecentlyViewed(docId) {
  let recent = getRecentlyViewed()
  recent = recent.filter((id) => id !== docId)
  recent.unshift(docId)
  if (recent.length > RECENT_LIMIT) recent = recent.slice(0, RECENT_LIMIT)
  setStorage(RECENT_KEY, recent)
  return recent
}

// === CUSTOM TAGS ===
// Stored as { docId: ['tag1', 'tag2'] }
export function getAllTags() {
  return getStorage(TAGS_KEY, {})
}

export function getTagsForDoc(docId) {
  return getAllTags()[docId] || []
}

export function setTagsForDoc(docId, tags) {
  const allTags = getAllTags()
  allTags[docId] = tags
  setStorage(TAGS_KEY, allTags)
  return allTags
}

export function addTagToDoc(docId, tag) {
  const tags = getTagsForDoc(docId)
  if (!tags.includes(tag)) {
    tags.push(tag)
    setTagsForDoc(docId, tags)
  }
  return tags
}

export function removeTagFromDoc(docId, tag) {
  const tags = getTagsForDoc(docId).filter((t) => t !== tag)
  setTagsForDoc(docId, tags)
  return tags
}

// Get all unique tags across all documents
export function getAllUniqueTags() {
  const allTags = getAllTags()
  const tagSet = new Set()
  Object.values(allTags).forEach((tags) => tags.forEach((t) => tagSet.add(t)))
  return [...tagSet].sort()
}

// Find documents that have a specific tag
export function getDocIdsByTag(tag) {
  const allTags = getAllTags()
  return Object.entries(allTags)
    .filter(([, tags]) => tags.includes(tag))
    .map(([docId]) => docId)
}
