// v2
import { useState, useRef, useEffect, useCallback } from 'react'
import { Cloud, type Mood } from './Cloud'
import { inExtension, activityState, currentPage, saveHold, restoreTab, resetActivity, declineBreak,
  pauseUntil, setPuffEnabled, setBreakTiming, TIMING_MINUTES, endOfToday, clockTime,
  heroTime, sourceLabel, pageLabel, formatAway, workStateFor, useDragHandle, type Hold } from './puff-bridge'

type Screen    = 'proactive' | 'manual' | 'confirm' | 'on_break' | 'resume' | 'pause' | 'controls'
type BreakMode = 'agent' | 'save_only' | null
type WorkState = 'fresh' | 'focused' | 'tired' | 'exhausted' | 'critical'

const WORK_STAGES: { state: WorkState; label: string; time: string }[] = [
  { state: 'fresh',     label: '☀️ Fresh',      time: '< 30 min' },
  { state: 'focused',   label: '🎯 Focused',    time: '~1h' },
  { state: 'tired',     label: '😮‍💨 Tired',    time: '~2h' },
  { state: 'exhausted', label: '🌧 Exhausted',  time: '~3h' },
  { state: 'critical',  label: '⛈ Critical',   time: '4h+' },
]

const DEMO_SCREENS: { id: Screen; label: string }[] = [
  { id: 'proactive', label: 'Proactive' },
  { id: 'manual',    label: 'Manual' },
  { id: 'confirm',   label: 'Confirm' },
  { id: 'on_break',  label: 'Away' },
  { id: 'resume',    label: 'Resume' },
  { id: 'pause',     label: 'Pause' },
  { id: 'controls',  label: 'Privacy' },
]

/** Settings the panel reflects back to the person. */
type Controls = { enabled: boolean; busyUntil: number; thresholdSeconds: number }



// ─── Cloud ────────────────────────────────────────────────────────────────────
// The character lives in Cloud.tsx. These map the prototype's screens and work states onto it.

const BASE_MOOD: Record<WorkState, Mood> = {
  fresh: 'idle', focused: 'focused', tired: 'tired', exhausted: 'very_tired', critical: 'sleepy',
}
function moodFor(workState: WorkState, screen: Screen): Mood {
  switch (screen) {
    case 'proactive': return 'nudge'
    case 'confirm':   return 'saving'
    case 'on_break':  return 'break'
    case 'resume':    return 'welcome'
    case 'pause':     return 'paused'
    default:          return BASE_MOOD[workState]
  }
}
function PuffCloud({ workState = 'fresh', screen, mood, afterRain }: {
  workState?: WorkState; screen: Screen; small?: boolean; mood?: Mood; afterRain?: boolean
}) {
  return <Cloud mood={mood ?? moodFor(workState, screen)} afterRain={afterRain} />
}
// ─── Primitives ───────────────────────────────────────────────────────────────
// Retro sticker style: a 2px ink outline and a hard offset shadow on anything you can press.

function PrimaryBtn({ children, onClick, shortcut, disabled }: {
  children: React.ReactNode; onClick?: () => void; shortcut?: string; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="puff-btn w-full h-10 bg-[#FFD66B] text-[13px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
      <span>{children}</span>
      {shortcut && <span className="puff-mono text-[10px] font-bold bg-white/60 rounded px-1.5 py-0.5 leading-none">{shortcut}</span>}
    </button>
  )
}

function SecondaryBtn({ children, onClick, shortcut }: {
  children: React.ReactNode; onClick?: () => void; shortcut?: string
}) {
  return (
    <button onClick={onClick}
      className="puff-btn w-full h-10 bg-[#DCEFFA] text-[13px] flex items-center justify-center gap-2">
      <span>{children}</span>
      {shortcut && <span className="puff-mono text-[10px] font-bold bg-white/60 rounded px-1.5 py-0.5 leading-none">{shortcut}</span>}
    </button>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="puff-mono text-[12px] text-[#5A6480] hover:text-[#34405E] transition-colors underline-offset-2 hover:underline">
      {children}
    </button>
  )
}

/** A sticker card with a strip of washi tape across the top. */
function Sticker({ bg, tape = 'rgba(249,201,214,.85)', tilt = 0, className = '', children }: {
  bg: string; tape?: string; tilt?: number; className?: string; children: React.ReactNode
}) {
  return (
    <div className={`puff-sticker ${className}`} style={{ background: bg, transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      <div className="puff-tape" style={{ background: tape }} />
      {children}
    </div>
  )
}

/** Small monospaced label, the retro-OS voice for everything that is not a headline. */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="puff-mono text-[10.5px] text-[#5A6480]">{children}</p>
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1)
  const TOTAL = 3

  const next = () => { if (step < TOTAL) setStep(s => s + 1); else onDone() }
  const skip = () => onDone()

  return (
    <div className="flex flex-col min-h-full" style={{ animation: 'fadeSlide 0.2s ease-out' }}>

      {/* ── Step content ── */}
      <div className="flex-1 px-5 pt-6 pb-4 flex flex-col items-center gap-5" key={step}
        style={{ animation: 'fadeSlide 0.18s ease-out' }}>

        {step === 1 && (
          <>
            {/* Puff, fresh + sunshine — smaller */}
            <div className="relative w-20 h-[64px] mt-2" style={{ animation: 'cloudFloat 2.4s ease-in-out infinite' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 64px 50px at 58% 38%, rgba(253,230,138,0.32) 0%, transparent 72%)' }} />
              <PuffCloud workState="fresh" screen="resume" />
            </div>

            <div className="text-center space-y-2 px-1">
              <h1 className="text-[22px] font-bold text-[#1A1A1A] tracking-tight leading-tight">
                Hi, I'm Puff ✨
              </h1>
              <p className="text-[13.5px] text-[#7A8494] leading-relaxed">
                {"I'm here to work with you — but I get tired too. Watch how I look to know when it's time to step away."}
              </p>
            </div>

            {/* Feature pills */}
            <div className="w-full space-y-1.5">
              {[
                { icon: '🌤', label: 'My mood = how long you\'ve been working' },
                { icon: '☕', label: 'I nudge you when it\'s time for a real break' },
                { icon: '📍', label: 'I save your place so stepping away feels safe' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2.5 bg-white rounded-xl border border-[#E0DAD4] px-3 py-2">
                  <span className="text-[14px]">{f.icon}</span>
                  <span className="text-[11.5px] font-medium text-[#374151] leading-snug">{f.label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center space-y-1 px-1">
              <h2 className="text-[17px] font-bold text-[#1A1A1A] tracking-tight">Stepping away, without losing your place</h2>
              <p className="text-[11.5px] text-[#7A8494]">{"Ever delayed lunch because you didn't want to lose your train of thought? That's what I'm here for."}</p>
            </div>

            {/* Flow diagram */}
            <div className="w-full space-y-1.5">
              {[
                {
                  ws: 'tired' as WorkState, sc: 'proactive' as Screen,
                  num: '1', title: 'I notice when you need a break',
                  desc: 'The longer you work, the more tired I look.',
                  bg: 'bg-[#FEF9C3]', border: 'border-[#FDE68A]/60', num_c: 'bg-[#FDE68A] text-[#854D0E]',
                },
                {
                  ws: 'focused' as WorkState, sc: 'scanning' as Screen,
                  num: '2', title: 'I capture where you are',
                  desc: 'Context and next step saved so you can fully disconnect.',
                  bg: 'bg-[#F0F9FF]', border: 'border-[#BAE6FD]/60', num_c: 'bg-[#BAE6FD] text-[#0369A1]',
                },
                {
                  ws: 'fresh' as WorkState, sc: 'resume' as Screen,
                  num: '3', title: 'You return ready to go',
                  desc: 'Your place is waiting. No re-explaining, no switching.',
                  bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]/60', num_c: 'bg-[#BBF7D0] text-[#166534]',
                },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 ${item.bg} border ${item.border} rounded-xl px-3 py-2`}>
                  <div className="w-9 h-7 flex-shrink-0">
                    <PuffCloud workState={item.ws} screen={item.sc} small />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-px">
                      <span className={`text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none ${item.num_c}`}>{item.num}</span>
                      <p className="text-[11.5px] font-semibold text-[#1A1A1A]">{item.title}</p>
                    </div>
                    <p className="text-[10.5px] text-[#7A8494] leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Privacy cloud — calm, neutral */}
            <div className="relative w-24 h-[76px]" style={{ animation: 'cloudFloat 2.8s ease-in-out infinite' }}>
              <PuffCloud workState="fresh" screen="confirm" />
            </div>

            <div className="text-center space-y-1 px-1">
              <h2 className="text-[17px] font-bold text-[#1A1A1A] tracking-tight">You stay in control</h2>
              <p className="text-[11.5px] text-[#7A8494]">I only act when you approve. Nothing runs automatically.</p>
            </div>

            <div className="w-full space-y-1.5">
              <div className="bg-white rounded-xl border border-[#E0DAD4] px-3 py-2.5 space-y-1.5">
                <p className="text-[9px] font-bold text-[#BEC6D0] uppercase tracking-widest">What I can see</p>
                {[
                  "What's visible on your current screen",
                  "How long you've been working (that's my whole vibe)",
                  'Your page or file title',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <span className="text-[#7EC8E3] font-bold text-[11px] flex-shrink-0 mt-px">✓</span>
                    <p className="text-[11px] text-[#374151] leading-snug">{t}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-[#E0DAD4] px-3 py-2.5 space-y-1.5">
                <p className="text-[9px] font-bold text-[#BEC6D0] uppercase tracking-widest">What I never do</p>
                {[
                  'Store or share your data externally',
                  'Read passwords or private fields',
                  'Run anything without your approval',
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <span className="text-[#F87171] font-bold text-[11px] flex-shrink-0 mt-px">✕</span>
                    <p className="text-[11px] text-[#374151] leading-snug">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer: dots + buttons ── */}
      <div className="px-5 pb-5 pt-2 flex flex-col gap-3 flex-shrink-0">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: TOTAL }, (_, i) => (
            <button key={i} onClick={() => setStep(i + 1)}
              className="rounded-full transition-all duration-200"
              style={{
                width:   i + 1 === step ? '18px' : '6px',
                height:  '6px',
                background: i + 1 === step ? '#7EC8E3' : '#D1D5DB',
              }} />
          ))}
        </div>

        <button onClick={next}
          className="w-full h-10 bg-[#7EC8E3] hover:bg-[#5CB5D2] active:scale-[0.98] text-white font-semibold text-[13px] rounded-xl transition-all duration-150 shadow-sm">
          {step === TOTAL ? "Let's go 🎉" : 'Next →'}
        </button>

        {step < TOTAL && (
          <div className="flex justify-center">
            <button onClick={skip}
              className="text-[11.5px] text-[#BEC6D0] hover:text-[#7A8494] transition-colors">
              Skip intro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screens ──────────────────────────────────────────────────────────────────

// Research round one: people ignore reminders that arrive mid-focus and resent ones that nag, so
// the suggestion is a small dialog that is easy to wave off, and it says why it chose this moment.
function ProactiveScreen({ workSeconds, finished, onTakeBreak, onLater, onPause }: {
  workSeconds: number; finished: boolean; onTakeBreak: () => void; onLater: () => void; onPause: () => void
}) {
  return (
    <div className="px-4 pt-2.5 pb-3.5 text-center" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="flex items-center justify-center gap-2.5">
        <div className="w-[72px] h-[60px] flex-shrink-0"><Cloud mood={finished ? 'finished' : 'nudge'} /></div>
        <div className="text-left">
          <p className="text-[24px] font-extrabold puff-ink leading-none tabular-nums tracking-tight">{heroTime(workSeconds)}</p>
          <p className="puff-mono text-[11px] text-[#5A6480] mt-1.5 leading-snug">
            {finished ? 'you just finished something ✦' : 'of steady focus'}
          </p>
        </div>
      </div>
      <p className="text-[14.5px] font-extrabold puff-ink mt-2.5">good moment for a break?</p>
      <div className="flex gap-2.5 justify-center mt-3">
        <button onClick={onTakeBreak} className="puff-btn puff-mono bg-[#FFD66B] text-[12px] px-4 h-8">BREAK</button>
        <button onClick={onLater} className="puff-btn puff-mono bg-[#DCEFFA] text-[12px] px-4 h-8">LATER</button>
      </div>
      <button onClick={onPause} className="puff-mono text-[11px] text-[#8A93A8] hover:text-[#34405E] mt-2.5 underline-offset-2 hover:underline">
        or pause for a while
      </button>
    </div>
  )
}

// ─── State 3: Pause ───────────────────────────────────────────────────────────

function PauseScreen({ onPause, onTurnOff, onBack }: {
  onPause: (until: number) => void; onTurnOff: () => void; onBack: () => void
}) {
  const option = 'puff-btn w-full text-left px-3.5 py-2.5 bg-white'
  return (
    <div className="px-4 py-3.5 flex flex-col gap-3" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-[76px] h-[64px] flex-shrink-0"><Cloud mood="paused" /></div>
        <div>
          <h2 className="text-[16px] font-extrabold puff-ink">pause puff</h2>
          <p className="text-[11.5px] text-[#5A6480] leading-snug">for meetings, deadlines, or when you want to keep going.</p>
        </div>
      </div>
      <button className={option} onClick={() => onPause(Date.now() + 60 * 60 * 1000)}>
        <span className="text-[13px]">for 1 hour</span>
      </button>
      <button className={option} onClick={() => onPause(endOfToday())}>
        <span className="text-[13px]">for the rest of today</span>
      </button>
      <button className={`${option} bg-[#FCE3EA]`} onClick={onTurnOff}>
        <span className="block text-[13px]">turn puff off</span>
        <span className="block puff-mono text-[10.5px] font-normal text-[#5A6480] mt-0.5">click the puff icon in your toolbar to turn it back on</span>
      </button>
      <div className="flex justify-center"><GhostBtn onClick={onBack}>← back</GhostBtn></div>
    </div>
  )
}

// ─── State 6: Privacy and controls ────────────────────────────────────────────

function ControlsScreen({ controls, onTiming, onPause, onResume, onTurnOff, onBack }: {
  controls: Controls
  onTiming: (minutes: number) => void
  onPause: (until: number) => void
  onResume: () => void
  onTurnOff: () => void
  onBack: () => void
}) {
  const paused = controls.busyUntil > Date.now()
  const minutes = Math.round(controls.thresholdSeconds / 60)
  const chip = (on: boolean) => `puff-btn h-8 text-[12px] ${on ? 'bg-[#FFD66B]' : 'bg-white font-medium'}`
  return (
    <div className="px-4 pt-4 pb-3.5 flex flex-col gap-4" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <Sticker bg="#DCEFFA" tilt={-1}>
        <div className="px-3 pt-3 pb-2.5 space-y-1">
          <Label>what puff notices</Label>
          <ul className="text-[12px] puff-ink leading-relaxed">
            <li>· how long you've been active at your computer</li>
            <li>· how often you click, type and scroll — counts only</li>
            <li>· when you switch tabs, save, or submit something</li>
          </ul>
        </div>
      </Sticker>
      <Sticker bg="#FCE3EA" tape="rgba(205,235,214,.9)" tilt={1}>
        <div className="px-3 pt-3 pb-2.5 space-y-1">
          <Label>what it never reads</Label>
          <ul className="text-[12px] puff-ink leading-relaxed">
            <li>· what you type, or what's on a page</li>
            <li>· tab titles and links — except the one page you save for a break</li>
          </ul>
          <p className="puff-mono text-[10.5px] text-[#5A6480] leading-snug pt-1">everything stays on this computer. puff stays quiet on video calls, payment pages and in full screen.</p>
        </div>
      </Sticker>
      <section className="space-y-2">
        <Label>suggest a break after about</Label>
        <div className="grid grid-cols-4 gap-2">
          {TIMING_MINUTES.map(m => (
            <button key={m} className={chip(m === minutes)} onClick={() => onTiming(m)}>{m}m</button>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <Label>pause</Label>
        {paused ? (
          <div className="puff-sticker bg-[#FFF4CC] flex items-center justify-between px-3 py-2">
            <span className="text-[12px] puff-ink">paused until {clockTime(controls.busyUntil)}</span>
            <GhostBtn onClick={onResume}>resume</GhostBtn>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button className={chip(false)} onClick={() => onPause(Date.now() + 60 * 60 * 1000)}>1 hour</button>
            <button className={chip(false)} onClick={() => onPause(endOfToday())}>rest of today</button>
          </div>
        )}
        <GhostBtn onClick={onTurnOff}>turn puff off</GhostBtn>
      </section>
      <div className="flex justify-center"><GhostBtn onClick={onBack}>← done</GhostBtn></div>
    </div>
  )
}

// Home: how long you have been at it is the headline. Taking a break is there, but small — the
// suggestion comes at a good moment on its own. Modelled on the glanceable status of menu-bar
// break tools and Forest's single big number, dressed as a sticker notebook.
function HomeScreen({ workState, workSeconds, todaySeconds, breaksToday, controls, onTakeBreak, onPause, onResume }: {
  workState: WorkState; workSeconds: number; todaySeconds: number; breaksToday: number
  controls: Controls; onTakeBreak: () => void; onPause: () => void; onResume: () => void
}) {
  const [petted, setPetted] = useState(false)
  const paused = !controls.enabled || controls.busyUntil > Date.now()
  const mood: Mood = petted ? 'petted' : paused ? 'paused' : BASE_MOOD[workState]
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="flex items-center gap-2">
        <div className="w-[104px] h-[88px] flex-shrink-0" onMouseEnter={() => setPetted(true)} onMouseLeave={() => setPetted(false)}>
          <Cloud mood={mood} />
        </div>
        <div className="min-w-0">
          <p className="text-[34px] font-extrabold puff-ink leading-none tabular-nums tracking-tight">{heroTime(workSeconds)}</p>
          <p className="text-[12px] text-[#5A6480] mt-2 inline-block">
            <span className="puff-highlight">{workSeconds < 60 ? 'just getting started' : 'of good focus'}</span>
          </p>
        </div>
      </div>

      {paused && (
        <div className="puff-sticker bg-[#FFF4CC] mt-3 flex items-center justify-between px-3 py-2">
          <span className="puff-mono text-[11.5px] puff-ink">
            {controls.enabled ? `paused until ${clockTime(controls.busyUntil)}` : 'puff is off'}
          </span>
          <button onClick={onResume} className="puff-mono text-[11.5px] font-bold puff-ink hover:underline underline-offset-2">resume</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Sticker bg="#DCEFFA" tilt={-2}>
          <div className="px-2.5 pt-2.5 pb-1.5">
            <Label>today</Label>
            <p className="text-[16px] font-extrabold puff-ink tabular-nums">{heroTime(todaySeconds)}</p>
          </div>
        </Sticker>
        <Sticker bg="#FCE3EA" tape="rgba(205,235,214,.9)" tilt={2}>
          <div className="px-2.5 pt-2.5 pb-1.5">
            <Label>breaks</Label>
            <p className="text-[16px] font-extrabold puff-ink tabular-nums">{breaksToday} ☕</p>
          </div>
        </Sticker>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={onTakeBreak} className="puff-btn bg-[#FFD66B] text-[12.5px] px-3.5 h-9">take a break</button>
        {!paused && <GhostBtn onClick={onPause}>pause</GhostBtn>}
      </div>
    </div>
  )
}

function ConfirmScreen({ workState, page, note, onNote, onConfirm, onBack }: {
  workState: WorkState
  page: { label: string; source: string }
  note: string
  onNote: (v: string) => void
  onConfirm: () => void
  onBack: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { e.preventDefault(); onBack() }
      if (e.code === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onConfirm() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack, onConfirm])

  return (
    <div className="px-4 pt-3 pb-4 flex flex-col gap-3.5" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="flex items-center gap-2">
        <div className="w-[76px] h-[64px] flex-shrink-0"><PuffCloud workState={workState} screen="confirm" /></div>
        <p className="puff-mono text-[11.5px] text-[#5A6480] leading-snug">i'll bookmark where you are, so coming back is easy.</p>
      </div>

      <Sticker bg="#FFF4CC" tape="rgba(191,217,238,.9)" tilt={-1}>
        <div className="px-3 pt-3 pb-2.5">
          <Label>you were working on</Label>
          <p className="text-[13.5px] font-bold puff-ink leading-snug">{page.label}</p>
          {page.source && <p className="puff-mono text-[10.5px] text-[#5A6480] mt-0.5">in {page.source}</p>}
        </div>
      </Sticker>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="puff-note" className="puff-mono text-[10.5px] text-[#5A6480]">next step · optional</label>
        <textarea
          id="puff-note"
          ref={ref}
          value={note}
          onChange={e => onNote(e.target.value.slice(0, 200))}
          rows={2}
          placeholder="review the mobile help pattern"
          className="puff-field w-full resize-none text-[13px] px-3 py-2.5 leading-relaxed placeholder:text-[#B3B9C6]"
        />
      </div>

      <PrimaryBtn onClick={onConfirm}>start my break</PrimaryBtn>
      <div className="flex justify-center -mt-1"><GhostBtn onClick={onBack}>← back</GhostBtn></div>
    </div>
  )
}

function OnBreakScreen({ hold, awaySeconds, onBack }: {
  hold: { label: string; note: string } | null
  awaySeconds: number
  onBack: () => void
}) {
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col items-center" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="w-[112px] h-[94px]"><Cloud mood="break" /></div>
      <Label>away for</Label>
      <p className="text-[34px] font-extrabold puff-ink leading-none tabular-nums tracking-tight mt-1">{formatAway(awaySeconds)}</p>

      {hold && (
        <Sticker bg="#FFF4CC" tape="rgba(191,217,238,.9)" tilt={-1} className="w-full mt-5">
          <div className="px-3 pt-3 pb-2.5">
            <Label>you were on</Label>
            <p className="text-[13px] font-bold puff-ink leading-snug">{hold.label}</p>
            {hold.note && <p className="text-[12px] text-[#5A6480] leading-snug mt-0.5">next → {hold.note}</p>}
          </div>
        </Sticker>
      )}

      <button onClick={onBack} className="puff-btn bg-[#CDEBD6] text-[12.5px] px-4 h-9 mt-4">i'm back →</button>
    </div>
  )
}

function ResumeScreen({ hold, awaySeconds, afterRain, onDone }: {
  hold: { label: string; source: string; note: string } | null
  awaySeconds: number
  afterRain: boolean
  onDone: () => void
}) {
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col items-center" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="w-[112px] h-[94px]"><Cloud mood="welcome" afterRain={afterRain} /></div>
      <h2 className="text-[21px] font-extrabold puff-ink tracking-tight mt-1">welcome back!</h2>
      <p className="text-[12px] text-[#5A6480] mt-1"><span className="puff-highlight">you were away {formatAway(awaySeconds)}</span></p>

      {hold ? (
        <Sticker bg="#FFF4CC" tape="rgba(191,217,238,.9)" tilt={-1} className="w-full mt-5">
          <div className="px-3 pt-3 pb-2.5 space-y-0.5">
            <Label>you were working on</Label>
            <p className="text-[13.5px] font-bold puff-ink leading-snug">{hold.label}</p>
            {hold.source && <p className="puff-mono text-[10.5px] text-[#5A6480]">in {hold.source}</p>}
            {hold.note && <p className="text-[12.5px] puff-ink leading-snug pt-1">next → {hold.note}</p>}
          </div>
        </Sticker>
      ) : (
        <p className="w-full puff-mono text-[11.5px] text-[#5A6480] leading-snug text-center mt-4">
          nothing was saved for this break, so there's no page to return to.
        </p>
      )}

      <div className="w-full mt-4"><PrimaryBtn onClick={onDone}>resume my work</PrimaryBtn></div>
    </div>
  )
}

function PuffLauncher({ mood, onOpen }: { mood: Mood; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const draggedRef = useRef(false)
  const drag = useDragHandle(v => { draggedRef.current = v }, setDragging)
  const shown: Mood = dragging ? 'dragged' : hovered && mood !== 'break' ? 'petted' : mood

  return (
    <div className="relative flex items-end" style={{ paddingTop: '16px' }}>
      <button
        {...drag}
        // A drag consumes the click it would otherwise produce; anything else opens the panel.
        onClick={() => { if (draggedRef.current) { draggedRef.current = false; return } onOpen() }}
        aria-label="Open Puff"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative w-[76px] h-[64px] flex items-end justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EC8E3] rounded-full"
        style={{ cursor: inExtension ? (dragging ? 'grabbing' : 'grab') : 'pointer', touchAction: 'none' }}
      >
        <Cloud mood={shown} />
      </button>
    </div>
  )
}

// Each screen is a little window with its own file name and title-bar colour, like a desk of
// open notes. The border is a real outline; the only shadow is a hard offset, which the iframe
// padding has room for.
const WINDOW: Record<Screen, { name: string; bar: string }> = {
  manual:    { name: 'puff.exe',     bar: '#BFD9EE' },
  proactive: { name: 'hey.txt',      bar: '#FCE3EA' },
  confirm:   { name: 'bookmark.doc', bar: '#FFF1C9' },
  on_break:  { name: 'away.mp3',     bar: '#CDEBD6' },
  resume:    { name: 'welcome.png',  bar: '#E3DCF5' },
  pause:     { name: 'shh.zzz',      bar: '#E3DCF5' },
  controls:  { name: 'settings.cfg', bar: '#EDE6DA' },
}

function PuffPanel({ screen, onMinimize, onControls, children }: {
  screen: Screen; onMinimize: () => void; onControls: () => void; children: React.ReactNode
}) {
  const drag = useDragHandle()
  const win = WINDOW[screen]
  return (
    <div className="puff-window w-80 puff-paper flex flex-col overflow-hidden isolate"
      style={{
        maxHeight: inExtension ? 'calc(100vh - 96px)' : 'min(720px, 92vh)',
        animation: 'panelExpand 0.2s ease-out forwards',
      }}>
      <div {...drag}
        className="flex items-center justify-between pl-3 pr-2 py-1.5 border-b-2 border-[#34405E] flex-shrink-0 select-none"
        style={{ background: win.bar, cursor: inExtension ? 'grab' : 'default', touchAction: 'none' }}>
        <span className="puff-mono text-[12px] puff-ink font-semibold">♡ {win.name}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={onControls} aria-label="Privacy and settings" className="puff-winbtn">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" />
            </svg>
          </button>
          <button onClick={onMinimize} aria-label="Minimize" className="puff-winbtn">
            <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 5 H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain" key={screen}>
        {children}
      </div>
    </div>
  )
}

// ─── Puff Found Panel ─────────────────────────────────────────────────────────

function FakeWebpage() {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: '#1E1E1E' }}>
      <div className="flex items-center gap-3 px-4 h-11 flex-shrink-0 border-b border-white/10" style={{ background: '#2C2C2C' }}>
        <div className="flex gap-1.5">
          {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white/10 text-white/50 text-[11px] px-3 py-1 rounded-md font-medium">Checkout flows — Figma</div>
        </div>
        <div className="w-6 h-6 rounded-full bg-[#7EC8E3]/80" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-14 flex-shrink-0 border-r border-white/10 flex flex-col items-center py-4 gap-5" style={{ background: '#2C2C2C' }}>
          {['M','F','⬡','P','T'].map((icon, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold cursor-pointer ${i === 0 ? 'bg-[#7EC8E3]/20 text-[#7EC8E3]' : 'text-white/30 hover:text-white/60'}`}>{icon}</div>
          ))}
        </div>
        <div className="w-44 flex-shrink-0 border-r border-white/10 flex flex-col" style={{ background: '#252525' }}>
          <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/10">Layers</div>
          <div className="p-2 space-y-0.5 text-[11px]">
            {[{ name:'Checkout exploration',indent:0,active:true},{name:'Frame: Checkout A',indent:1,active:true},{name:'Mobile form',indent:2,active:false},{name:'Help tooltip',indent:3,active:false},{name:'Frame: Checkout B',indent:1,active:false},{name:'Mobile form',indent:2,active:false},{name:'Help panel',indent:3,active:false}].map((l,i)=>(
              <div key={i} className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer truncate ${l.active?'bg-[#7EC8E3]/15 text-[#7EC8E3]':'text-white/40 hover:text-white/70'}`} style={{ paddingLeft:`${6+l.indent*10}px` }}>
                <span className="truncate">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center gap-12 overflow-hidden"
          style={{ background:'#1E1E1E', backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px' }}>
          {['Checkout A','Checkout B'].map((name,i)=>(
            <div key={name} className="flex flex-col items-center gap-2">
              <span className="text-white/30 text-[10.5px] font-medium">{name}</span>
              <div className="w-48 bg-white rounded-lg overflow-hidden shadow-2xl">
                <div className="bg-[#F8F8F8] border-b border-gray-100 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-semibold">Order summary</span>
                  <div className="w-4 h-4 rounded-full bg-gray-200" />
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="space-y-1">
                    <div className="text-[9px] text-gray-400 font-semibold">Card number</div>
                    <div className="h-7 border border-gray-200 rounded-md bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] text-gray-400 font-semibold">CVV</div>
                      {i===0?<div className="text-[8px] text-gray-400 bg-gray-100 rounded px-1 py-0.5">What's this?</div>
                             :<button className="text-[8px] text-[#7EC8E3] font-semibold">Help ›</button>}
                    </div>
                    <div className="h-7 border border-gray-200 rounded-md bg-gray-50" />
                  </div>
                  <div className="h-8 bg-[#7EC8E3] rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="w-56 flex-shrink-0 border-l border-white/10 flex flex-col" style={{ background: '#252525' }}>
          <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest border-b border-white/10">Design</div>
          <div className="p-3 space-y-3">
            {[['W','375'],['H','812'],['X','0'],['Y','0']].map(([k,v])=>(
              <div key={k} className="flex items-center justify-between">
                <span className="text-[10.5px] text-white/30">{k}</span>
                <div className="bg-white/10 text-white/50 text-[10.5px] px-2 py-0.5 rounded w-16 text-right">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="h-7 flex items-center px-4 gap-4 flex-shrink-0 border-t border-white/10" style={{ background: '#2C2C2C' }}>
        <span className="text-[10px] text-white/30">100%</span>
        <span className="text-[10px] text-white/20">·</span>
        <span className="text-[10px] text-white/30">Checkout exploration</span>
        <span className="text-[10px] text-white/20">·</span>
        <span className="text-[10px] text-[#7EC8E3]/60">2 frames selected</span>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]         = useState<Screen>(inExtension ? 'manual' : 'proactive')
  const [workState, setWorkState]   = useState<WorkState>('exhausted')
  // In the page the cloud sits quietly until the person opens it.
  // First run opens by itself so onboarding is seen; after that Puff stays tucked away until needed.
  const [isExpanded, setIsExpanded] = useState(() => {
    if (!inExtension) return true
    try { return !localStorage.getItem('puffOnboarded') } catch { return false }
  })
  const [breakMode, setBreakMode]   = useState<BreakMode>(null)
  const [customTask, setCustomTask] = useState('')
  const [onboarding, setOnboarding] = useState(() => {
    if (!inExtension) return true
    try { return localStorage.getItem('puffOnboarded') !== '1' } catch { return true }
  })


  const goTo = useCallback((s: Screen) => { setScreen(s); setIsExpanded(true) }, [])

  // The toolbar button is the way in while the cloud is tucked away.
  useEffect(() => {
    if (!inExtension) return
    const onMessage = (event: MessageEvent) => {
      if (event.source === window.parent && event.data?.type === 'PUFF_OPEN') setIsExpanded(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // A suggestion is a small card, so the host frame shrinks with it instead of covering the page.
  const compact = screen === 'proactive' && !onboarding
  useEffect(() => {
    if (!inExtension) return
    try { window.parent.postMessage({ type: 'PUFF_FRAME', expanded: isExpanded, compact }, '*') } catch { /* no host */ }
  }, [isExpanded, compact])

  // ── Local state. Nothing here leaves the browser. ──────────────────────────
  const [hold, setHold] = useState<Hold | null>(null)
  const [page, setPage] = useState<{ title: string; url: string } | null>(null)
  const [note, setNote] = useState('')
  const [awaySeconds, setAwaySeconds] = useState(0)
  const [error, setError] = useState('')
  const [workSeconds, setWorkSeconds] = useState(0)
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [breaksToday, setBreaksToday] = useState(0)
  // Whether the current suggestion came from finishing something, so the card can say so.
  const [finished, setFinished] = useState(false)
  const [controls, setControls] = useState<Controls>({ enabled: true, busyUntil: 0, thresholdSeconds: 1800 })
  const backFromControls = useRef<Screen>('manual')

  // Measured activity drives the mood, the "Working for …" pill, and the nudge.
  useEffect(() => {
    if (!inExtension) return
    let alive = true
    const tick = async () => {
      const s = await activityState()
      if (!alive || !s) return
      setWorkSeconds(s.sessionSeconds || 0)
      setWorkState(workStateFor(s.sessionSeconds || 0))
      setTodaySeconds(Math.floor(s.todaySeconds || 0))
      setBreaksToday(s.breaksToday || 0)
      setControls({ enabled: s.enabled, busyUntil: s.busyUntil || 0, thresholdSeconds: s.thresholdSeconds || 1800 })
      // A break outlives this frame: moving to another page reloads the panel, and it has to
      // pick the held place back up rather than forget that someone is away.
      if (s.mode === 'on_break' && s.checkpoint && !hold) {
        setHold(s.checkpoint)
        if (screen !== 'resume') setScreen('on_break')
        return
      }
      const busy = ['on_break', 'resume', 'confirm', 'pause', 'controls'].includes(screen)
      if (s.mode === 'gentle_nudge' && !busy) {
        setFinished(!!s.lastBoundaryAt && Date.now() - s.lastBoundaryAt < 90_000)
        setScreen('proactive'); setIsExpanded(true)
      }
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => { alive = false; clearInterval(id) }
  }, [screen, hold])

  // How long they have actually been away, counted from when the hold was saved.
  useEffect(() => {
    if (screen !== 'on_break' || !hold) return
    const tick = () => setAwaySeconds(Math.floor((Date.now() - hold.savedAt) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [screen, hold])

  const startHold = useCallback(async () => {
    setError(''); setNote('')
    setPage(await currentPage())
    goTo('confirm')
  }, [goTo])

  const confirmHold = useCallback(async () => {
    setError('')
    if (!inExtension) { setBreakMode('save_only'); goTo('on_break'); return }
    const saved = await saveHold(note)
    if (!saved) { setError('Puff could not save this page. Try again from a normal tab.'); return }
    setHold(saved)
    setBreakMode('save_only')
    goTo('on_break')
  }, [goTo, note])

  const declineHold = useCallback(async () => {
    setIsExpanded(false)
    setScreen(inExtension ? 'manual' : 'proactive')
    await declineBreak('later')
  }, [])

  const pauseFor = useCallback(async (until: number) => {
    await pauseUntil(until)
    setControls(c => ({ ...c, busyUntil: until }))
    if (screen === 'pause') { setIsExpanded(false); setScreen('manual') }
  }, [screen])

  const turnOff = useCallback(async () => {
    await setPuffEnabled(false)
    setIsExpanded(false)
    setScreen('manual')
  }, [])

  const enableAgain = useCallback(async () => {
    await setPuffEnabled(true)
    setControls(c => ({ ...c, enabled: true, busyUntil: 0 }))
  }, [])

  const chooseTiming = useCallback(async (minutes: number) => {
    await setBreakTiming(minutes)
    setControls(c => ({ ...c, thresholdSeconds: minutes * 60 }))
  }, [])

  const openControls = useCallback(() => {
    if (screen !== 'controls' && screen !== 'pause') backFromControls.current = screen
    goTo('controls')
  }, [screen, goTo])

  const handleDone = useCallback(async () => {
    // "Return to my work" must actually reopen the saved page, not just close the panel.
    if (inExtension && hold) {
      try { await restoreTab(hold) } catch (e: any) { setError(e?.message || 'Could not reopen your saved page.') }
    }
    await resetActivity()
    setWorkSeconds(0)
    setWorkState('fresh')
    setIsExpanded(false)
    setScreen(inExtension ? 'manual' : 'proactive')
    setBreakMode(null)
    setHold(null)
    setNote('')
    setAwaySeconds(0)
  }, [hold])

  // What the saved page is called, for every screen that has to name it.
  const heldPage = hold
    ? { label: pageLabel(hold.title), source: sourceLabel(hold.url), note: hold.note === hold.title ? '' : hold.note }  // older holds stored the title as the note
    : null
  const confirmPage = page
    ? { label: pageLabel(page.title), source: sourceLabel(page.url) }
    : { label: heldPage?.label || 'this page', source: heldPage?.source || '' }

  // The prototype preview has no real activity, so it shows a plausible number per work state.
  const DEMO_SECONDS: Record<WorkState, number> = { fresh: 28 * 60, focused: 62 * 60, tired: 131 * 60, exhausted: 214 * 60, critical: 287 * 60 }
  const shownSeconds = inExtension ? workSeconds : DEMO_SECONDS[workState]
  const pausedNow = !controls.enabled || controls.busyUntil > Date.now()
  const launcherMood: Mood = screen === 'on_break' ? 'break'
    : screen === 'resume' ? 'welcome'
    : pausedNow ? 'paused'
    : screen === 'proactive' && isExpanded ? 'nudge'
    : BASE_MOOD[workState]

  function renderScreen(): React.ReactNode {
    if (onboarding) return <OnboardingScreen onDone={() => { try { localStorage.setItem('puffOnboarded', '1') } catch {}; setOnboarding(false) }} />

    switch (screen) {
      case 'proactive': return <ProactiveScreen workSeconds={shownSeconds} finished={finished} onTakeBreak={startHold} onLater={declineHold} onPause={() => goTo('pause')} />
      case 'pause':     return <PauseScreen onPause={pauseFor} onTurnOff={turnOff} onBack={() => goTo('proactive')} />
      case 'controls':  return <ControlsScreen controls={controls} onTiming={chooseTiming} onPause={pauseFor} onResume={() => pauseFor(0)} onTurnOff={turnOff} onBack={() => goTo(backFromControls.current)} />
      case 'manual':    return <HomeScreen workState={workState} workSeconds={shownSeconds} todaySeconds={inExtension ? todaySeconds : 3 * 3600 + 40 * 60} breaksToday={inExtension ? breaksToday : 2}
                            controls={controls} onTakeBreak={startHold} onPause={() => goTo('pause')} onResume={() => { if (!controls.enabled) enableAgain(); else pauseFor(0) }} />
      case 'confirm':   return <ConfirmScreen workState={workState} page={confirmPage} note={note} onNote={setNote} onConfirm={confirmHold} onBack={() => goTo(screen === 'confirm' ? 'manual' : screen)} />
      // Interviews: after a short break people pick up without help, so the card only earns its
      // place after a longer one. Under five minutes, "I'm back" goes straight to the work.
      case 'on_break':  return <OnBreakScreen hold={heldPage} awaySeconds={awaySeconds} onBack={() => (awaySeconds < 300 ? handleDone() : goTo('resume'))} />
      case 'resume':    return <ResumeScreen hold={heldPage} awaySeconds={awaySeconds} afterRain={(hold?.workedSeconds ?? (inExtension ? 0 : 5400)) >= 45 * 60} onDone={handleDone} />
    }
  }

  return (
    <div className={inExtension ? 'relative w-full h-full' : 'relative w-screen h-screen overflow-hidden'}>
      {!inExtension && <FakeWebpage />}

      {/* Demo nav — screens */}
      <div hidden={inExtension} className="absolute top-14 left-[15rem] z-40 flex flex-col gap-1.5">
        <div className="flex gap-1 bg-black/40 backdrop-blur-sm rounded-xl p-1.5">
          {DEMO_SCREENS.map(s => (
            <button key={s.id} onClick={() => { setScreen(s.id); setIsExpanded(true) }}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all ${screen === s.id ? 'bg-[#7EC8E3] text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}>
              {s.label}
            </button>
          ))}
          <div className="w-px bg-white/20 mx-0.5" />
          <button onClick={() => { setOnboarding(true); setIsExpanded(true) }}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all ${onboarding ? 'bg-[#FDE68A] text-[#854D0E]' : 'text-white/40 hover:text-white/70 hover:bg-white/10'}`}>
            Onboard
          </button>
          <div className="w-px bg-white/20 mx-0.5" />
          <button onClick={() => setIsExpanded(o => !o)}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
            {isExpanded ? '–' : '+'}
          </button>
        </div>

        {/* Work state selector */}
        <div className="flex gap-1 bg-black/40 backdrop-blur-sm rounded-xl p-1.5">
          {WORK_STAGES.map(s => (
            <button key={s.state} onClick={() => setWorkState(s.state)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap ${workState === s.state ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/10'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating widget */}
      <div className={inExtension
          ? 'absolute bottom-0 right-0 flex flex-col items-end gap-2'
          : 'fixed bottom-5 right-5 flex flex-col items-end gap-2 z-50'}>
        {isExpanded && (
          <PuffPanel screen={screen} onMinimize={() => setIsExpanded(false)} onControls={openControls}>
            {renderScreen()}
          </PuffPanel>
        )}
        <PuffLauncher
          mood={launcherMood}
          onOpen={() => {
            if (!isExpanded) {
              setScreen(screen === 'on_break' || screen === 'resume' ? screen : 'manual')
              setIsExpanded(true)
            } else {
              setIsExpanded(false)
            }
          }}
        />
      </div>
    </div>
  )
}

// The design board (showcase.html) renders these screens with fixed sample data for review and export.
export { PuffPanel, HomeScreen, ProactiveScreen, ConfirmScreen, OnBreakScreen, ResumeScreen, PauseScreen, ControlsScreen }
