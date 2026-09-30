// A design board: every screen and every expression, rendered with fixed sample data, so the
// current version can be reviewed side by side and exported for Figma. Not part of the extension.
import { createRoot } from 'react-dom/client'
import './index.css'
import { Cloud, type Mood, type Season } from './Cloud'
import { PuffPanel, HomeScreen, ProactiveScreen, ConfirmScreen, OnBreakScreen, ResumeScreen, PauseScreen, ControlsScreen,
  PrimaryBtn, SecondaryBtn, GhostBtn, BackButton, Sticker, Label, PuffLauncher, WINDOW } from './App'

const noop = () => {}
const controls = { enabled: true, busyUntil: 0, thresholdSeconds: 1800 }
const paused = { ...controls, busyUntil: new Date().setHours(16, 30, 0, 0) + 24 * 3600 * 1000 }
const hold = { label: 'Registration flow', source: 'Figma', note: 'Review the mobile help pattern' }

const MOODS: Mood[] = ['idle', 'focused', 'tired', 'very_tired', 'sleepy', 'nudge', 'finished', 'saving', 'break', 'paused', 'welcome', 'dragged', 'petted']
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ font: '600 13px system-ui', color: '#374151', marginBottom: 8 }}>{title}</figcaption>
      {children}
    </figure>
  )
}

// ─── Components: every building block on its own, labelled, so each lands as its own frame in Figma.

const COLORS: [string, string, string][] = [
  ['Ink', '#34405E', 'outlines, headings'], ['Ink soft', '#5A6480', 'body, labels'], ['Ink faint', '#8A93A8', 'hints'],
  ['Paper', '#FFFBF4', 'window body'], ['Paper dot', '#E8DDCB', 'dot grid'],
  ['Sun', '#FFD66B', 'primary action'], ['Sky', '#DCEFFA', 'secondary action'], ['Lilac', '#E3DCF5', 'pause'],
  ['Mint', '#CDEBD6', 'return'], ['Blush', '#FCE3EA', 'sticker, hey.txt'], ['Cream', '#FFF4CC', 'note sticker'],
  ['Puff blue', '#86CCE8', 'the cloud'],
]

// Static stand-ins for the hover and pressed states, which only exist under the pointer.
const hover = { transform: 'translate(-1px,-1px)', boxShadow: '3px 3px 0 #34405E' }
const pressed = { transform: 'translate(2px,2px)', boxShadow: '0 0 0 #34405E' }

function Components() {
  const row = { display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' } as const
  const sub = { font: '600 14px system-ui', color: '#5A6480', margin: '28px 0 12px' } as const
  return (
    <>
      <p style={sub}>Colour</p>
      <div style={row}>
        {COLORS.map(([name, hex, use]) => (
          <Frame key={hex} title={name}>
            <div style={{ width: 120 }}>
              <div style={{ height: 64, borderRadius: 10, border: '2px solid #34405E', background: hex }} />
              <p className="puff-mono" style={{ fontSize: 11, color: '#34405E', margin: '6px 0 0' }}>{hex}</p>
              <p style={{ fontSize: 11, color: '#8A93A8', margin: 0 }}>{use}</p>
            </div>
          </Frame>
        ))}
      </div>

      <p style={sub}>Type</p>
      <div style={{ ...row, alignItems: 'baseline' }}>
        <Frame title="Hero number · Outfit 800 · 34"><p className="puff-ink" style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: '-.5px' }}>1h 12m</p></Frame>
        <Frame title="Heading · Outfit 800 · 16"><p className="puff-ink" style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>good moment for a break?</p></Frame>
        <Frame title="Body · Outfit 400 · 12.5"><p style={{ fontSize: 12.5, color: '#5A6480', margin: 0 }}>for meetings, deadlines, or when you want to keep going.</p></Frame>
        <Frame title="Label · mono · 10.5"><Label>you were working on</Label></Frame>
        <Frame title="Highlight"><p style={{ fontSize: 12, color: '#5A6480', margin: 0 }}><span className="puff-highlight">of good focus</span></p></Frame>
      </div>

      <p style={sub}>Buttons</p>
      <div style={row}>
        <Frame title="Primary"><div style={{ width: 180 }}><PrimaryBtn>start my break</PrimaryBtn></div></Frame>
        <Frame title="Primary · hover"><div style={{ width: 180 }}><button className="puff-btn w-full h-10 bg-[#FFD66B] text-[13px]" style={hover}>start my break</button></div></Frame>
        <Frame title="Primary · pressed"><div style={{ width: 180 }}><button className="puff-btn w-full h-10 bg-[#FFD66B] text-[13px]" style={pressed}>start my break</button></div></Frame>
        <Frame title="Secondary"><div style={{ width: 180 }}><SecondaryBtn>later</SecondaryBtn></div></Frame>
        <Frame title="Dialog buttons">
          <div className="flex gap-2">
            <button className="puff-btn puff-mono bg-[#FFD66B] text-[12px] px-3.5 h-8">BREAK</button>
            <button className="puff-btn puff-mono bg-[#DCEFFA] text-[12px] px-3.5 h-8">LATER</button>
            <button className="puff-btn puff-mono bg-[#E3DCF5] text-[12px] px-3.5 h-8">PAUSE</button>
          </div>
        </Frame>
        <Frame title="Small actions">
          <div className="flex gap-2">
            <button className="puff-btn bg-[#FFD66B] text-[12.5px] px-3.5 h-9">take a break</button>
            <button className="puff-btn bg-[#E3DCF5] text-[12.5px] px-3.5 h-9">pause</button>
            <button className="puff-btn bg-[#CDEBD6] text-[12.5px] px-4 h-9">i'm back →</button>
          </div>
        </Frame>
        <Frame title="Back"><BackButton onClick={noop} /></Frame>
        <Frame title="Text link"><GhostBtn>turn puff off</GhostBtn></Frame>
        <Frame title="Option"><div style={{ width: 260 }}><button className="puff-btn w-full text-left px-3.5 py-2.5 bg-white text-[13px]">for 1 hour</button></div></Frame>
        <Frame title="Chips · selected, not">
          <div className="grid grid-cols-4 gap-2" style={{ width: 260 }}>
            {[20, 30, 45, 60].map(m => <button key={m} className={`puff-btn h-8 text-[12px] ${m === 30 ? 'bg-[#FFD66B]' : 'bg-white'}`}>{m}m</button>)}
          </div>
        </Frame>
        <Frame title="Toggle · off, on">
          <div className="flex gap-2">
            {[false, true].map(on => (
              <span key={String(on)} className={`puff-mono text-[11px] px-1.5 rounded border-2 border-[#34405E] puff-ink ${on ? 'bg-[#FFD66B]' : 'bg-white'}`}>{on ? 'ON' : 'OFF'}</span>
            ))}
          </div>
        </Frame>
      </div>

      <p style={sub}>Cards and fields</p>
      <div style={row}>
        {([['#DCEFFA', undefined, -2, 'today', '3h 40m'], ['#FCE3EA', 'rgba(205,235,214,.9)', 2, 'breaks', '2 ☕'], ['#FFF4CC', 'rgba(191,217,238,.9)', -1, 'you were on', 'Registration flow']] as const).map(([bg, tape, tilt, label, value]) => (
          <Frame key={bg} title={`Sticker · ${label}`}>
            <div style={{ width: 150, paddingTop: 10 }}>
              <Sticker bg={bg} tape={tape} tilt={tilt}>
                <div className="px-2.5 pt-2.5 pb-1.5"><Label>{label}</Label><p className="text-[16px] font-extrabold puff-ink">{value}</p></div>
              </Sticker>
            </div>
          </Frame>
        ))}
        <Frame title="Paused banner">
          <div className="puff-sticker bg-[#FFF4CC] flex items-center justify-between px-3 py-2" style={{ width: 280 }}>
            <span className="puff-mono text-[11.5px] puff-ink">paused until 4:30 PM</span>
            <span className="puff-mono text-[11.5px] font-bold puff-ink">resume</span>
          </div>
        </Frame>
        <Frame title="Text field">
          <textarea className="puff-field resize-none text-[13px] px-3 py-2.5 placeholder:text-[#B3B9C6]" rows={2} style={{ width: 280 }} placeholder="review the mobile help pattern" readOnly />
        </Frame>
      </div>

      <p style={sub}>Window title bars</p>
      <div style={row}>
        {(Object.keys(WINDOW) as (keyof typeof WINDOW)[]).map(s => (
          <Frame key={s} title={WINDOW[s].name}>
            <PuffPanel screen={s} onMinimize={noop} onControls={noop}><div style={{ height: 36 }} /></PuffPanel>
          </Frame>
        ))}
      </div>

      <p style={sub}>On the page</p>
      <div style={row}>
        <Frame title="Launcher cloud"><PuffLauncher mood="idle" onOpen={noop} /></Frame>
      </div>
    </>
  )
}

function Board() {
  const section = { font: '700 18px system-ui', color: '#1A1A1A', margin: '40px 0 16px' } as const
  return (
    <div style={{ padding: 40, background: '#EDE9E3', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <h1 style={{ font: '800 26px system-ui', margin: 0 }}>Puff — design board</h1>
      <p style={{ color: '#7A8494', margin: '6px 0 0', font: '13px system-ui' }}>Rendered from the extension's own components with sample data.</p>

      <h2 style={section}>Components</h2>
      <Components />

      <h2 style={section}>Screens</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
        <Frame title="Home"><PuffPanel screen="manual" onMinimize={noop} onControls={noop}>
          <HomeScreen workState="tired" workSeconds={2580} todaySeconds={13200} breaksToday={2} controls={controls} onTakeBreak={noop} onPause={noop} onResume={noop} />
        </PuffPanel></Frame>
        <Frame title="Home · paused"><PuffPanel screen="manual" onMinimize={noop} onControls={noop}>
          <HomeScreen workState="focused" workSeconds={1500} todaySeconds={13200} breaksToday={2} controls={paused} onTakeBreak={noop} onPause={noop} onResume={noop} />
        </PuffPanel></Frame>
        <Frame title="Suggestion · just finished something"><PuffPanel screen="proactive" onMinimize={noop} onControls={noop}>
          <ProactiveScreen workSeconds={2880} finished onTakeBreak={noop} onLater={noop} onPause={noop} />
        </PuffPanel></Frame>
        <Frame title="Suggestion · quiet moment"><PuffPanel screen="proactive" onMinimize={noop} onControls={noop}>
          <ProactiveScreen workSeconds={2880} finished={false} onTakeBreak={noop} onLater={noop} onPause={noop} />
        </PuffPanel></Frame>
        <Frame title="Hold your place"><PuffPanel screen="confirm" onMinimize={noop} onControls={noop}>
          <ConfirmScreen workState="tired" page={{ label: hold.label, source: hold.source }} note="" onNote={noop} onConfirm={noop} onBack={noop} />
        </PuffPanel></Frame>
        <Frame title="On a break"><PuffPanel screen="on_break" onMinimize={noop} onControls={noop}>
          <OnBreakScreen hold={hold} awaySeconds={420} onBack={noop} />
        </PuffPanel></Frame>
        <Frame title="Welcome back · after a late break"><PuffPanel screen="resume" onMinimize={noop} onControls={noop}>
          <ResumeScreen hold={hold} awaySeconds={900} afterRain onDone={noop} />
        </PuffPanel></Frame>
        <Frame title="Pause"><PuffPanel screen="pause" onMinimize={noop} onControls={noop}>
          <PauseScreen onPause={noop} onTurnOff={noop} onBack={noop} />
        </PuffPanel></Frame>
        <Frame title="Privacy and settings"><PuffPanel screen="controls" onMinimize={noop} onControls={noop}>
          <ControlsScreen controls={controls} tuck={false} onTuck={noop} onTiming={noop} onPause={noop} onResume={noop} onTurnOff={noop} onBack={noop} />
        </PuffPanel></Frame>
      </div>

      <h2 style={section}>Expressions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 150px)', gap: 20 }}>
        {MOODS.map(m => (
          <Frame key={m} title={m.replace('_', ' ')}><div style={{ width: 150, height: 125 }}><Cloud mood={m} season="autumn" afterRain={m === 'welcome'} /></div></Frame>
        ))}
      </div>

      <h2 style={section}>Seasons, during a break</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 150px)', gap: 20 }}>
        {SEASONS.map(s => (
          <Frame key={s} title={s}><div style={{ width: 150, height: 125 }}><Cloud mood="break" season={s} /></div></Frame>
        ))}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Board />)
