import { useRef } from 'react'

declare const chrome: any

export const inExtension = typeof chrome !== 'undefined' && !!chrome?.runtime?.id

/** What Puff holds while you are away: the page you were on, and anything you wanted to remember. */
export type Hold = {
  title: string
  url: string
  tabId: number | null
  note: string
  savedAt: number
}

export type ActivityState = {
  enabled: boolean
  mode: string
  sessionSeconds: number
  rhythm: { intensity: number; scatter: number; settling: number; windows: number }
  checkpoint: Hold | null
  reason: string
}

async function send(message: Record<string, unknown>): Promise<any> {
  if (!inExtension) return null
  try {
    return await chrome.runtime.sendMessage(message)
  } catch {
    // The worker sleeps between events; a failed send is not an error worth showing anyone.
    return null
  }
}

export async function activityState(): Promise<ActivityState | null> {
  const r = await send({ type: 'GET_STATE' })
  return r?.state ?? null
}

/** The page the panel is sitting on, so it can be named before anything is saved. */
export async function currentPage(): Promise<{ title: string; url: string } | null> {
  const r = await send({ type: 'GET_PAGE' })
  return r?.page ?? null
}

/** Saves the current tab as the place to come back to. Nothing leaves the browser. */
export async function saveHold(note: string): Promise<Hold | null> {
  const r = await send({ type: 'SAVE_HOLD', note })
  return r?.hold ?? null
}

/** A real break resets the estimate; otherwise Puff keeps counting time already rested. */
export async function resetActivity(): Promise<void> {
  await send({ type: 'USER_RESPONSE', action: 'continue' })
}

/** Records that the invitation was waved off, so the cooldown and the threshold both learn. */
export async function declineBreak(action: 'later' | 'dismiss' = 'later'): Promise<void> {
  await send({ type: 'USER_RESPONSE', action })
}

/** Focuses the saved tab, or opens it again when the original tab is gone. */
export async function restoreTab(hold: Hold | null): Promise<void> {
  if (!inExtension || !hold) return
  const r = await send({ type: 'RESTORE_TAB', anchor: hold })
  if (!r?.ok) throw new Error(r?.error || 'Could not reopen your saved page.')
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
    return 'Google Docs'
  }
  if (host === 'mail.google.com') return 'Gmail'
  if (host === 'calendar.google.com') return 'Google Calendar'
  if (host.endsWith('figma.com')) return path.startsWith('/make') ? 'Figma Make' : 'Figma'
  if (host === 'github.com') return 'GitHub'
  if (host.endsWith('notion.so') || host.endsWith('notion.site')) return 'Notion'
  if (host.endsWith('linear.app')) return 'Linear'
  if (host.endsWith('stackoverflow.com')) return 'Stack Overflow'
  const name = host.split('.').slice(-2)[0] || host
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Strips the site suffix and never cuts a word in half. */
export function pageLabel(title: string, max = 40): string {
  const base = title
    .replace(/\s*[–—|·-]\s*(Google (Docs|Sheets|Slides|文档|表格)|Figma(\s+Make)?|Gmail)\s*$/i, '')
    .trim()
  if (base.length <= max) return base
  const cut = base.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return (space > max / 2 ? cut.slice(0, space) : cut) + '…'
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m} min`
}

export function formatAway(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${(m % 60).toString().padStart(2, '0')}m`
}

/** Hyeji's five stages, mapped onto measured active seconds rather than a demo constant. */
export type WorkState = 'fresh' | 'focused' | 'tired' | 'exhausted' | 'critical'
export function workStateFor(seconds: number): WorkState {
  const m = seconds / 60
  if (m < 15) return 'fresh'
  if (m < 30) return 'focused'
  if (m < 45) return 'tired'
  if (m < 60) return 'exhausted'
  return 'critical'
}

/**
 * Dragging the widget means moving the host element, which lives in the page, not here.
 * Pointer capture keeps events coming to this document once the pointer leaves the frame, so we
 * forward deltas instead of juggling pointer-events on the iframe. State lives in refs because a
 * re-render mid-drag would otherwise reset a closure and strand the gesture.
 */
export function useDragHandle(onDragged?: (dragged: boolean) => void) {
  const DRAG_THRESHOLD = 4
  const state = useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null)

  const post = (type: string, body: Record<string, number> = {}) => {
    try { window.parent.postMessage({ type, ...body }, '*') } catch { /* no host */ }
  }

  return {
    onPointerDown(e: React.PointerEvent) {
      if (!inExtension || e.button !== 0) return
      state.current = { x: e.screenX, y: e.screenY, id: e.pointerId, moved: false }
      onDragged?.(false)
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* no capture */ }
      post('PUFF_DRAG_START')
    },
    onPointerMove(e: React.PointerEvent) {
      const s = state.current
      if (!s || e.pointerId !== s.id) return
      const dx = e.screenX - s.x
      const dy = e.screenY - s.y
      if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      s.moved = true
      onDragged?.(true)
      post('PUFF_DRAG_MOVE', { dx, dy })
    },
    onPointerUp(e: React.PointerEvent) {
      const s = state.current
      if (!s) return
      try { (e.currentTarget as HTMLElement).releasePointerCapture(s.id) } catch { /* already gone */ }
      state.current = null
      post('PUFF_DRAG_END')
    },
    onPointerCancel() {
      if (!state.current) return
      state.current = null
      post('PUFF_DRAG_END')
    },
  }
}
