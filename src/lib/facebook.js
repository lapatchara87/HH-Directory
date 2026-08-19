// Facebook comment aggregation helpers
// ดึงคอมเม้นของโพสต์บนเพจผ่าน Graph API แล้วแปลงเป็นแถวตาราง
// หมายเหตุ: ต้องใช้ Page Access Token ของเพจที่เราเป็นแอดมินเท่านั้น
// (pages_read_engagement + pages_read_user_content)

export const DEFAULT_GRAPH_VERSION = import.meta.env.VITE_FB_GRAPH_VERSION || 'v23.0'
export const MAX_COMMENTS = 5000
export const PAGE_SIZE = 100

const FB_HOSTS = /(^|\.)(facebook\.com|fb\.com)$/i
const keywordSet = new Set(['posts', 'videos', 'photos', 'photo', 'reel', 'reels', 'watch', 'video'])

// === ERRORS ===
export class FacebookError extends Error {
  constructor(message, { hint, code, raw } = {}) {
    super(message)
    this.name = 'FacebookError'
    this.hint = hint
    this.code = code
    this.raw = raw
  }
}

// แปลง error จาก Graph API เป็นข้อความไทยที่อ่านรู้เรื่อง
function translateGraphError(error) {
  const code = error?.code
  const sub = error?.error_subcode
  const raw = error?.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก'

  if (code === 190) {
    return new FacebookError('Access Token ไม่ถูกต้องหรือหมดอายุแล้ว', {
      hint: 'สร้าง Page Access Token ใหม่จาก Graph API Explorer แล้ววางใหม่อีกครั้ง',
      code,
      raw,
    })
  }
  if (code === 10 || code === 200 || sub === 33) {
    return new FacebookError('Token นี้ไม่มีสิทธิ์อ่านคอมเม้นของโพสต์นี้', {
      hint: 'ต้องเป็น Page Access Token ของเพจเจ้าของโพสต์ และขอสิทธิ์ pages_read_engagement + pages_read_user_content',
      code,
      raw,
    })
  }
  if (code === 100) {
    return new FacebookError('Facebook หาโพสต์นี้ไม่เจอ หรือ ID ไม่ถูกต้อง', {
      hint: 'ลองใช้ปุ่ม "เลือกจากโพสต์ล่าสุดของเพจ" เพื่อหยิบ ID ที่ถูกต้อง (ลิงก์แบบ pfbid ใช้กับ Graph API ไม่ได้)',
      code,
      raw,
    })
  }
  if (code === 4 || code === 17 || code === 32 || code === 613) {
    return new FacebookError('ถูกจำกัดจำนวนการเรียก API (rate limit) ชั่วคราว', {
      hint: 'รอสักพักแล้วลองใหม่ หรือลดจำนวนคอมเม้นสูงสุดที่ดึงต่อครั้ง',
      code,
      raw,
    })
  }
  return new FacebookError(raw, { code, raw })
}

// === URL PARSING ===
// คืนค่า { objectId } เมื่อได้ ID ครบ, { pageRef, postId } เมื่อต้อง resolve ชื่อเพจก่อน
// หรือ { error, hint } เมื่อลิงก์ใช้ไม่ได้
export function parsePostTarget(raw) {
  const input = (raw || '').trim()
  if (!input) return { error: 'ยังไม่ได้ใส่ลิงก์โพสต์' }

  // วาง ID ตรงๆ ได้เลย เช่น 1234567890 หรือ 1234567890_9876543210
  if (/^\d+(_\d+)?$/.test(input)) return { objectId: input }

  let url
  try {
    url = new URL(input.startsWith('http') ? input : `https://${input}`)
  } catch {
    return { error: 'รูปแบบลิงก์ไม่ถูกต้อง', hint: 'วางลิงก์โพสต์แบบเต็ม หรือวาง Post ID เป็นตัวเลขก็ได้' }
  }

  if (url.hostname.toLowerCase() === 'fb.watch') {
    return {
      error: 'ลิงก์ย่อ fb.watch ใช้ตรงๆ ไม่ได้',
      hint: 'เปิดลิงก์ในเบราว์เซอร์ก่อน แล้วคัดลอกลิงก์เต็มจากช่อง address bar มาวางแทน',
    }
  }
  if (!FB_HOSTS.test(url.hostname)) {
    return { error: 'ลิงก์นี้ไม่ใช่ลิงก์ของ Facebook', hint: 'รองรับเฉพาะลิงก์ facebook.com เท่านั้น' }
  }

  const q = url.searchParams
  const segments = url.pathname.split('/').filter(Boolean)

  // permalink.php?story_fbid=...&id=... , story.php?...
  const storyFbid = q.get('story_fbid')
  const ownerId = q.get('id')
  if (storyFbid && /^\d+$/.test(storyFbid)) {
    return { objectId: ownerId && /^\d+$/.test(ownerId) ? `${ownerId}_${storyFbid}` : storyFbid }
  }
  // photo.php?fbid=... , /photo/?fbid=...
  const fbid = q.get('fbid')
  if (fbid && /^\d+$/.test(fbid)) return { objectId: fbid }
  // /watch/?v=...
  const v = q.get('v')
  if (v && /^\d+$/.test(v)) return { objectId: v }

  // ลิงก์แบบแชร์ /share/p/xxxx
  if (segments[0] === 'share') {
    return {
      error: 'ลิงก์แบบ /share/ ใช้กับ Graph API ไม่ได้',
      hint: 'เปิดลิงก์ในเบราว์เซอร์ก่อน แล้วคัดลอกลิงก์เต็มของโพสต์มาวางแทน',
    }
  }

  // pfbid เป็น ID แบบเข้ารหัสที่ Graph API ถอดกลับไม่ได้
  // แต่ permalink_url ของโพสต์ในเพจมี pfbid อยู่ จึงไล่จับคู่หาโพสต์ให้เองได้
  const pfbid = segments.find((s) => s.startsWith('pfbid')) || q.get('story_fbid')
  if (pfbid && pfbid.startsWith('pfbid')) {
    const owner = segments[0] && !keywordSet.has(segments[0]) ? decodeURIComponent(segments[0]) : null
    if (owner) return { pageRef: owner, pfbid }
    return {
      error: 'ลิงก์นี้ไม่มีชื่อเพจอยู่ในลิงก์ ระบบเลยหาโพสต์ให้ไม่ได้',
      hint: 'ใช้ปุ่ม "เลือกจากโพสต์ล่าสุดของเพจ" แล้วเลือกโพสต์ที่ต้องการ',
    }
  }

  const idx = segments.findIndex((s) => keywordSet.has(s))

  if (idx >= 0) {
    // เอาเลขตัวสุดท้ายในเส้นทางเป็น object id เช่น /page/videos/slug/123456
    const tail = segments.slice(idx + 1).filter((s) => /^\d+$/.test(s))
    const postId = tail[tail.length - 1]
    if (!postId) {
      return {
        error: 'หา Post ID ที่เป็นตัวเลขในลิงก์ไม่เจอ',
        hint: 'ใช้ปุ่ม "เลือกจากโพสต์ล่าสุดของเพจ" หรือวาง Post ID เป็นตัวเลขเอง',
      }
    }
    const pageRef = idx > 0 ? decodeURIComponent(segments[0]) : null
    if (!pageRef) return { objectId: postId }
    if (/^\d+$/.test(pageRef)) return { objectId: `${pageRef}_${postId}` }
    // ชื่อเพจแบบตัวอักษร ต้อง resolve เป็น page id ก่อน
    return { pageRef, postId }
  }

  return {
    error: 'อ่านลิงก์นี้ไม่ออก',
    hint: 'รองรับลิงก์แบบ /posts/, /videos/, /photos/, /reel/, permalink.php และการวาง Post ID ตรงๆ',
  }
}

// ดึงชื่อเพจ/ID จากลิงก์เพจ เพื่อใช้ list โพสต์ล่าสุด
export function parsePageRef(raw) {
  const input = (raw || '').trim()
  if (!input) return { error: 'ยังไม่ได้ใส่ลิงก์เพจ' }
  if (/^\d+$/.test(input)) return { pageRef: input }
  if (/^[A-Za-z0-9._-]+$/.test(input) && !input.includes('.com')) return { pageRef: input }

  let url
  try {
    url = new URL(input.startsWith('http') ? input : `https://${input}`)
  } catch {
    return { error: 'รูปแบบลิงก์เพจไม่ถูกต้อง' }
  }
  if (!FB_HOSTS.test(url.hostname)) return { error: 'ลิงก์นี้ไม่ใช่ลิงก์ของ Facebook' }

  const idFromQuery = url.searchParams.get('id')
  if (idFromQuery && /^\d+$/.test(idFromQuery)) return { pageRef: idFromQuery }

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments[0] === 'profile.php' || segments[0] === 'people') {
    return { error: 'ลิงก์นี้เป็นโปรไฟล์ส่วนตัว ไม่ใช่เพจ', hint: 'ใส่ลิงก์เพจ เช่น facebook.com/ชื่อเพจ หรือใส่ Page ID เป็นตัวเลข' }
  }
  const first = segments[0] ? decodeURIComponent(segments[0]) : ''
  if (!first || first.startsWith('pfbid')) return { error: 'หาชื่อเพจในลิงก์ไม่เจอ' }
  return { pageRef: first }
}

// === GRAPH API ===
async function graph(path, params, { token, version, signal }) {
  // ตัดช่องว่าง/บรรทัดใหม่ที่มักติดมาตอนคัดลอก Token
  const cleanToken = (token || '').trim()
  if (!cleanToken) {
    throw new FacebookError('ยังไม่ได้ใส่ Page Access Token', {
      hint: 'ดูวิธีสร้าง Token ได้ที่คู่มือด้านล่างของหน้านี้',
    })
  }
  if (cleanToken.length < 50 || /\s/.test(cleanToken)) {
    throw new FacebookError('Token ที่วางมาดูไม่ครบหรือมีอักขระแปลกปน', {
      hint: 'กลับไปที่ Graph API Explorer กดไอคอนคัดลอกข้าง Access Token แล้ววางใหม่ทั้งเส้น (ขึ้นต้นด้วย EAA)',
    })
  }

  const url = new URL(`https://graph.facebook.com/${version || DEFAULT_GRAPH_VERSION}/${path}`)
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }
  url.searchParams.set('access_token', cleanToken)

  let res
  try {
    res = await fetch(url.toString(), { signal })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new FacebookError('เชื่อมต่อ Facebook ไม่ได้', {
      hint: 'เช็คอินเทอร์เน็ต หรือส่วนขยายเบราว์เซอร์ที่บล็อกโดเมนของ Facebook',
      raw: err?.message,
    })
  }
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.error) throw translateGraphError(json?.error || { message: `HTTP ${res.status}` })
  return json
}

// แปลง { pageRef, postId } ให้เป็น object id เต็ม
const PFBID_SCAN_PAGES = 5
const PFBID_SCAN_LIMIT = 100

// ไล่ดูโพสต์ของเพจแล้วจับคู่ pfbid จาก permalink_url เพื่อหา Post ID ที่แท้จริง
async function resolvePfbid({ pageRef, pfbid }, options) {
  let after = null
  let scanned = 0

  for (let round = 0; round < PFBID_SCAN_PAGES; round += 1) {
    const res = await graph(
      `${encodeURIComponent(pageRef)}/posts`,
      { fields: 'id,permalink_url', limit: PFBID_SCAN_LIMIT, after },
      options
    )
    const posts = res?.data || []
    scanned += posts.length
    const hit = posts.find((post) => post.permalink_url?.includes(pfbid))
    if (hit?.id) return hit.id

    options.onProgress?.(scanned)
    after = res?.paging?.next ? res?.paging?.cursors?.after : null
    if (!after) break
  }

  throw new FacebookError(`หาโพสต์จากลิงก์นี้ไม่เจอในโพสต์ ${scanned} รายการล่าสุดของเพจ`, {
    hint: 'ถ้าเป็นโพสต์เก่ามาก ให้ใช้ปุ่ม "เลือกจากโพสต์ล่าสุดของเพจ" แล้วเลือกเอง',
  })
}

export async function resolveObjectId(target, options) {
  if (target.objectId) return target.objectId
  if (target.pfbid) return resolvePfbid(target, options)

  const page = await graph(encodeURIComponent(target.pageRef), { fields: 'id' }, options)
  if (!page?.id) {
    throw new FacebookError('หา Page ID จากชื่อเพจในลิงก์ไม่เจอ', {
      hint: 'ลองวาง Post ID เป็นตัวเลขแทน หรือใช้ปุ่มเลือกจากโพสต์ล่าสุดของเพจ',
    })
  }
  return `${page.id}_${target.postId}`
}

const COMMENT_FIELDS = 'id,message,created_time,from{id,name},parent{id},attachment{type}'

function normalizeComment(raw) {
  const name = raw?.from?.name?.trim() || 'ไม่ระบุชื่อ'
  let message = (raw?.message || '').trim()
  if (!message) {
    const type = raw?.attachment?.type
    message = type ? `[แนบ: ${type}]` : '[ไม่มีข้อความ]'
  }
  return {
    id: raw?.id || `${name}-${raw?.created_time || ''}`,
    name,
    message,
    createdTime: raw?.created_time || '',
    isReply: Boolean(raw?.parent?.id),
    hasAuthor: Boolean(raw?.from?.name),
  }
}

// ดึงคอมเม้นทั้งหมดของโพสต์ (ไล่ทีละหน้าจนหมดหรือจนถึง limit)
export async function fetchComments({
  input,
  token,
  version = DEFAULT_GRAPH_VERSION,
  includeReplies = false,
  limit = MAX_COMMENTS,
  signal,
  onProgress,
}) {
  const target = parsePostTarget(input)
  if (target.error) throw new FacebookError(target.error, { hint: target.hint })

  const options = { token, version, signal, onProgress }
  const objectId = await resolveObjectId(target, options)

  const comments = []
  let after = null
  let truncated = false

  do {
    const page = await graph(
      `${encodeURIComponent(objectId)}/comments`,
      {
        fields: COMMENT_FIELDS,
        filter: includeReplies ? 'stream' : 'toplevel',
        order: 'chronological',
        limit: PAGE_SIZE,
        after,
      },
      options
    )
    for (const item of page?.data || []) comments.push(normalizeComment(item))
    if (comments.length >= limit) {
      comments.length = limit
      truncated = Boolean(page?.paging?.cursors?.after)
      break
    }
    onProgress?.(comments.length)
    after = page?.paging?.next ? page?.paging?.cursors?.after : null
  } while (after)

  onProgress?.(comments.length)
  return { objectId, comments, truncated }
}

// ดึงโพสต์ล่าสุดของเพจ เอาไว้ให้ผู้ใช้เลือกเมื่อลิงก์เป็นแบบ pfbid
export async function fetchRecentPosts({ input, token, version = DEFAULT_GRAPH_VERSION, limit = 25, signal }) {
  const parsed = parsePageRef(input)
  if (parsed.error) throw new FacebookError(parsed.error, { hint: parsed.hint })

  const res = await graph(
    `${encodeURIComponent(parsed.pageRef)}/posts`,
    {
      fields: 'id,message,created_time,permalink_url,comments.summary(true).limit(0)',
      limit,
    },
    { token, version, signal }
  )
  return (res?.data || []).map((post) => ({
    id: post.id,
    message: (post.message || '(โพสต์ไม่มีข้อความ)').replace(/\s+/g, ' ').slice(0, 120),
    createdTime: post.created_time || '',
    permalink: post.permalink_url || '',
    commentCount: post.comments?.summary?.total_count ?? null,
  }))
}

// === MANUAL JSON (โหมดสำรอง: คัดลอกผลลัพธ์จาก Graph API Explorer มาวาง) ===
export function parseCommentsJson(text) {
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new FacebookError('JSON ไม่ถูกต้อง', { hint: 'คัดลอกผลลัพธ์ทั้งก้อนจาก Graph API Explorer มาวางอีกครั้ง' })
  }
  const data = Array.isArray(json)
    ? json
    : json?.data || json?.comments?.data || json?.comments || null
  if (!Array.isArray(data)) {
    throw new FacebookError('ไม่เจอรายการคอมเม้นใน JSON นี้', {
      hint: 'ต้องเป็นก้อนที่มี key "data" เป็น array ของคอมเม้น',
    })
  }
  return data.map(normalizeComment)
}

// === EXPORT ===
export const TABLE_HEADERS = ['ลำดับ', 'ชื่อ account', 'คอมเม้น']

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCSV(rows) {
  const lines = [TABLE_HEADERS.join(',')]
  rows.forEach((row, i) => {
    lines.push([i + 1, csvCell(row.name), csvCell(row.message)].join(','))
  })
  return lines.join('\r\n')
}

// TSV สำหรับก็อปวางลง Google Sheets / Excel ได้ตรงๆ
export function toTSV(rows) {
  const clean = (value) => String(value ?? '').replace(/[\t\r\n]+/g, ' ')
  const lines = [TABLE_HEADERS.join('\t')]
  rows.forEach((row, i) => {
    lines.push([i + 1, clean(row.name), clean(row.message)].join('\t'))
  })
  return lines.join('\n')
}

export function downloadCSV(rows, filename = 'facebook-comments.csv') {
  // ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยไม่เพี้ยน
  const blob = new Blob(['﻿' + toCSV(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
