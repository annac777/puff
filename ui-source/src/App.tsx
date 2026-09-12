// v2
import { useState, useRef, useEffect, useCallback } from 'react'
import { inExtension, bridge, captureContext, activityState, chipLabel, formatDuration, workStateFor,
  consentGranted, setConsent, contentsGranted, restoreTab, isWorkTab, resetActivity, sourceLabel, type Draft } from './puff-bridge'

type Screen    = 'proactive' | 'manual' | 'scanning' | 'confirm' | 'on_break' | 'resume'
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
  { id: 'scanning',  label: 'Scanning' },
  { id: 'confirm',   label: 'Confirm' },
  { id: 'on_break',  label: 'Away' },
  { id: 'resume',    label: 'Resume' },
]

const CTX = {
  summary: 'comparing inline vs. expandable help patterns in the Checkout flow',
  frames: ['Checkout A', 'Checkout B'],
  suggestedTask: 'save a brief summary of what you found so far',
  activeTitle: '',
}
// In the extension every one of these is replaced by real agent output before the screen renders.
export function applyContext(next: { summary: string; frames: string[]; suggestedTask: string; activeTitle?: string }) {
  CTX.summary = next.summary
  CTX.frames = next.frames
  CTX.suggestedTask = next.suggestedTask
  CTX.activeTitle = next.activeTitle || ''
}


/** Pill colour follows the measured work state, so time and colour can never disagree. */
const PILL: Record<WorkState, { bg: string; border: string; text: string; dot: string }> = {
  fresh:     { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', dot: '#7EC8E3' },
  focused:   { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', dot: '#34D399' },
  tired:     { bg: '#FEF9C3', border: '#FDE68A', text: '#854D0E', dot: '#FBBF24' },
  exhausted: { bg: '#FFEDD5', border: '#FED7AA', text: '#9A3412', dot: '#FB923C' },
  critical:  { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', dot: '#F87171' },
}

// Per work-state cloud appearance
const CLOUD_COLOR: Record<WorkState, string> = {
  fresh:     '#7EC8E3',
  focused:   '#6AB5D0',
  tired:     '#8AADBF',
  exhausted: '#7595A7',
  critical:  '#5F7B8C',
}
const SHADOW_COLOR: Record<WorkState, string> = {
  fresh:     '#7EC8E3',
  focused:   '#6AB5D0',
  tired:     '#8AADBF',
  exhausted: '#7595A7',
  critical:  '#5F7B8C',
}
const FLOAT_DUR: Record<WorkState, string> = {
  fresh:     '2.2s',
  focused:   '2.6s',
  tired:     '3.6s',
  exhausted: '5s',
  critical:  '7s',
}
const FLOAT_LIFT: Record<WorkState, string> = {
  fresh:     '-8px',
  focused:   '-6px',
  tired:     '-4px',
  exhausted: '-2px',
  critical:  '-1px',
}

// ─── Cloud SVG ────────────────────────────────────────────────────────────────

function PuffCloud({
  workState = 'fresh',
  screen,
  small = false,
}: {
  workState?: WorkState
  screen: Screen
  small?: boolean
}) {
  const uid = screen.replace(/_/g, '') + (small ? 's' : 'f') + workState

  const fill   = screen === 'resume' ? '#7EC8E3' : CLOUD_COLOR[workState]
  const shadow = screen === 'resume' ? '#7EC8E3' : SHADOW_COLOR[workState]

  const isSleeping = screen === 'on_break'
  const isScanning = screen === 'scanning'
  const isResume   = screen === 'resume'
  const isProactive = screen === 'proactive'

  // Cloud body gets slightly heavier / puffier as tired
  const sag = { fresh: 0, focused: 0.5, tired: 1.2, exhausted: 2, critical: 2.8 }[workState]

  return (
    <svg viewBox="0 0 100 80" className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <filter id={`sh-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy={small ? 3 : 4} stdDeviation={small ? 6 : 4}
            floodColor={shadow} floodOpacity={small ? 0.38 : 0.26} />
        </filter>
        {small && (
          <filter id={`leg-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="white" floodOpacity="0.95" />
          </filter>
        )}
        {/* eyelid clip zones */}
        <clipPath id={`lid-l-${uid}`}>
          <rect x="34" y={42 + (workState === 'tired' ? 0 : workState === 'exhausted' ? 2.2 : workState === 'critical' ? 3.6 : -10)} width="13" height="12" />
        </clipPath>
        <clipPath id={`lid-r-${uid}`}>
          <rect x="54" y={42 + (workState === 'tired' ? 0 : workState === 'exhausted' ? 2.2 : workState === 'critical' ? 3.6 : -10)} width="13" height="12" />
        </clipPath>
      </defs>

      {/* ── ATMOSPHERE per screen ── */}

      {/* proactive / resume: sun */}
      {(isProactive || isResume) && (
        <g style={{ animation: 'sunReveal 0.4s ease-out forwards' }} opacity="0">
          {[
            [isResume ? 79 : 83, isResume ? 1 : 3,   isResume ? 79 : 83, isResume ? -6 : -3],
            [isResume ? 88 : 91, isResume ? 4 : 6,   isResume ? 92 : 95, isResume ? -2 : 1],
            [isResume ? 93 : 96, isResume ? 13 : 14, isResume ? 100 : 102, isResume ? 10 : 12],
            [isResume ? 91 : 91, isResume ? 23 : 22, isResume ? 97 : 96,  isResume ? 27 : 27],
            [isResume ? 70 : 74, isResume ? 4 : 5,   isResume ? 67 : 71, isResume ? -2 : -1],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#FDE68A" strokeWidth={isResume ? 2.2 : 2} strokeLinecap="round"
              opacity={isResume ? [0.9,0.84,0.80,0.65,0.65][i] : [0.8,0.72,0.65,0.5,0.52][i]} />
          ))}
          <circle cx={isResume ? 79 : 83} cy={isResume ? 12 : 13} r={isResume ? 13 : 10}
            fill="#FDE68A" opacity={isResume ? 0.9 : 0.85} />
          {isResume && <ellipse cx="50" cy="75" rx="36" ry="6" fill="#FDE68A" opacity="0.2" />}
        </g>
      )}

      {/* scanning: gathering wisps */}
      {isScanning && !small && (
        <>
          <ellipse cx="13" cy="28" rx="10" ry="2.5" fill="#BAE6FD" opacity="0.5"
            style={{ animation: 'gatherL 1.4s ease-in-out infinite 0s', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <ellipse cx="87" cy="34" rx="9" ry="2.5" fill="#BAE6FD" opacity="0.42"
            style={{ animation: 'gatherR 1.4s ease-in-out infinite 0.35s', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <ellipse cx="11" cy="55" rx="10" ry="2" fill="#BAE6FD" opacity="0.32"
            style={{ animation: 'gatherL 1.4s ease-in-out infinite 0.7s', transformBox: 'fill-box', transformOrigin: 'center' }} />
        </>
      )}

      {/* on_break: floating wind wisps */}
      {isSleeping && !small && (
        <>
          <ellipse cx="0" cy="63" rx="11" ry="2.5" fill="#BAE6FD" opacity="0.48"
            style={{ animation: 'windDrift 2.4s linear infinite 0s' }} />
          <ellipse cx="0" cy="69" rx="9"  ry="2"   fill="#BAE6FD" opacity="0.34"
            style={{ animation: 'windDrift 2.4s linear infinite 0.8s' }} />
          <ellipse cx="0" cy="56" rx="8"  ry="2"   fill="#BAE6FD" opacity="0.26"
            style={{ animation: 'windDrift 2.4s linear infinite 1.6s' }} />
        </>
      )}

      {/* ── WORK-STATE ATMOSPHERE ── */}

      {/* tired+: sweat drop */}
      {(workState === 'tired' || workState === 'exhausted' || workState === 'critical') && !isSleeping && !isResume && (
        <g style={{ animation: 'sweatDrop 2.8s ease-in-out infinite' }}>
          <ellipse cx="79" cy="26" rx="2.2" ry="3.2" fill="#BAE6FD" opacity="0.7" />
          <ellipse cx="79" cy="23.4" rx="2.2" ry="1.4" fill="#BAE6FD" opacity="0.7" />
        </g>
      )}

      {/* exhausted+: two raindrops */}
      {(workState === 'exhausted' || workState === 'critical') && !isSleeping && !isResume && (
        <g style={{ animation: 'rainFall 1.8s linear infinite' }}>
          <ellipse cx="32" cy="76" rx="1.4" ry="2.8" fill="#7EC8E3" opacity="0.5" />
          <ellipse cx="50" cy="79" rx="1.4" ry="2.8" fill="#7EC8E3" opacity="0.45"
            style={{ animationDelay: '0.6s' }} />
        </g>
      )}

      {/* critical: third drop + dark storm wisp */}
      {workState === 'critical' && !isSleeping && !isResume && (
        <>
          <g style={{ animation: 'rainFall 1.8s linear infinite', animationDelay: '1.1s' }}>
            <ellipse cx="68" cy="76" rx="1.4" ry="2.8" fill="#7EC8E3" opacity="0.4" />
          </g>
          <ellipse cx="22" cy="24" rx="14" ry="3.5" fill="#4A6A7A" opacity="0.22"
            style={{ animation: 'gatherL 2s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
          <ellipse cx="80" cy="29" rx="11" ry="3" fill="#4A6A7A" opacity="0.18"
            style={{ animation: 'gatherR 2s ease-in-out infinite 0.7s', transformBox: 'fill-box', transformOrigin: 'center' }} />
        </>
      )}

      {/* ── CLOUD BODY ── */}
      {small && (
        <g filter={`url(#leg-${uid})`}>
          <g fill={fill}>
            <ellipse cx="50" cy={57 + sag} rx="37" ry={19 + sag * 0.3} />
            <circle cx="25" cy={42 + sag * 0.4} r={16 + sag * 0.2} />
            <circle cx="50" cy={32 + sag * 0.3} r={20 + sag * 0.2} />
            <circle cx="73" cy={42 + sag * 0.4} r={15 + sag * 0.2} />
          </g>
        </g>
      )}
      <g filter={`url(#sh-${uid})`}>
        <g fill={fill}>
          <ellipse cx="50" cy={57 + sag} rx="37" ry={19 + sag * 0.3} />
          <circle cx="25" cy={42 + sag * 0.4} r={16 + sag * 0.2} />
          <circle cx="50" cy={32 + sag * 0.3} r={20 + sag * 0.2} />
          <circle cx="73" cy={42 + sag * 0.4} r={15 + sag * 0.2} />
        </g>
      </g>

      {/* Ground shadow — gets heavier as tired */}
      <ellipse cx="50" cy={72 + sag}
        rx={32 + sag * 2} ry={4.5 + sag * 0.5}
        fill="rgba(0,0,0,0.05)" />

      {/* ── EYES ── */}

      {isSleeping ? (
        /* Sleeping arcs */
        <g>
          <path d="M 35.5 42 Q 40 37.5 44.5 42" stroke="#1A4658" strokeWidth="2.3" fill="none" strokeLinecap="round" />
          <path d="M 55.5 42 Q 60 37.5 64.5 42" stroke="#1A4658" strokeWidth="2.3" fill="none" strokeLinecap="round" />
          <ellipse cx="26" cy="51" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.22" />
          <ellipse cx="74" cy="51" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.22" />
        </g>
      ) : isScanning ? (
        /* Looking up — reading */
        <g>
          <ellipse cx="40" cy="40" rx="4.5" ry="4.5" fill="#1A4658" />
          <ellipse cx="60" cy="40" rx="4.5" ry="4.5" fill="#1A4658" />
          <ellipse cx="39" cy="38.2" rx="2" ry="2" fill="white" opacity="0.75" />
          <ellipse cx="59" cy="38.2" rx="2" ry="2" fill="white" opacity="0.75" />
          <circle cx="40" cy="54" r="1.5" fill={fill} opacity="0.6"
            style={{ animation: 'dotPulse 0.9s ease-in-out infinite 0s' }} />
          <circle cx="50" cy="56" r="1.5" fill={fill} opacity="0.5"
            style={{ animation: 'dotPulse 0.9s ease-in-out infinite 0.3s' }} />
          <circle cx="60" cy="54" r="1.5" fill={fill} opacity="0.6"
            style={{ animation: 'dotPulse 0.9s ease-in-out infinite 0.6s' }} />
        </g>
      ) : isResume ? (
        /* Bright + happy after break */
        <g>
          <ellipse cx="40" cy="42" rx="5" ry="5" fill="#1A4658" />
          <ellipse cx="60" cy="42" rx="5" ry="5" fill="#1A4658" />
          <ellipse cx="38.2" cy="40.2" rx="2.2" ry="2.2" fill="white" opacity="0.88" />
          <ellipse cx="58.2" cy="40.2" rx="2.2" ry="2.2" fill="white" opacity="0.88" />
          <path d="M 42 52 Q 50 58 58 52" stroke="#1A4658" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />
        </g>
      ) : workState === 'fresh' ? (
        <g>
          <ellipse cx="40" cy="42" rx="4.5" ry="4.5" fill="#1A4658" />
          <ellipse cx="60" cy="42" rx="4.5" ry="4.5" fill="#1A4658" />
          <ellipse cx="38.5" cy="40.5" rx="1.9" ry="1.9" fill="white" opacity="0.65" />
          <ellipse cx="58.5" cy="40.5" rx="1.9" ry="1.9" fill="white" opacity="0.65" />
          <path d="M 43 52 Q 50 57 57 52" stroke="#1A4658" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.4" />
        </g>
      ) : workState === 'focused' ? (
        /* Slightly squinted — concentrated */
        <g>
          <ellipse cx="40" cy="42.5" rx="4.5" ry="3.8" fill="#1A4658" />
          <ellipse cx="60" cy="42.5" rx="4.5" ry="3.8" fill="#1A4658" />
          <ellipse cx="38.5" cy="41" rx="1.6" ry="1.6" fill="white" opacity="0.55" />
          <ellipse cx="58.5" cy="41" rx="1.6" ry="1.6" fill="white" opacity="0.55" />
        </g>
      ) : workState === 'tired' ? (
        /* Half-closed eyes + faint dark circles */
        <g>
          {/* Dark circles */}
          <ellipse cx="40" cy="49" rx="5.5" ry="2" fill="#2D5568" opacity="0.14" />
          <ellipse cx="60" cy="49" rx="5.5" ry="2" fill="#2D5568" opacity="0.14" />
          {/* Eye bottom-half only (clipped) */}
          <circle cx="40" cy="42" r="4.5" fill="#1A4658" clipPath={`url(#lid-l-${uid})`} />
          <circle cx="60" cy="42" r="4.5" fill="#1A4658" clipPath={`url(#lid-r-${uid})`} />
          {/* Eyelid lines */}
          <line x1="35.5" y1="42" x2="44.5" y2="42" stroke="#1A4658" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="55.5" y1="42" x2="64.5" y2="42" stroke="#1A4658" strokeWidth="1.6" strokeLinecap="round" />
          {/* Small frown */}
          <path d="M 43 54 Q 50 51 57 54" stroke="#1A4658" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.32" />
        </g>
      ) : workState === 'exhausted' ? (
        /* 3/4 closed eyes + visible dark circles */
        <g>
          <ellipse cx="40" cy="50" rx="6" ry="2.5" fill="#2D5568" opacity="0.25" />
          <ellipse cx="60" cy="50" rx="6" ry="2.5" fill="#2D5568" opacity="0.25" />
          <circle cx="40" cy="42" r="4.5" fill="#1A4658" clipPath={`url(#lid-l-${uid})`} />
          <circle cx="60" cy="42" r="4.5" fill="#1A4658" clipPath={`url(#lid-r-${uid})`} />
          <line x1="35.5" y1="44.2" x2="44.5" y2="44.2" stroke="#1A4658" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="55.5" y1="44.2" x2="64.5" y2="44.2" stroke="#1A4658" strokeWidth="1.8" strokeLinecap="round" />
          {/* Clear frown */}
          <path d="M 43 54.5 Q 50 50.5 57 54.5" stroke="#1A4658" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.42" />
        </g>
      ) : (
        /* critical — slit eyes + prominent dark circles + grimace */
        <g>
          <ellipse cx="40" cy="50.5" rx="7" ry="3" fill="#2D5568" opacity="0.38" />
          <ellipse cx="60" cy="50.5" rx="7" ry="3" fill="#2D5568" opacity="0.38" />
          <circle cx="40" cy="42" r="4.5" fill="#1A4658" clipPath={`url(#lid-l-${uid})`} />
          <circle cx="60" cy="42" r="4.5" fill="#1A4658" clipPath={`url(#lid-r-${uid})`} />
          <line x1="35.5" y1="45.6" x2="44.5" y2="45.6" stroke="#1A4658" strokeWidth="2" strokeLinecap="round" />
          <line x1="55.5" y1="45.6" x2="64.5" y2="45.6" stroke="#1A4658" strokeWidth="2" strokeLinecap="round" />
          {/* Grimace */}
          <path d="M 42 55 Q 45 52 50 54 Q 55 56 58 53"
            stroke="#1A4658" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.48" />
        </g>
      )}
    </svg>
  )
}

function MiniCloud() {
  return (
    <svg width="18" height="14" viewBox="0 0 20 16" fill="none">
      <g fill="#7EC8E3">
        <ellipse cx="10" cy="11" rx="8" ry="4.5" />
        <circle cx="5.5" cy="8.5" r="4" />
        <circle cx="10" cy="6" r="5" />
        <circle cx="14.5" cy="8.5" r="3.5" />
      </g>
    </svg>
  )
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function PrimaryBtn({ children, onClick, shortcut, disabled }: {
  children: React.ReactNode; onClick?: () => void; shortcut?: string; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full h-10 bg-[#7EC8E3] hover:bg-[#5CB5D2] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[13px] rounded-xl transition-all duration-150 shadow-sm flex items-center justify-center gap-2">
      <span>{children}</span>
      {shortcut && (
        <span className="text-[10px] font-bold bg-white/20 rounded px-1.5 py-0.5 leading-none">{shortcut}</span>
      )}
    </button>
  )
}

function SecondaryBtn({ children, onClick, shortcut }: {
  children: React.ReactNode; onClick?: () => void; shortcut?: string
}) {
  return (
    <button onClick={onClick}
      className="w-full h-10 bg-white hover:bg-[#F5FBFE] active:scale-[0.98] border border-[#E0DAD4] text-[#374151] font-medium text-[13px] rounded-xl transition-all duration-150 flex items-center justify-center gap-2">
      <span>{children}</span>
      {shortcut && (
        <span className="text-[10px] font-bold bg-[#F0EDE8] text-[#BEC6D0] rounded px-1.5 py-0.5 leading-none">{shortcut}</span>
      )}
    </button>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="text-[#7A8494] hover:text-[#374151] font-medium text-[12px] transition-colors underline-offset-2 hover:underline">
      {children}
    </button>
  )
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

function ProactiveScreen({ workState, workDuration, onTakeBreak, onDismiss }: {
  workState: WorkState; workDuration: string; onTakeBreak: () => void; onDismiss: () => void
}) {
  const isCritical = workState === 'critical'
  return (
    <div className="px-4 py-5 flex flex-col items-center gap-5" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="relative w-28 h-[88px]"
        style={{ animation: `cloudFloat ${FLOAT_DUR[workState]} ease-in-out infinite` }}>
        <PuffCloud workState={workState} screen="proactive" />
      </div>

      <div className="text-center space-y-1.5 px-1">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-1 border"
          style={{ background: PILL[workState].bg, borderColor: PILL[workState].border }}>
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: PILL[workState].dot, animation: 'glowPulse 1.2s ease-in-out infinite' }} />
          <span className="text-[11px] font-bold" style={{ color: PILL[workState].text }}>
            Working for {workDuration}
          </span>
        </div>
        <h2 className="text-[18px] font-semibold text-[#1A1A1A] tracking-tight leading-snug">
          {isCritical ? "You really need a break." : "Wanna take a break?"}
        </h2>
        <p className="text-[12.5px] text-[#7A8494] leading-relaxed">
          {isCritical
            ? "That's a long stretch. Let me hold your place before you lose the thread."
            : "I'll remember where you are and the question you haven't answered yet."}
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        <PrimaryBtn onClick={onTakeBreak}>{isCritical ? "Take a break now" : "Take a break"}</PrimaryBtn>
        <SecondaryBtn onClick={onDismiss}>Not now</SecondaryBtn>
      </div>
    </div>
  )
}

function ManualScreen({ workState, workDuration, onHold, onDismiss }: {
  workState: WorkState; workDuration: string; onHold: () => void; onDismiss: () => void
}) {
  return (
    <div className="px-4 py-5 flex flex-col items-center gap-5" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="relative w-28 h-[88px]"
        style={{ animation: `cloudFloat ${FLOAT_DUR[workState]} ease-in-out infinite` }}>
        <PuffCloud workState={workState} screen="manual" />
      </div>
      <div className="text-center space-y-1.5 px-1">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-1 border"
          style={{ background: PILL[workState].bg, borderColor: PILL[workState].border }}>
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: PILL[workState].dot,
              animation: workState === 'exhausted' || workState === 'critical' ? 'glowPulse 1.2s ease-in-out infinite' : 'none' }} />
          <span className="text-[11px] font-bold" style={{ color: PILL[workState].text }}>Working for {workDuration}</span>
        </div>
        <h2 className="text-[18px] font-semibold text-[#1A1A1A] tracking-tight leading-snug">
          Taking a break?
        </h2>
        <p className="text-[12.5px] text-[#7A8494] leading-relaxed">
          I'll remember where you are and the question you haven't answered yet.
        </p>
      </div>
      <div className="w-full flex flex-col gap-2">
        <PrimaryBtn onClick={onHold}>Yes, hold my place</PrimaryBtn>
        <SecondaryBtn onClick={onDismiss}>Not now</SecondaryBtn>
      </div>
    </div>
  )
}

function ScanningScreen({ workState }: { workState: WorkState }) {
  return (
    <div className="px-4 py-5 flex flex-col items-center gap-5" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="relative w-28 h-[88px]" style={{ animation: 'cloudBreathe 1.8s ease-in-out infinite' }}>
        <PuffCloud workState={workState} screen="scanning" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-[14px] font-semibold text-[#1A1A1A]">Reading your context…</p>
        <p className="text-[12px] text-[#BEC6D0]">Just a moment</p>
      </div>
    </div>
  )
}

function ConfirmScreen({ workState, onYes, onNo, onOther }: {
  workState: WorkState; onYes: () => void; onNo: () => void; onOther: (v: string) => void
}) {
  const [otherMode, setOtherMode] = useState(false)
  const [otherText, setOtherText] = useState('')
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (otherMode) return
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); onYes() }
      else if (e.key === 'n' || e.key === 'N' || e.code === 'Escape') { e.preventDefault(); onNo() }
      else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        setOtherMode(true)
        setOtherText(e.key)
        setTimeout(() => textRef.current?.focus(), 30)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [otherMode, onYes, onNo])

  useEffect(() => { if (otherMode) textRef.current?.focus() }, [otherMode])

  const submit = () => { if (otherText.trim()) onOther(otherText.trim()) }

  return (
    <div className="px-4 py-4 flex flex-col gap-4" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-9 flex-shrink-0" style={{ animation: 'cloudBreathe 2.4s ease-in-out infinite' }}>
          <PuffCloud workState={workState} screen="confirm" small />
        </div>
        <p className="text-[13px] font-medium text-[#374151] leading-snug">
          It seems like you're{' '}
          <span className="text-[#0369A1] font-semibold">{CTX.summary}</span>.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap items-center">
        {CTX.frames.map((f, i) => (
          <span key={f + i}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              i === 0
                ? 'bg-[#7EC8E3] text-white border-[#7EC8E3]'
                : 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
            }`}>
            {i === 0 && <span className="opacity-80">on this page</span>}
            {f}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E0DAD4] px-3.5 py-3">
        <p className="text-[12.5px] text-[#374151] leading-snug">
          Do you want me to{' '}
          <span className="font-semibold text-[#1A1A1A]">{CTX.suggestedTask}</span>?
        </p>
      </div>

      {!otherMode ? (
        <div className="flex flex-col gap-2">
          <PrimaryBtn onClick={onYes} shortcut="space">Yes, go ahead</PrimaryBtn>
          <SecondaryBtn onClick={onNo} shortcut="N">No thanks</SecondaryBtn>
          <div className="flex justify-center pt-0.5">
            <button onClick={() => setOtherMode(true)}
              className="text-[11.5px] text-[#BEC6D0] hover:text-[#7A8494] transition-colors">
              Or tell me what to do instead…
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea ref={textRef} value={otherText} onChange={e => setOtherText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            rows={3} placeholder="Type what you'd like me to do…"
            className="w-full resize-none text-[13px] text-[#1A1A1A] bg-[#F7F5F2] border border-[#E0DAD4] focus:border-[#7EC8E3] focus:ring-2 focus:ring-[#7EC8E3]/20 rounded-xl px-3 py-2.5 outline-none transition-all leading-relaxed" />
          <PrimaryBtn onClick={submit} disabled={!otherText.trim()}>Let's do it ↵</PrimaryBtn>
          <div className="flex justify-center">
            <GhostBtn onClick={() => { setOtherMode(false); setOtherText('') }}>Back</GhostBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function OnBreakScreen({ breakMode, onBack, jobStatus, jobQuestion }: {
  breakMode: BreakMode; onBack: () => void; jobStatus?: string | null; jobQuestion?: string
}) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return (
    <div className="px-4 py-5 flex flex-col items-center gap-5" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="relative w-28 h-[88px]">
        <div className="absolute inset-0 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(126,200,227,0.10) 0%, transparent 70%)', animation: 'glowPulse 2.4s ease-in-out infinite' }} />
        <div className="relative w-full h-full" style={{ animation: 'cloudFloat 3.2s ease-in-out infinite' }}>
          <PuffCloud workState="fresh" screen="on_break" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-[18px] font-semibold text-[#1A1A1A] tracking-tight">Your thought is held.</h2>
        <p className="text-[12px] text-[#BEC6D0]">Away for {timeStr}</p>
      </div>
      {breakMode === 'agent' && (
        <div className="w-full bg-white rounded-xl border border-[#E0DAD4] px-3.5 py-3 flex items-start gap-2.5">
          <div className="w-2 h-2 mt-0.5 rounded-full bg-[#7EC8E3] flex-shrink-0"
            style={{ animation: 'glowPulse 0.9s ease-in-out infinite' }} />
          <div>
            <p className="text-[11px] font-bold text-[#BEC6D0] uppercase tracking-wide mb-0.5">{jobStatus ? jobStatus : 'Running'}</p>
            <p className="text-[12.5px] font-medium text-[#374151] leading-snug">{CTX.suggestedTask}</p>
          </div>
        </div>
      )}
      <button onClick={onBack}
        className="text-[12px] font-medium text-[#BEC6D0] hover:text-[#7EC8E3] transition-colors">
        I'm back →
      </button>
    </div>
  )
}


/** Minimal Markdown rendering for the agent's brief: headings, bullets, bold, and links. */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<strong key={`${keyBase}-b${i}`} className="font-semibold">{m[1]}</strong>)
    else out.push(
      <a key={`${keyBase}-a${i}`} href={m[3]} target="_blank" rel="noopener noreferrer" className="underline break-all">{m[2]}</a>,
    )
    last = m.index + m[0].length
    i++
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function renderBrief(md: string): React.ReactNode {
  const lines = md.split('\n')
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []
  const flush = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-4 space-y-1 my-1">
        {bullets.map((b, i) => <li key={i}>{renderInline(b, `li${blocks.length}-${i}`)}</li>)}
      </ul>,
    )
    bullets = []
  }
  lines.forEach((raw, idx) => {
    const line = raw.trim()
    if (!line) { flush(); return }
    if (/^#{1,6}\s/.test(line)) {
      flush()
      blocks.push(
        <p key={`h${idx}`} className="text-[10px] font-bold uppercase tracking-widest mt-2 mb-1 opacity-70">
          {line.replace(/^#{1,6}\s*/, '')}
        </p>,
      )
      return
    }
    const bullet = line.match(/^(?:[-*\u2013]|\d+\.)\s+(.*)$/)
    if (bullet) { bullets.push(bullet[1]); return }
    flush()
    blocks.push(<p key={`p${idx}`} className="my-1">{renderInline(line, `p${idx}`)}</p>)
  })
  flush()
  return <>{blocks}</>
}

function ResumeScreen({ breakMode, customTask, onDone, jobStatus, jobResult }: {
  breakMode: BreakMode; customTask: string; onDone: () => void
  jobStatus?: string | null
  jobResult?: { summary: string; sources: { title: string; url: string }[] } | null
}) {
  const [showSources, setShowSources] = useState(false)
  return (
    <div className="px-4 py-5 flex flex-col items-center gap-5" style={{ animation: 'fadeSlide 0.2s ease-out' }}>
      <div className="relative w-20 h-[64px]" style={{ animation: 'cloudFloat 2.4s ease-in-out infinite' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80px 60px at 58% 40%, rgba(253,230,138,0.3) 0%, transparent 70%)' }} />
        <PuffCloud workState="fresh" screen="resume" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-[22px] font-semibold text-[#1A1A1A] tracking-tight">Welcome back ✦</h2>
        <p className="text-[12.5px] text-[#7A8494]">Here's where you left off.</p>
      </div>
      <div className="w-full bg-white rounded-xl border border-[#E0DAD4] px-3.5 py-3 space-y-1.5">
        <p className="text-[9.5px] font-bold text-[#BEC6D0] uppercase tracking-widest">You were working on</p>
        <p className="text-[13.5px] font-semibold text-[#1A1A1A] leading-snug">{CTX.activeTitle || CTX.summary}</p>
        {CTX.activeTitle && <p className="text-[11.5px] text-[#7A8494] leading-snug">{CTX.summary}</p>}
        <div className="flex gap-1.5 flex-wrap pt-0.5">
          {CTX.frames.map(f => (
            <span key={f} className="inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-md border bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]">{f}</span>
          ))}
        </div>
      </div>
      {breakMode === 'agent' && jobStatus === 'completed' && jobResult && (
        <div className="w-full bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] px-3.5 py-3 space-y-1">
          <p className="text-[9.5px] font-bold text-[#166534] uppercase tracking-widest">Puff found</p>
          <div className="text-[12px] text-[#166534] leading-relaxed max-h-52 overflow-y-auto pr-1">{renderBrief(jobResult.summary)}</div>
          {jobResult.sources.length > 0 && (
            <>
              <button onClick={() => setShowSources(v => !v)} className="text-[11px] text-[#059669] font-semibold hover:underline">
                {showSources ? 'Hide sources' : `See ${jobResult.sources.length} sources ↗`}
              </button>
              {showSources && (
                <ul className="list-disc pl-4 space-y-1 pt-1">
                  {jobResult.sources.map(src => (
                    <li key={src.url} className="text-[11px] leading-snug">
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[#059669] underline break-all">{src.title}</a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
      {breakMode === 'agent' && jobStatus && jobStatus !== 'completed' && (
        <div className="w-full bg-[#FFFBEB] rounded-xl border border-[#FDE68A]/60 px-3.5 py-3">
          <p className="text-[9.5px] font-bold text-[#854D0E] uppercase tracking-widest mb-1">Task {jobStatus}</p>
          <p className="text-[12px] text-[#854D0E] leading-snug">
            {jobStatus === 'running'
              ? 'Still working. Coming back early did not stop it, and no result is being shown yet.'
              : 'No result was produced, and nothing was invented in its place. Your place is still saved.'}
          </p>
        </div>
      )}
      {breakMode === 'save_only' && customTask && (
        <div className="w-full bg-[#FFFBEB] rounded-xl border border-[#FDE68A]/60 px-3.5 py-3">
          <p className="text-[9.5px] font-bold text-[#854D0E] uppercase tracking-widest mb-1">Your note</p>
          <p className="text-[12.5px] text-[#854D0E] leading-snug">"{customTask}"</p>
        </div>
      )}
      <div className="w-full">
        <PrimaryBtn onClick={onDone}>Return to my work</PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Launcher ─────────────────────────────────────────────────────────────────

function PuffLauncher({ screen, workState, agentRunning, onOpen }: {
  screen: Screen; workState: WorkState; agentRunning: boolean; onOpen: () => void
}) {
  const [cloudHovered, setCloudHovered] = useState(false)

  const floatDur = FLOAT_DUR[workState]

  return (
    <div
      className="relative flex items-end"
      style={{ paddingTop: '16px' }}
    >
      <button
        onClick={onOpen}
        aria-label="Open Puff"
        onMouseEnter={() => setCloudHovered(true)}
        onMouseLeave={() => setCloudHovered(false)}
        className="relative w-16 h-16 flex items-end justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EC8E3] rounded-full transition-transform duration-200"
        style={{ transform: cloudHovered ? 'scale(1.08)' : 'scale(1)' }}
      >
        <div className="relative w-14 h-11" style={{ animation: `cloudFloat ${floatDur} ease-in-out infinite` }}>
          <PuffCloud workState={workState} screen={screen} small />
        </div>

        {agentRunning && (
          <span className="absolute top-2 right-1.5 w-2 h-2 rounded-full bg-[#7EC8E3] border-2 border-white/80 pointer-events-none"
            style={{ animation: 'glowPulse 1s ease-in-out infinite' }} />
        )}
      </button>

    </div>
  )
}

function PuffPanel({ screen, onMinimize, children }: {
  screen: Screen; onMinimize: () => void; children: React.ReactNode
}) {
  const label: Partial<Record<Screen, string>> = {
    scanning: 'Reading…', confirm: 'Quick check',
    on_break: 'Away', resume: 'Welcome back',
  }
  return (
    <div className="w-80 bg-[#F7F5F2] rounded-2xl flex flex-col overflow-hidden isolate"
      style={{
        border: '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 8px 18px -6px rgba(26,48,53,0.18), 0 2px 6px rgba(26,48,53,0.08)',
        maxHeight: inExtension ? 'calc(100vh - 96px)' : 'min(540px, 80vh)',
        animation: 'panelExpand 0.2s ease-out forwards',
      }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EAE5DF] flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.6)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div className="flex items-center gap-2">
          <MiniCloud />
          <span className="text-[13px] font-semibold text-[#1A1A1A]">Puff</span>
          {label[screen] && <span className="text-[11px] text-[#BEC6D0] font-medium">· {label[screen]}</span>}
        </div>
        <button onClick={onMinimize} aria-label="Minimize"
          className="w-7 h-7 flex items-center justify-center text-[#BEC6D0] hover:text-[#7A8494] rounded-lg hover:bg-[#EDE7E0] transition-colors">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M 2 7 L 12 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain" key={screen}>
        {children}
      </div>
    </div>
  )
}

// ─── Puff Found Panel ─────────────────────────────────────────────────────────

const FOUND_RESULTS = [
  {
    type: 'doc' as const,
    source: 'Figma — Design System Docs',
    title: 'Help tooltip patterns & placement guidelines',
    snippet: 'Inline helpers perform better when form fields exceed 4 items. Use expandable for dense layouts where label proximity matters.',
    tag: 'High relevance',
    tagColor: 'bg-[#D1FAE5] text-[#065F46]',
    icon: '📄',
  },
  {
    type: 'doc' as const,
    source: 'Notion — UX Research Notes',
    title: 'Q2 Usability findings: Checkout v3',
    snippet: 'Users missed inline hints 60% of the time on mobile. Contextual tooltips on tap improved task completion by 18%.',
    tag: 'Relevant',
    tagColor: 'bg-[#E0F2FE] text-[#0369A1]',
    icon: '📋',
  },
  {
    type: 'web' as const,
    source: 'nngroup.com',
    title: 'Inline vs Progressive Disclosure in Forms',
    snippet: 'Progressive disclosure reduces cognitive load by 23% in forms with 6+ fields. Inline help is preferable for first-time users.',
    tag: 'External',
    tagColor: 'bg-[#F3E8FF] text-[#6B21A8]',
    icon: '🌐',
  },
  {
    type: 'web' as const,
    source: 'baymard.com',
    title: 'Form Field Descriptions: 4 UX Design Patterns',
    snippet: 'Expandable help icons are frequently overlooked unless paired with persistent visual affordance. Consider always-visible micro-copy.',
    tag: 'External',
    tagColor: 'bg-[#F3E8FF] text-[#6B21A8]',
    icon: '🌐',
  },
]

function PuffFoundPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'all' | 'docs' | 'web'>('all')
  const results = FOUND_RESULTS.filter(r => tab === 'all' || r.type === tab.replace('docs', 'doc'))

  return (
    <div className="w-80 bg-[#F7F5F2] rounded-2xl flex flex-col overflow-hidden isolate"
      style={{ border: '1px solid rgba(255,255,255,0.72)', maxHeight: 'min(540px, 80vh)', animation: 'panelExpand 0.2s ease-out forwards', transformOrigin: 'bottom left' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EAE5DF] flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.6)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div className="flex items-center gap-2">
          <span className="text-[14px]">🔍</span>
          <span className="text-[13px] font-semibold text-[#1A1A1A]">Puff found</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#7EC8E3]/20 text-[#0369A1]">{FOUND_RESULTS.length}</span>
        </div>
        <button onClick={onClose} aria-label="Close"
          className="w-7 h-7 flex items-center justify-center text-[#BEC6D0] hover:text-[#7A8494] rounded-lg hover:bg-[#EDE7E0] transition-colors">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Context pill */}
      <div className="px-3.5 py-2.5 border-b border-[#EAE5DF] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.4)' }}>
        <p className="text-[9.5px] font-bold text-[#BEC6D0] uppercase tracking-widest mb-1">While you were away, I researched</p>
        <p className="text-[11.5px] font-medium text-[#374151] leading-snug">"{CTX.summary}"</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2.5 pb-1 flex-shrink-0">
        {(['all', 'docs', 'web'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all ${tab === t ? 'bg-[#1A1A1A] text-white' : 'text-[#7A8494] hover:text-[#374151] hover:bg-white/60'}`}>
            {t === 'all' ? 'All' : t === 'docs' ? '📄 Your docs' : '🌐 Web'}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-3 space-y-2 pt-1">
        {results.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E0DAD4] px-3 py-2.5 space-y-1.5 cursor-pointer hover:border-[#7EC8E3]/60 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12px] flex-shrink-0">{r.icon}</span>
                <p className="text-[9.5px] text-[#7A8494] truncate">{r.source}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.tagColor}`}>{r.tag}</span>
            </div>
            <p className="text-[12px] font-semibold text-[#1A1A1A] leading-snug">{r.title}</p>
            <p className="text-[11px] text-[#7A8494] leading-snug">{r.snippet}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 pt-1 flex-shrink-0">
        <button className="w-full py-2 rounded-xl text-[12px] font-semibold text-[#7A8494] border border-[#E0DAD4] bg-white/60 hover:bg-white hover:text-[#374151] transition-all">
          Save all findings to doc
        </button>
      </div>
    </div>
  )
}

// ─── Simulated webpage ────────────────────────────────────────────────────────

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
  const [isExpanded, setIsExpanded] = useState(!inExtension)
  const [breakMode, setBreakMode]   = useState<BreakMode>(null)
  const [customTask, setCustomTask] = useState('')
  const [onboarding, setOnboarding] = useState(() => {
    if (!inExtension) return true
    try { return localStorage.getItem('puffOnboarded') !== '1' } catch { return true }
  })

  const WORK_DURATION: Record<WorkState, string> = {
    fresh: '28 min', focused: '1h 02m', tired: '2h 11m', exhausted: '3h 34m', critical: '4h 47m',
  }

  const goTo = useCallback((s: Screen) => { setScreen(s); setIsExpanded(true) }, [])

  useEffect(() => {
    if (!inExtension) return
    try { window.parent.postMessage({ type: 'PUFF_FRAME', expanded: isExpanded }, '*') } catch { /* no host */ }
  }, [isExpanded])

  // ── Real backend state ────────────────────────────────────────────────────
  const [draft, setDraft] = useState<Draft | null>(null)
  const [checkpointId, setCheckpointId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string | null>(null)
  const [jobResult, setJobResult] = useState<{ summary: string; sources: { title: string; url: string }[] } | null>(null)
  const [jobQuestion, setJobQuestion] = useState('')
  const [error, setError] = useState('')
  const [workSeconds, setWorkSeconds] = useState(0)
  const [, forceRender] = useState(0)

  // Measured activity drives the mood and the "Working for …" pill.
  useEffect(() => {
    if (!inExtension) return
    let alive = true
    const tick = async () => {
      const s = await activityState()
      if (!alive || !s) return
      setWorkSeconds(s.sessionSeconds || 0)
      setWorkState(workStateFor(s.sessionSeconds || 0))
      if (s.mode === 'gentle_nudge' && !draft && screen !== 'on_break' && screen !== 'resume') {
        setScreen('proactive'); setIsExpanded(true)
      }
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => { alive = false; clearInterval(id) }
  }, [draft, screen])

  const startScan = useCallback(async () => {
    if (!inExtension) { goTo('scanning'); setTimeout(() => setScreen('confirm'), 1600); return }
    setError('')
    goTo('scanning')
    try {
      await captureContext(contentsGranted())
      setConsent(true)
      const record: Draft = await bridge('/draft', { consent: true, intent: '' })
      const tabs = record.context.browser?.tabs || []
      const active = tabs.find(t => t.active)
      // Chips name where the work lives. The first is the page you are on.
      const activeUrl = active?.url || record.context.browser?.url || ''
      const activeLabel = sourceLabel(activeUrl) || chipLabel(active?.title || '')
      const seen = new Set([activeLabel])
      const others: string[] = []
      for (const t of tabs) {
        if (t.active || !isWorkTab(t.url)) continue
        const label = sourceLabel(t.url)
        if (!label || seen.has(label)) continue
        seen.add(label)
        others.push(label)
        if (others.length === 2) break
      }
      applyContext({
        summary: record.draft.interpretation,
        frames: [activeLabel, ...others].filter(Boolean),
        suggestedTask: record.draft.proposedTask.label,
        activeTitle: chipLabel(active?.title || record.context.browser?.title || ''),
      })
      setDraft(record)
      forceRender(n => n + 1)
      setScreen('confirm')
    } catch (e: any) {
      setError(e?.message || 'Puff could not read your context. Nothing was made up.')
      setScreen('manual')
    }
  }, [goTo])

  // Saving a place and delegating work stay separate authorisations.
  const saveCheckpoint = useCallback(async (record: Draft) => {
    if (checkpointId) return checkpointId
    const c = await bridge('/checkpoint', { draftId: record.id, nextStep: record.draft.nextStep })
    setCheckpointId(c.id)
    return c.id as string
  }, [checkpointId])

  const handleYes = useCallback(async () => {
    if (!inExtension || !draft) { setBreakMode('agent'); goTo('on_break'); return }
    setError('')
    try {
      const id = await saveCheckpoint(draft)
      const question = draft.draft.proposedTask.question
      setJobQuestion(question)
      const job = await bridge('/jobs', { checkpointId: id, question, consent: true })
      setJobStatus(job.status)
      setBreakMode('agent')
      goTo('on_break')
    } catch (e: any) {
      // Honest split: the place may be saved even when the task fails to start.
      setError(e?.message || 'Your place is saved. The task did not start.')
      setBreakMode('save_only')
      goTo('on_break')
    }
  }, [draft, goTo, saveCheckpoint])

  const handleNo = useCallback(async () => {
    if (!inExtension || !draft) { setBreakMode('save_only'); goTo('on_break'); return }
    setError('')
    try { await saveCheckpoint(draft) } catch (e: any) { setError(e?.message || 'Could not save your place.') }
    setBreakMode('save_only')
    goTo('on_break')
  }, [draft, goTo, saveCheckpoint])

  const handleOther = useCallback(async (v: string) => {
    setCustomTask(v)
    if (!inExtension || !draft) { setBreakMode('save_only'); goTo('on_break'); return }
    setError('')
    try {
      const id = await saveCheckpoint(draft)
      setJobQuestion(v)
      const job = await bridge('/jobs', { checkpointId: id, question: v, consent: true })
      setJobStatus(job.status)
      setBreakMode('agent')
    } catch (e: any) {
      setError(e?.message || 'Your place is saved. The task did not start.')
      setBreakMode('save_only')
    }
    goTo('on_break')
  }, [draft, goTo, saveCheckpoint])

  // Poll the job so "away" and "resume" never claim more than actually happened.
  useEffect(() => {
    if (!inExtension || !checkpointId || breakMode !== 'agent') return
    let alive = true
    const poll = async () => {
      try {
        const st = await bridge('/state')
        const job: any = Object.values(st.jobs || {})
          .filter((j: any) => j.checkpointId === checkpointId)
          .sort((a: any, b: any) => b.createdAt - a.createdAt)[0]
        if (!alive || !job) return
        setJobStatus(job.status)
        if (job.result) setJobResult(job.result)
      } catch { /* the away screen keeps its last honest status */ }
    }
    poll()
    const id = setInterval(poll, 4000)
    return () => { alive = false; clearInterval(id) }
  }, [checkpointId, breakMode])

  const handleDone = useCallback(async () => {
    // "Return to my work" must actually restore the saved location, not just close the panel.
    if (inExtension && checkpointId) {
      try {
        const result = await bridge('/restore', { checkpointId })
        await restoreTab(draft?.context.browser || null, result?.browser?.url)
      } catch (e: any) {
        setError(e?.message || 'Could not reopen your saved page.')
      }
    }
    await resetActivity()
    setWorkSeconds(0)
    setWorkState('fresh')
    setIsExpanded(false)
    setScreen(inExtension ? 'manual' : 'proactive')
    setBreakMode(null)
    setCustomTask('')
    setDraft(null)
    setCheckpointId(null)
    setJobStatus(null)
    setJobResult(null)
  }, [checkpointId, draft])

  function renderScreen(): React.ReactNode {
    if (onboarding) return <OnboardingScreen onDone={() => { try { localStorage.setItem('puffOnboarded', '1') } catch {} ; setConsent(true); setOnboarding(false) }} />

    switch (screen) {
      case 'proactive': return <ProactiveScreen workState={workState} workDuration={inExtension ? formatDuration(workSeconds) : WORK_DURATION[workState]} onTakeBreak={startScan} onDismiss={() => setIsExpanded(false)} />
      case 'manual':    return <ManualScreen workState={workState} workDuration={inExtension ? formatDuration(workSeconds) : WORK_DURATION[workState]} onHold={startScan} onDismiss={() => setIsExpanded(false)} />
      case 'scanning':  return <ScanningScreen workState={workState} />
      case 'confirm':   return <ConfirmScreen workState={workState} onYes={handleYes} onNo={handleNo} onOther={handleOther} />
      case 'on_break':  return <OnBreakScreen breakMode={breakMode} onBack={() => goTo('resume')} jobStatus={jobStatus} jobQuestion={jobQuestion} />
      case 'resume':    return <ResumeScreen breakMode={breakMode} customTask={customTask} onDone={handleDone} jobStatus={jobStatus} jobResult={jobResult} />
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
          <PuffPanel screen={screen} onMinimize={() => setIsExpanded(false)}>
            {renderScreen()}
          </PuffPanel>
        )}
        <PuffLauncher
          screen={screen}
          workState={workState}
          agentRunning={screen === 'on_break' && breakMode === 'agent'}
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
