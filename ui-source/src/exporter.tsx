// Renders everything the Figma style guide needs as separate, labelled pieces: each screen on its
// own, animation keyframes (every CSS animation paused at a chosen moment), and Puff in context on
// a web page. scripts/export-figma.py screenshots this page and crops each [data-export] element.
// Not part of the extension.
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Cloud, type Mood, type Season } from './Cloud'
import { PuffPanel, OnboardingScreen, HomeScreen, ProactiveScreen, ConfirmScreen, OnBreakScreen, ResumeScreen, PauseScreen, ControlsScreen, PuffLauncher } from './App'

const noop = () => {}
const controls = { enabled: true, busyUntil: 0, thresholdSeconds: 1800 }
const paused = { ...controls, busyUntil: new Date().setHours(16, 30, 0, 0) + 24 * 3600 * 1000 }
const hold = { label: 'Registration flow', source: 'Figma', note: 'Review the mobile help pattern' }

function Piece({ name, children, pad = 16 }: { name: string; children: React.ReactNode; pad?: number }) {
  return <div data-export={name} style={{ display: 'inline-block', padding: pad, verticalAlign: 'top' }}>{children}</div>
}

// ─── Screens ──────────────────────────────────────────────────────────────────
const SCREENS: [string, React.ReactNode][] = [
  ...[1, 2, 3].map(n => [`screen-00-readme-${n}`, <PuffPanel screen="manual" file={{ name: 'readme.txt', bar: '#FFF4CC' }} onMinimize={noop} onControls={noop}><OnboardingScreen start={n} minutes={30} onTiming={noop} onDone={noop} /></PuffPanel>] as [string, React.ReactNode]),
  ['screen-01-home', <PuffPanel screen="manual" onMinimize={noop} onControls={noop} mute={{ muted: false, onClick: noop }}><HomeScreen workState="tired" workSeconds={2580} todaySeconds={13200} breaksToday={2} controls={controls} onTakeBreak={noop} onResume={noop} /></PuffPanel>],
  ['screen-02-home-paused', <PuffPanel screen="manual" onMinimize={noop} onControls={noop} mute={{ muted: true, onClick: noop }}><HomeScreen workState="focused" workSeconds={1500} todaySeconds={13200} breaksToday={2} controls={paused} onTakeBreak={noop} onResume={noop} /></PuffPanel>],
  ['screen-03-suggestion-finished', <PuffPanel screen="proactive" onMinimize={noop} onControls={noop} mute={{ muted: false, onClick: noop }}><ProactiveScreen workSeconds={2880} why="finished" onTakeBreak={noop} onLater={noop} /></PuffPanel>],
  ['screen-04-suggestion-quiet', <PuffPanel screen="proactive" onMinimize={noop} onControls={noop} mute={{ muted: false, onClick: noop }}><ProactiveScreen workSeconds={2880} why="pause" onTakeBreak={noop} onLater={noop} /></PuffPanel>],
  ['screen-04b-suggestion-overdue', <PuffPanel screen="proactive" onMinimize={noop} onControls={noop} mute={{ muted: false, onClick: noop }}><ProactiveScreen workSeconds={4620} why="overdue" onTakeBreak={noop} onLater={noop} /></PuffPanel>],
  ['screen-05-hold-your-place', <PuffPanel screen="confirm" onMinimize={noop} onControls={noop}><ConfirmScreen workState="tired" page={{ label: hold.label, source: hold.source }} note="" onNote={noop} onConfirm={noop} onBack={noop} /></PuffPanel>],
  ['screen-06-on-a-break', <PuffPanel screen="on_break" onMinimize={noop} onControls={noop}><OnBreakScreen hold={hold} awaySeconds={420} onBack={noop} /></PuffPanel>],
  ['screen-07-welcome-back', <PuffPanel screen="resume" onMinimize={noop} onControls={noop}><ResumeScreen hold={hold} awaySeconds={900} afterRain onDone={noop} /></PuffPanel>],
  ['screen-08-pause', <PuffPanel screen="pause" onMinimize={noop} onControls={noop}><PauseScreen onPause={noop} onTurnOff={noop} onBack={noop} /></PuffPanel>],
  ['screen-09-settings', <PuffPanel screen="controls" onMinimize={noop} onControls={noop}><ControlsScreen controls={controls} tuck={false} onTuck={noop} onTiming={noop} onPause={noop} onResume={noop} onTurnOff={noop} onBack={noop} /></PuffPanel>],
]

// ─── Motion keyframes ─────────────────────────────────────────────────────────
// Moments chosen per animation so the sheet shows its extremes (a blink, the top of a hop, the
// widest yawn), not six arbitrary slices.
export const KEYFRAMES: { id: string; mood: Mood; season?: Season; afterRain?: boolean; t: number[] }[] = [
  { id: 'idle', mood: 'idle', t: [0, 0.6, 1.2, 1.8, 2.4, 3.38] },
  { id: 'focused', mood: 'focused', t: [0, 0.55, 1.1, 1.65, 2.2, 3.0] },
  { id: 'tired', mood: 'tired', t: [0, 1.1, 2.25, 3.0, 3.7, 4.3] },
  { id: 'very_tired', mood: 'very_tired', t: [0, 0.8, 1.6, 2.0, 2.5, 3.0] },
  { id: 'sleepy', mood: 'sleepy', t: [0, 0.5, 1.0, 1.5, 2.0, 2.5] },
  { id: 'nudge', mood: 'nudge', t: [0, 0.27, 0.53, 0.8, 1.07, 1.33] },
  { id: 'pleading', mood: 'pleading', t: [0, 0.5, 0.9, 1.3, 1.7, 2.1] },
  { id: 'finished', mood: 'finished', t: [0, 0.3, 0.6, 0.9, 1.2, 1.5] },
  { id: 'saving', mood: 'saving', t: [0, 0.33, 0.67, 1.0, 1.33, 1.67] },
  { id: 'break', mood: 'break', season: 'autumn', t: [0, 1.0, 2.0, 3.5, 4.0, 4.6] },
  { id: 'paused', mood: 'paused', t: [0, 0.47, 0.93, 1.4, 1.87, 2.33] },
  { id: 'welcome', mood: 'welcome', afterRain: true, t: [0, 0.3, 0.6, 0.9, 1.2, 1.5] },
  { id: 'dragged', mood: 'dragged', t: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
  { id: 'petted', mood: 'petted', t: [0, 0.2, 0.4, 0.6, 0.8, 1.0] },
  { id: 'season-spring', mood: 'break', season: 'spring', t: [0.5, 1.5, 2.5, 3.5] },
  { id: 'season-summer', mood: 'break', season: 'summer', t: [0.5, 1.5, 2.5, 3.5] },
  { id: 'season-autumn', mood: 'break', season: 'autumn', t: [0.5, 1.5, 2.5, 3.5] },
  { id: 'season-winter', mood: 'break', season: 'winter', t: [0.5, 1.5, 2.5, 3.5] },
]

/** Freezes every CSS animation inside the element at time t, keeping each element's own offset. */
function Frozen({ t, children }: { t: number; children: React.ReactNode }) {
  return <div className="frozen" data-t={t} style={{ width: 150, height: 125 }}>{children}</div>
}

function freezeAll() {
  document.querySelectorAll<HTMLElement>('.frozen').forEach(box => {
    const t = Number(box.dataset.t)
    box.querySelectorAll<SVGElement | HTMLElement>('*').forEach(el => {
      const cs = getComputedStyle(el)
      if (cs.animationName === 'none') return
      const own = parseFloat(el.style.animationDelay || '0') || 0
      el.style.animationDelay = `${own - t}s`
      el.style.animationPlayState = 'paused'
    })
  })
}

// ─── In context: Puff on an ordinary web page ─────────────────────────────────
function MockPage({ children }: { children: React.ReactNode }) {
  const bar = (w: string) => <div style={{ height: 10, width: w, background: '#E7E9EE', borderRadius: 5, margin: '14px 0' }} />
  return (
    <div style={{ width: 1280, height: 800, position: 'relative', overflow: 'hidden', background: '#F1F3F4', fontFamily: 'system-ui' }}>
      <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #DADCE0', display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#4C8BF5' }} />
        <div style={{ font: '500 15px system-ui', color: '#3C4043' }}>Registration flow — research notes</div>
      </div>
      <div style={{ height: 40, background: '#fff', borderBottom: '1px solid #DADCE0' }} />
      <div style={{ width: 680, margin: '28px auto', background: '#fff', minHeight: 900, boxShadow: '0 1px 3px rgba(0,0,0,.12)', padding: '56px 72px' }}>
        <div style={{ font: '600 26px system-ui', color: '#202124' }}>Registration flow</div>
        <div style={{ font: '14px system-ui', color: '#5F6368', margin: '8px 0 20px' }}>Mobile help pattern — findings so far</div>
        {['100%', '96%', '88%', '92%', '60%'].map((w, i) => <div key={i}>{bar(w)}</div>)}
        <div style={{ height: 16 }} />
        {['94%', '90%', '97%', '70%'].map((w, i) => <div key={i}>{bar(w)}</div>)}
        <div style={{ height: 16 }} />
        {['99%', '85%', '92%', '45%'].map((w, i) => <div key={i}>{bar(w)}</div>)}
      </div>
      {children}
    </div>
  )
}

/** The extension's corner: panel above, cloud below, anchored bottom-right like the real host. */
function Corner({ panel, mood }: { panel?: React.ReactNode; mood: Mood }) {
  return (
    <div style={{ position: 'absolute', right: 26, bottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, padding: 24 }}>
      {panel}
      <PuffLauncher mood={mood} onOpen={noop} />
    </div>
  )
}

const SCENES: [string, React.ReactNode][] = [
  ['context-1-working', <MockPage><Corner mood="focused" /></MockPage>],
  ['context-2-open', <MockPage><Corner mood="tired" panel={<PuffPanel screen="manual" onMinimize={noop} onControls={noop} mute={{ muted: false, onClick: noop }}><HomeScreen workState="tired" workSeconds={2580} todaySeconds={13200} breaksToday={2} controls={controls} onTakeBreak={noop} onResume={noop} /></PuffPanel>} /></MockPage>],
  ['context-3-suggestion', <MockPage><Corner mood="nudge" panel={<PuffPanel screen="proactive" onMinimize={noop} onControls={noop} mute={{ muted: false, onClick: noop }}><ProactiveScreen workSeconds={2880} why="finished" onTakeBreak={noop} onLater={noop} /></PuffPanel>} /></MockPage>],
  ['context-4-on-a-break', <MockPage><Corner mood="break" panel={<PuffPanel screen="on_break" onMinimize={noop} onControls={noop}><OnBreakScreen hold={hold} awaySeconds={420} onBack={noop} /></PuffPanel>} /></MockPage>],
  ['context-5-welcome-back', <MockPage><Corner mood="welcome" panel={<PuffPanel screen="resume" onMinimize={noop} onControls={noop}><ResumeScreen hold={hold} awaySeconds={900} afterRain onDone={noop} /></PuffPanel>} /></MockPage>],
]

function Exporter() {
  const kind = new URLSearchParams(location.search).get('kind') || 'screens'
  useEffect(() => {
    if (kind === 'frames') freezeAll()
    // Screens and frames export with a transparent background so they drop cleanly onto any Figma canvas.
    if (kind !== 'context') document.body.style.background = 'transparent'
    // In use a tall screen scrolls inside the window; the style guide shows all of it.
    if (kind === 'screens') document.head.insertAdjacentHTML('beforeend', '<style>.puff-window{max-height:none!important}</style>')
    // The export script reads these bounds back through --dump-dom.
    const bounds = [...document.querySelectorAll<HTMLElement>('[data-export]')].map(el => {
      const r = el.getBoundingClientRect()
      return { name: el.dataset.export, x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.ceil(r.width), h: Math.ceil(r.height) }
    })
    const out = document.createElement('pre')
    out.id = 'bounds'
    out.style.display = 'none'
    out.textContent = JSON.stringify(bounds)
    document.body.appendChild(out)
  }, [kind])

  if (kind === 'screens') return <div style={{ width: 400 }}>{SCREENS.map(([n, el]) => <Piece key={n} name={n}>{el}</Piece>)}</div>
  if (kind === 'context') return <div>{SCENES.map(([n, el]) => <Piece key={n} name={n} pad={0}>{el}</Piece>)}</div>
  return (
    <div>
      {KEYFRAMES.flatMap(k => k.t.map((t, i) => (
        <Piece key={`${k.id}-${i}`} name={`frame-${k.id}-${i + 1}-t${t}`} pad={8}>
          <Frozen t={t}><Cloud mood={k.mood} season={k.season} afterRain={k.afterRain} /></Frozen>
        </Piece>
      )))}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Exporter />)
