// Connects Hyeji's UI to the real Puff backend through the extension's background worker.
// Nothing here invents content: every field is filled from a model or tool result.

declare const chrome: any

export const inExtension = typeof chrome !== 'undefined' && !!chrome?.runtime?.id

export type Draft = {
  id: string
  createdAt: number
  context: { figma: any; browser: { title: string; url: string; tabs?: { title: string; url: string; active?: boolean }[] } | null }
  draft: {
    interpretation: string
    nextStep: string
    proposedTask: { label: string; question: string; rationale: string }
  }
  trace: { tool: string; status: string }[]
}

export async function bridge(route: string, body?: unknown): Promise<any> {
  if (!inExtension) throw new Error('Puff must run inside the Chrome extension.')
  const r = await chrome.runtime.sendMessage({ type: 'BRIDGE', route, body })
  if (!r?.ok) throw new Error(r?.error || 'Puff could not reach its local backend.')
  return r.data
}

export async function captureContext(readContents: boolean) {
  if (!inExtension) return null
  try {
    return await chrome.runtime.sendMessage({ type: 'CAPTURE_CONTEXT', readContents })
  } catch {
    return null
  }
}

export async function activityState() {
  if (!inExtension) return null
  try {
    const r = await chrome.runtime.sendMessage({ type: 'GET_STATE' })
    return r?.state ?? null
  } catch {
    return null
  }
}

/** Chips stand for pieces of work. Mail, search and chat are personal noise, never shown. */
const NOISE = /^(mail\.google|inbox\.google|outlook\.|mail\.|www\.google\.com\/search|duckduckgo|bing\.com|x\.com|twitter\.com|facebook\.|instagram\.|youtube\.|web\.whatsapp|teams\.microsoft|slack\.com)/i

export function isWorkTab(url: string): boolean {
  try {
    const u = new URL(url)
    if (NOISE.test(u.hostname) || NOISE.test(u.hostname + u.pathname)) return false
    return true
  } catch {
    return false
  }
}

/** Names the place the work lives, so a chip reads like a source rather than a page title. */
export function sourceLabel(url: string): string {
  let u: URL
  try { u = new URL(url) } catch { return '' }
  const host = u.hostname.replace(/^www\./, '')
  const path = u.pathname
  if (host === 'docs.google.com') {
    if (path.startsWith('/document')) return 'Google Doc'
    if (path.startsWith('/spreadsheets')) return 'Google Sheet'
    if (path.startsWith('/presentation')) return 'Google Slides'
    if (path.startsWith('/forms')) return 'Google Form'
    return 'Google Docs'
  }
  if (host === 'mail.google.com') return 'Gmail'
  if (host === 'calendar.google.com') return 'Google Calendar'
  if (host === 'drive.google.com') return 'Google Drive'
  if (host.endsWith('figma.com')) return path.startsWith('/make') ? 'Figma Make' : 'Figma'
  if (host === 'github.com') return 'GitHub'
  if (host.endsWith('notion.so') || host.endsWith('notion.site')) return 'Notion'
  if (host.endsWith('slack.com')) return 'Slack'
  if (host.endsWith('linear.app')) return 'Linear'
  if (host.endsWith('stackoverflow.com')) return 'Stack Overflow'
  if (host.endsWith('wikipedia.org')) return 'Wikipedia'
  if (host.endsWith('youtube.com')) return 'YouTube'
  const name = host.split('.').slice(-2)[0] || host
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Strips the site suffix and never cuts a word in half. */
export function chipLabel(title: string): string {
  const base = title
    .replace(/\s*[–—|·-]\s*(Google (Docs|Sheets|Slides|文档|表格|搜索)|Figma(\s+Make)?|Gmail)\s*$/i, '')
    .replace(/\s*[–—|]\s*[^–—|]*$/, (m) => (title.length > 34 ? '' : m))
    .trim()
  if (base.length <= 30) return base
  const cut = base.slice(0, 30)
  const space = cut.lastIndexOf(' ')
  return (space > 14 ? cut.slice(0, space) : cut) + '…'
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m} min`
}

/** Hyeji's five stages, mapped onto measured active seconds rather than a demo constant. */
export function workStateFor(seconds: number): 'fresh' | 'focused' | 'tired' | 'exhausted' | 'critical' {
  const m = seconds / 60
  if (m < 15) return 'fresh'
  if (m < 30) return 'focused'
  if (m < 45) return 'tired'
  if (m < 60) return 'exhausted'
  return 'critical'
}

/** A real break resets the estimate; otherwise Puff keeps nagging about time already rested. */
export async function resetActivity() {
  if (!inExtension) return
  try { await chrome.runtime.sendMessage({ type: 'USER_RESPONSE', action: 'continue' }) } catch { /* worker asleep */ }
}

const CONSENT_KEY = 'puffModelConsent'
const CONTENTS_KEY = 'puffContentConsent'
const read = (k: string) => {
  try { return localStorage.getItem(k) === '1' } catch { return false }
}
const write = (k: string, v: boolean) => {
  try { localStorage.setItem(k, v ? '1' : '0') } catch { /* private mode */ }
}
export const consentGranted = () => read(CONSENT_KEY)
export const setConsent = (v: boolean) => write(CONSENT_KEY, v)
export const contentsGranted = () => read(CONTENTS_KEY)
export const setContents = (v: boolean) => write(CONTENTS_KEY, v)

/** Focuses the saved tab, or opens it again when the original tab is gone. */
export async function restoreTab(anchor: { title: string; url: string } | null, fallbackUrl?: string) {
  if (!inExtension) return
  const r = await chrome.runtime.sendMessage({ type: 'RESTORE_TAB', anchor, fileUrl: fallbackUrl })
  if (!r?.ok) throw new Error(r?.error || 'Could not reopen your saved page.')
}
