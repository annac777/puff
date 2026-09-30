// Layout iterations for the home screen, side by side. A scratch board for choosing a direction;
// not part of the extension or the style guide.
import { createRoot } from 'react-dom/client'
import './index.css'
import { Cloud, type Mood } from './Cloud'
import { PuffPanel, Sticker, Label } from './App'
import { heroTime } from './puff-bridge'

const noop = () => {}
type Props = { muted: boolean }
const WORK = 2580, TODAY = 13200, BREAKS = 2
const mood = (muted: boolean): Mood => (muted ? 'paused' : 'tired')

function Banner() {
  return (
    <div className="puff-sticker bg-[#FFF4CC] flex items-center justify-between px-3 py-2">
      <span className="puff-mono text-[11.5px] puff-ink">muted until 4:30 PM</span>
      <button className="puff-mono text-[11.5px] font-bold puff-ink">resume</button>
    </div>
  )
}
const Break = ({ className = '' }: { className?: string }) => (
  <button className={`puff-btn bg-[#FFD66B] text-[12.5px] px-3.5 h-9 ${className}`}>take a break</button>
)
const Today = ({ tilt = -2, className = '' }: { tilt?: number; className?: string }) => (
  <Sticker bg="#DCEFFA" tilt={tilt} className={className}>
    <div className="px-2.5 pt-2.5 pb-1.5"><Label>today</Label>
      <p className="text-[16px] font-extrabold puff-ink tabular-nums">{heroTime(TODAY)}</p></div>
  </Sticker>
)
const Breaks = ({ tilt = 2, className = '' }: { tilt?: number; className?: string }) => (
  <Sticker bg="#FCE3EA" tape="rgba(205,235,214,.9)" tilt={tilt} className={className}>
    <div className="px-2.5 pt-2.5 pb-1.5"><Label>breaks</Label>
      <p className="text-[16px] font-extrabold puff-ink tabular-nums">{BREAKS} ☕</p></div>
  </Sticker>
)
const Hero = ({ center = false, size = 34 }: { center?: boolean; size?: number }) => (
  <div className={center ? 'text-center' : ''}>
    <p className="font-extrabold puff-ink leading-none tabular-nums tracking-tight" style={{ fontSize: size }}>{heroTime(WORK)}</p>
    <p className="text-[12px] text-[#5A6480] mt-2 inline-block"><span className="puff-highlight">of good focus</span></p>
  </div>
)

// A · Centred stack: one column down the middle, everything on the same axis.
function A({ muted }: Props) {
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col items-center gap-3">
      <div className="w-[112px] h-[92px]"><Cloud mood={mood(muted)} /></div>
      <Hero center size={38} />
      {muted && <div className="self-stretch"><Banner /></div>}
      <div className="grid grid-cols-2 gap-3 self-stretch mt-2"><Today /><Breaks /></div>
      <Break className="self-stretch mt-1" />
    </div>
  )
}

// B · Same order as now, but every row spans the full width: stats split evenly, button full.
function B({ muted }: Props) {
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-[100px] h-[84px] flex-shrink-0"><Cloud mood={mood(muted)} /></div>
        <Hero />
      </div>
      {muted && <Banner />}
      <div className="grid grid-cols-2 gap-3 mt-2"><Today /><Breaks /></div>
      <Break className="w-full mt-1" />
    </div>
  )
}

// C · Stats as one receipt strip, so the lower half is one block, not two islands.
function C({ muted }: Props) {
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-[100px] h-[84px] flex-shrink-0"><Cloud mood={mood(muted)} /></div>
        <Hero />
      </div>
      {muted && <Banner />}
      <Sticker bg="#FFFFFF" className="mt-2">
        <div className="grid grid-cols-2 divide-x-2 divide-dashed divide-[#34405E]/30">
          <div className="px-3 py-2"><Label>today</Label><p className="text-[16px] font-extrabold puff-ink tabular-nums">{heroTime(TODAY)}</p></div>
          <div className="px-3 py-2"><Label>breaks</Label><p className="text-[16px] font-extrabold puff-ink tabular-nums">{BREAKS} ☕</p></div>
        </div>
      </Sticker>
      <Break className="w-full" />
    </div>
  )
}

// D · Two columns: Puff and the action on the left, the numbers on the right.
function D({ muted }: Props) {
  return (
    <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
      {muted && <Banner />}
      <div className="grid grid-cols-[104px_1fr] gap-x-4 items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="w-[104px] h-[88px]"><Cloud mood={mood(muted)} /></div>
          <Break className="w-full !px-1 !text-[12px] whitespace-nowrap" />
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <Hero size={32} />
          <Today tilt={-1.5} />
          <Breaks tilt={1.5} />
        </div>
      </div>
    </div>
  )
}

// E · The hero sits inside a big sky sticker with Puff; stats and action share the row below.
function E({ muted }: Props) {
  return (
    <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
      <Sticker bg="#DCEFFA" tape="rgba(255,214,107,.9)">
        <div className="flex items-center gap-1 px-2 py-2">
          <div className="w-[92px] h-[78px] flex-shrink-0"><Cloud mood={mood(muted)} /></div>
          <Hero size={32} />
        </div>
      </Sticker>
      {muted && <Banner />}
      <div className="flex items-stretch gap-2.5">
        <Breaks tilt={0} className="flex-1" />
        <Break className="flex-[1.3] h-auto" />
      </div>
      <p className="puff-mono text-[10.5px] text-[#5A6480] text-center -mt-1">{heroTime(TODAY)} today</p>
    </div>
  )
}

const VARIANTS: [string, string, (p: Props) => React.ReactNode][] = [
  ['A', 'centred stack', A], ['B', 'full-width rows', B], ['C', 'one receipt strip', C],
  ['D', 'two columns', D], ['E', 'hero card', E],
]

function Board() {
  return (
    <div style={{ padding: 32, background: '#EDE9E3', fontFamily: 'Outfit, system-ui' }}>
      {[false, true].map(muted => (
        <div key={String(muted)} style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: 40 }}>
          {VARIANTS.map(([id, name, V]) => (
            <div key={id}>
              <p className="puff-mono text-[13px] puff-ink mb-3"><b>{id}</b> · {name}{muted ? ' · muted' : ''}</p>
              <PuffPanel screen="manual" onMinimize={noop} onControls={noop} mute={{ muted, onClick: noop }}>
                <V muted={muted} />
              </PuffPanel>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Board />)
