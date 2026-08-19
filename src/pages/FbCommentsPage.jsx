import { useMemo, useRef, useState } from 'react'
import {
  MessageSquare,
  Download,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Search,
  ListFilter,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ClipboardPaste,
} from 'lucide-react'
import {
  DEFAULT_GRAPH_VERSION,
  MAX_COMMENTS,
  fetchComments,
  fetchRecentPosts,
  parseCommentsJson,
  downloadCSV,
  toTSV,
} from '../lib/facebook'

const TOKEN_KEY = 'hh_fb_token'
const SETTINGS_KEY = 'hh_fb_settings'

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch { /* storage unavailable */ }
}

function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function FbCommentsPage() {
  const saved = useMemo(loadSettings, [])
  const [postUrl, setPostUrl] = useState('')
  const [token, setToken] = useState(loadToken)
  const [showToken, setShowToken] = useState(false)
  const [rememberToken, setRememberToken] = useState(Boolean(loadToken()))
  const [editToken, setEditToken] = useState(!loadToken())
  const [includeReplies, setIncludeReplies] = useState(saved.includeReplies ?? false)
  const [graphVersion, setGraphVersion] = useState(saved.graphVersion || DEFAULT_GRAPH_VERSION)
  const [maxComments, setMaxComments] = useState(saved.maxComments || 1000)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // { objectId, comments, truncated, source }
  const abortRef = useRef(null)

  const [filter, setFilter] = useState('')
  const [uniqueOnly, setUniqueOnly] = useState(false)
  const [copied, setCopied] = useState(false)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pageUrl, setPageUrl] = useState('')
  const [posts, setPosts] = useState([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerError, setPickerError] = useState(null)

  const [jsonOpen, setJsonOpen] = useState(false)
  const [jsonText, setJsonText] = useState('')

  const comments = useMemo(() => result?.comments || [], [result])

  const rows = useMemo(() => {
    const keyword = filter.trim().toLowerCase()
    let list = comments
    if (keyword) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(keyword) || c.message.toLowerCase().includes(keyword)
      )
    }
    if (uniqueOnly) {
      const seen = new Set()
      list = list.filter((c) => {
        const key = c.name.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
    return list
  }, [comments, filter, uniqueOnly])

  function persist(next) {
    saveSettings({ includeReplies, graphVersion, maxComments, ...next })
  }

  function handleTokenChange(value) {
    setToken(value)
    try {
      if (rememberToken) localStorage.setItem(TOKEN_KEY, value)
    } catch { /* storage unavailable */ }
  }

  function handleRememberChange(checked) {
    setRememberToken(checked)
    try {
      if (checked) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch { /* storage unavailable */ }
  }

  async function handleFetch(targetInput) {
    const input = targetInput ?? postUrl
    if (!input.trim()) {
      setError({ message: 'ใส่ลิงก์โพสต์ก่อนนะ' })
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setProgress(0)
    try {
      const data = await fetchComments({
        input,
        token,
        version: graphVersion,
        includeReplies,
        limit: Number(maxComments) || MAX_COMMENTS,
        signal: controller.signal,
        onProgress: setProgress,
      })
      setResult({ ...data, source: 'api' })
      setFilter('')
    } catch (err) {
      if (err?.name === 'AbortError') return
      setError({ message: err?.message || 'ดึงคอมเม้นไม่สำเร็จ', hint: err?.hint })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
  }

  async function handleLoadPosts() {
    setPickerLoading(true)
    setPickerError(null)
    try {
      const list = await fetchRecentPosts({ input: pageUrl, token, version: graphVersion })
      setPosts(list)
      if (!list.length) setPickerError({ message: 'ไม่เจอโพสต์ในเพจนี้' })
    } catch (err) {
      setPickerError({ message: err?.message || 'โหลดโพสต์ไม่สำเร็จ', hint: err?.hint })
      setPosts([])
    } finally {
      setPickerLoading(false)
    }
  }

  function handlePickPost(post) {
    setPostUrl(post.id)
    setPickerOpen(false)
    handleFetch(post.id)
  }

  function handleParseJson() {
    setError(null)
    try {
      const parsed = parseCommentsJson(jsonText)
      setResult({ objectId: '', comments: parsed, truncated: false, source: 'json' })
      setFilter('')
      setJsonOpen(false)
    } catch (err) {
      setError({ message: err?.message || 'อ่าน JSON ไม่สำเร็จ', hint: err?.hint })
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toTSV(rows))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError({ message: 'คัดลอกไม่สำเร็จ', hint: 'เบราว์เซอร์ไม่อนุญาตให้เข้าถึงคลิปบอร์ด ลองใช้ปุ่มดาวน์โหลด CSV แทน' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">รวมคอมเม้นจากโพสต์ Facebook</h1>
            <p className="text-sm text-slate-500">
              วางลิงก์โพสต์ของเพจ แล้วดึงคอมเม้นทั้งหมดออกมาเป็นตาราง พร้อมส่งออก CSV
            </p>
          </div>
        </div>
      </div>

      {/* Input card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">ลิงก์โพสต์ (หรือ Post ID)</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleFetch()}
              placeholder="https://www.facebook.com/ชื่อเพจ/posts/1234567890"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {loading ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                ยกเลิก
              </button>
            ) : (
              <button
                onClick={() => handleFetch()}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                ดึงคอมเม้น
              </button>
            )}
          </div>
        </div>

        {!editToken && token ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-green-800">บันทึก Page Access Token ไว้ในเครื่องนี้แล้ว</span>
            <button
              onClick={() => setEditToken(true)}
              className="ml-auto text-green-700 hover:text-green-900 font-medium"
            >
              เปลี่ยน
            </button>
          </div>
        ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Page Access Token</label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="EAAG..."
              autoComplete="off"
              className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={showToken ? 'ซ่อน token' : 'แสดง token'}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={rememberToken}
              onChange={(e) => handleRememberChange(e.target.checked)}
              className="rounded border-slate-300"
            />
            จำ Token ไว้ในเครื่องนี้ (เก็บใน localStorage — อย่าติ๊กถ้าใช้เครื่องสาธารณะ)
          </label>
          {rememberToken && token.trim() && (
            <button
              onClick={() => setEditToken(false)}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              บันทึกแล้วซ่อนช่องนี้
            </button>
          )}
        </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeReplies}
              onChange={(e) => {
                setIncludeReplies(e.target.checked)
                persist({ includeReplies: e.target.checked })
              }}
              className="rounded border-slate-300"
            />
            รวมคอมเม้นตอบกลับ (reply) ด้วย
          </label>
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <ListFilter className="w-4 h-4" />
            เลือกจากโพสต์ล่าสุดของเพจ
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 ml-auto"
          >
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            ตั้งค่าเพิ่มเติม
          </button>
        </div>

        {showAdvanced && (
          <div className="grid sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div className="pt-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Graph API version</label>
              <input
                type="text"
                value={graphVersion}
                onChange={(e) => {
                  setGraphVersion(e.target.value)
                  persist({ graphVersion: e.target.value })
                }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="sm:pt-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                จำนวนคอมเม้นสูงสุดต่อครั้ง (สูงสุด {MAX_COMMENTS})
              </label>
              <input
                type="number"
                min="1"
                max={MAX_COMMENTS}
                value={maxComments}
                onChange={(e) => {
                  const value = Math.min(Number(e.target.value) || 1, MAX_COMMENTS)
                  setMaxComments(value)
                  persist({ maxComments: value })
                }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        {/* Post picker */}
        {pickerOpen && (
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
            <p className="text-xs text-slate-500">
              ใช้เมื่อไม่มีลิงก์โพสต์อยู่ในมือ หรือระบบหาโพสต์จากลิงก์ไม่เจอ — ใส่ลิงก์เพจแล้วเลือกโพสต์จากรายการ
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !pickerLoading && handleLoadPosts()}
                placeholder="https://www.facebook.com/ชื่อเพจ หรือ Page ID"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
              <button
                onClick={handleLoadPosts}
                disabled={pickerLoading}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {pickerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                โหลดโพสต์
              </button>
            </div>
            {pickerError && (
              <p className="text-xs text-red-600">
                {pickerError.message}
                {pickerError.hint ? ` — ${pickerError.hint}` : ''}
              </p>
            )}
            {posts.length > 0 && (
              <ul className="max-h-64 overflow-y-auto divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
                {posts.map((post) => (
                  <li key={post.id}>
                    <button
                      onClick={() => handlePickPost(post)}
                      className="w-full text-left px-3 py-2 hover:bg-primary-50"
                    >
                      <p className="text-sm text-slate-800 line-clamp-2">{post.message}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(post.createdTime)}
                        {post.commentCount !== null ? ` · ${post.commentCount} คอมเม้น` : ''}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
          กำลังค้นหาโพสต์และดึงคอมเม้น... {progress > 0 ? `(${progress.toLocaleString()} รายการ)` : ''}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-800">{error.message}</p>
            {error.hint && <p className="text-red-700 mt-0.5">{error.hint}</p>}
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{rows.length.toLocaleString()}</span> รายการ
              {rows.length !== comments.length && ` (จากทั้งหมด ${comments.length.toLocaleString()})`}
              {result.truncated && (
                <span className="ml-2 text-amber-600">· ดึงถึงขีดจำกัดแล้ว ยังมีคอมเม้นเหลืออยู่</span>
              )}
            </div>
            <div className="sm:ml-auto flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="ค้นหาในตาราง..."
                  className="pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <label className="flex items-center gap-1.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={uniqueOnly}
                  onChange={(e) => setUniqueOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                1 คนต่อ 1 แถว
              </label>
              <button
                onClick={handleCopy}
                disabled={!rows.length}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
              <button
                onClick={() => downloadCSV(rows)}
                disabled={!rows.length}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              {comments.length === 0 ? 'โพสต์นี้ยังไม่มีคอมเม้น' : 'ไม่เจอคอมเม้นที่ตรงกับคำค้นหา'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium w-16">ลำดับ</th>
                    <th className="px-4 py-2.5 text-left font-medium w-56">ชื่อ account</th>
                    <th className="px-4 py-2.5 text-left font-medium">คอมเม้น</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50 align-top">
                      <td className="px-4 py-2.5 text-slate-400 tabular-nums">{index + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {row.name}
                        {row.createdTime && (
                          <span className="block text-xs font-normal text-slate-400">
                            {formatDate(row.createdTime)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 whitespace-pre-wrap break-words">
                        {row.isReply && <span className="text-slate-400 mr-1">↳</span>}
                        {row.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual JSON fallback */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => setJsonOpen(!jsonOpen)}
          className="w-full flex items-center gap-2 text-sm font-medium text-slate-700"
        >
          {jsonOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <ClipboardPaste className="w-4 h-4 text-slate-400" />
          โหมดสำรอง: วาง JSON จาก Graph API Explorer
        </button>
        {jsonOpen && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-500">
              ถ้าไม่มี Token ใช้ในเว็บนี้ ให้รัน{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">
                {'{post-id}/comments?fields=from{name},message&limit=100'}
              </code>{' '}
              ใน Graph API Explorer แล้วคัดลอกผลลัพธ์ทั้งก้อนมาวางที่นี่
            </p>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={6}
              placeholder='{ "data": [ { "from": { "name": "..." }, "message": "..." } ] }'
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleParseJson}
              disabled={!jsonText.trim()}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
            >
              แปลงเป็นตาราง
            </button>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-2">
        <p className="font-medium text-slate-800">ต้องเตรียมอะไรบ้าง</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>ต้องเป็นแอดมินของเพจเจ้าของโพสต์ (ดึงคอมเม้นจากเพจคนอื่นไม่ได้ตามนโยบายของ Facebook)</li>
          <li>
            สร้าง Page Access Token ที่{' '}
            <a
              href="https://developers.facebook.com/tools/explorer/"
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 hover:underline"
            >
              Graph API Explorer
            </a>{' '}
            โดยขอสิทธิ์ <code className="font-mono">pages_read_engagement</code> และ{' '}
            <code className="font-mono">pages_read_user_content</code>
          </li>
          <li>วางลิงก์โพสต์แบบไหนก็ได้ รวมถึงลิงก์ <code className="font-mono">pfbid</code> ที่คัดลอกจาก Facebook — ระบบจะไล่หาโพสต์ให้เอง</li>
        </ol>
        <p className="text-xs text-slate-500">
          Token ถูกใช้เรียก Facebook จากเบราว์เซอร์โดยตรง ไม่ถูกส่งไปเซิร์ฟเวอร์อื่น — ดูรายละเอียดเพิ่มที่ไฟล์
          FACEBOOK_COMMENTS.md
        </p>
      </div>
    </div>
  )
}
