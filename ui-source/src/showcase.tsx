// A design board: every screen and every expression, rendered with fixed sample data, so the
// current version can be reviewed side by side and exported for Figma. Not part of the extension.
import { createRoot } from 'react-dom/client'
import './index.css'
import { Cloud, type Mood, type Season } from './Cloud'
import { PuffPanel, HomeScreen, ProactiveScreen, ConfirmScreen, OnBreakScreen, ResumeScreen, PauseScreen, ControlsScreen } from './App'

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

function Board() {
  const section = { font: '700 18px system-ui', color: '#1A1A1A', margin: '40px 0 16px' } as const
  return (
    <div style={{ padding: 40, background: '#EDE9E3', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <h1 style={{ font: '800 26px system-ui', margin: 0 }}>Puff — design board</h1>
      <p style={{ color: '#7A8494', margin: '6px 0 0', font: '13px system-ui' }}>Rendered from the extension's own components with sample data.</p>

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
          <ControlsScreen controls={controls} onTiming={noop} onPause={noop} onResume={noop} onTurnOff={noop} onBack={noop} />
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
