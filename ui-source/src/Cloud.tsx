// Puff, redrawn. Every expression is a real state of the product, and every animation is CSS so it
// costs the page nothing and stops under prefers-reduced-motion (see index.css, .pf-* rules).

export type Mood =
  | 'idle' | 'focused' | 'tired' | 'very_tired' | 'sleepy'
  | 'nudge' | 'pleading' | 'finished' | 'saving' | 'break' | 'paused' | 'welcome'
  | 'dragged' | 'petted'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export function seasonFor(date = new Date()): Season {
  const m = date.getMonth()
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}

const INK = '#34405E'  // the same deep ink as the panel's outlines, never pure black
const BLUSH = '#F4A6B6'
const FILL: Record<Mood, string> = {
  idle: '#86CCE8', focused: '#7CC2E0', tired: '#93BBCE', very_tired: '#9AB2C1', sleepy: '#A3B3BF',
  nudge: '#86CCE8', pleading: '#8FA5B5', finished: '#86CCE8', saving: '#86CCE8', break: '#86CCE8', paused: '#9EC9DC',
  welcome: '#86CCE8', dragged: '#86CCE8', petted: '#86CCE8',
}
// Heavier moods sit lower and flatter, as if the cloud has taken on water.
const SAG: Partial<Record<Mood, number>> = { tired: 1, very_tired: 3, sleepy: 4, pleading: 4 }

function BodyShapes({ sag }: { sag: number }) {
  return (
    <>
      <rect x="14" y={46 + sag} width="92" height={34 - sag} rx={17 - sag / 2} />
      <circle cx="38" cy={50 + sag} r="20" />
      <circle cx="62" cy={40 + sag * 1.4} r={26 - sag / 2} />
      <circle cx="86" cy={52 + sag} r="18" />
    </>
  )
}

// Only the outside of the cloud is outlined. Stroking each puff would draw lines where they
// overlap and break the silhouette, so the shapes are painted twice: once in ink with a thick
// stroke, then again in the fill colour on top, which covers every inner edge.
function Body({ fill, sag = 0 }: { fill: string; sag?: number }) {
  return (
    <>
      <g fill={INK} stroke={INK} strokeWidth="6" strokeLinejoin="round"><BodyShapes sag={sag} /></g>
      <g fill={fill}><BodyShapes sag={sag} /></g>
    </>
  )
}

/** A small attached shape — an arm, a hand — outlined the same way so it reads as part of Puff. */
function Limb({ cx, cy, rx, ry, fill }: { cx: number; cy: number; rx: number; ry: number; fill: string }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} stroke={INK} strokeWidth="4.4" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
    </>
  )
}

const Shine = ({ o = 0.45 }: { o?: number }) => <ellipse cx="52" cy="28" rx="10" ry="5" fill="#fff" opacity={o} />
const Cheeks = ({ o = 0.5, y = 67 }: { o?: number; y?: number }) => (
  <>
    <ellipse cx="42" cy={y} rx="5" ry="3" fill={BLUSH} opacity={o} />
    <ellipse cx="78" cy={y} rx="5" ry="3" fill={BLUSH} opacity={o} />
  </>
)
const OpenEyes = ({ r = 4.2, y = 58, blink = true }: { r?: number; y?: number; blink?: boolean }) => (
  <>
    <g className={blink ? 'pf-blink pf-fb' : undefined}>
      <circle cx="50" cy={y} r={r} fill={INK} />
      <circle cx="70" cy={y} r={r} fill={INK} />
    </g>
    <circle cx="51.3" cy={y - 1.4} r={r / 3} fill="#fff" />
    <circle cx="71.3" cy={y - 1.4} r={r / 3} fill="#fff" />
  </>
)
const HappyEyes = ({ y = 60 }: { y?: number }) => (
  <path d={`M46 ${y} Q50 ${y - 4} 54 ${y} M66 ${y} Q70 ${y - 4} 74 ${y}`} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
)
const Smile = ({ d = 'M55 66 Q60 71 65 66' }: { d?: string }) => (
  <path d={d} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
)
const Shadow = ({ rx = 32 }: { rx?: number }) => <ellipse cx="60" cy="89" rx={rx} ry="3.5" fill="#1A3A48" opacity=".08" />

// ─── Weather: follows how long someone has worked ─────────────────────────────

function Weather({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'idle':
      return (
        <g className="pf-spin">
          <circle cx="98" cy="20" r="9" fill="#FAC775" />
          <path d="M98 5 v4 M98 31 v4 M83 20 h4 M109 20 h4 M87.5 9.5 l3 3 M105.5 27.5 l3 3 M87.5 30.5 l3 -3 M105.5 12.5 l3 -3"
            stroke="#FAC775" strokeWidth="2" strokeLinecap="round" />
        </g>
      )
    case 'focused':
      return (
        <>
          <path className="pf-twinkle" d="M4 30 q9 -4 18 0 t18 0" stroke="#C9CFD4" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path className="pf-twinkle" style={{ animationDelay: '.9s' }} d="M84 18 q7 -3 14 0 t14 0" stroke="#C9CFD4" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )
    case 'tired':
      return (
        <>
          <ellipse className="pf-ripple pf-fb" cx="60" cy="95" rx="16" ry="2.2" fill="none" stroke="#7CB8D6" strokeWidth="1.1" />
          {[34, 52, 70, 86].map((x, i) => (
            <path key={x} className="pf-drop" style={{ animationDelay: `${[0, 0.45, 0.2, 0.7][i]}s` }}
              d={`M${x} 82 v5`} stroke="#7CB8D6" strokeWidth="2" strokeLinecap="round" />
          ))}
        </>
      )
    case 'very_tired':
    case 'pleading':
      return (
        <>
          {mood === 'very_tired' && <path className="pf-flash" d="M100 6 L91 24 H98 L92 40 L108 18 H100 L106 6 Z" fill="#FAC775" />}
          <ellipse className="pf-ripple pf-fb" cx="60" cy="95" rx="20" ry="2.6" fill="none" stroke="#6FA9C8" strokeWidth="1.2" />
          {[24, 38, 52, 66, 80, 94].map((x, i) => (
            <path key={x} className="pf-drop-fast" style={{ animationDelay: `${[0, 0.25, 0.1, 0.4, 0.2, 0.5][i]}s` }}
              d={`M${x} 82 l-1.5 7`} stroke="#5E97B8" strokeWidth="2.2" strokeLinecap="round" />
          ))}
        </>
      )
    case 'sleepy':
      return (
        <>
          {/* The moon sits left so the zzz can rise on the right. */}
          <path d="M20 6 a9 9 0 1 0 6 16 a7 7 0 1 1 -6 -16 z" fill="#F5D78E" />
          <circle className="pf-twinkle" cx="42" cy="6" r="1.2" fill="#C3CEDA" />
          <circle className="pf-twinkle" style={{ animationDelay: '.7s' }} cx="6" cy="34" r="1.4" fill="#C3CEDA" />
          <circle className="pf-twinkle" style={{ animationDelay: '1.3s' }} cx="112" cy="44" r="1.1" fill="#C3CEDA" />
        </>
      )
    default:
      return null
  }
}

// ─── Seasons: what drifts past during a break, by the real date ──────────────

const PETAL = 'M0 -5 C4 -2 3 3 0 5 C-3 3 -4 -2 0 -5 Z'
const LEAF = 'M0 -6 L1.2 -2.4 L4.8 -3.6 L3 -.2 L6 1.2 L2 2.2 L2.6 5 L0 3.4 L-2.6 5 L-2 2.2 L-6 1.2 L-3 -.2 L-4.8 -3.6 L-1.2 -2.4 Z'

function SeasonLayer({ season }: { season: Season }) {
  const spots = [[24, 0], [62, 1.4], [96, 2.8], [44, 3.6]] as const
  if (season === 'summer') {
    return (
      <>
        {[[16, 30, 0], [104, 40, 1], [92, 12, 2], [24, 84, 1.5]].map(([x, y, d]) => (
          <circle key={`${x}-${y}`} className="pf-firefly" style={{ animationDelay: `${d}s` }} cx={x} cy={y} r="1.8" fill="#F5C842" />
        ))}
      </>
    )
  }
  if (season === 'winter') {
    return (
      <>
        {[[18, 0], [48, 1], [82, 2], [104, 3], [64, .5]].map(([x, d]) => (
          <circle key={x} className="pf-snow" style={{ animationDelay: `${d}s` }} cx={x} cy="0" r="1.9" fill="#C9DDEA" />
        ))}
      </>
    )
  }
  const d = season === 'spring' ? PETAL : LEAF
  const fill = season === 'spring' ? '#F7B9C8' : '#E8834E'
  const cls = season === 'spring' ? 'pf-petal' : 'pf-leaf'
  return (
    <>
      {spots.map(([x, delay], i) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <path className={cls} style={{ animationDelay: `${delay}s` }} d={d} fill={i === 3 && season === 'autumn' ? '#D9A441' : fill} />
        </g>
      ))}
    </>
  )
}

// ─── The character ────────────────────────────────────────────────────────────

export function Cloud({ mood, season = seasonFor(), afterRain = false, weather = true }: {
  mood: Mood
  season?: Season
  /** Came back from a break taken late, after the rain had started. */
  afterRain?: boolean
  /** Small instances (the header mark) skip the weather. */
  weather?: boolean
}) {
  const fill = FILL[mood]
  const sag = SAG[mood] ?? 0

  return (
    <svg viewBox="0 0 120 100" className="w-full h-full pf-anim" style={{ overflow: 'visible' }} aria-hidden="true">
      {weather && <Weather mood={mood} />}
      {mood === 'break' && <SeasonLayer season={season} />}
      {mood === 'welcome' && afterRain && (
        <g>
          {['#F09595', '#FAC775', '#97C459', '#85B7EB'].map((c, i) => (
            <path key={c} className="pf-rainbow" style={{ animationDelay: `${i * 0.15}s` }}
              d={`M${14 + i * 5} 80 A${46 - i * 5} ${46 - i * 5} 0 0 1 ${106 - i * 5} 80`} stroke={c} strokeWidth="4" fill="none" />
          ))}
        </g>
      )}
      {mood !== 'dragged' && <Shadow rx={mood === 'nudge' ? 30 : sag > 2 ? 34 : 32} />}
      <Character mood={mood} fill={fill} sag={sag} season={season} />
    </svg>
  )
}

function Character({ mood, fill, sag, season }: { mood: Mood; fill: string; sag: number; season: Season }) {
  switch (mood) {
    case 'idle':
      return (
        <g className="pf-bob">
          <Body fill={fill} /><Shine /><Cheeks /><OpenEyes /><Smile />
        </g>
      )
    case 'focused':
      return (
        <g className="pf-lean pf-vb">
          <Body fill={fill} /><Shine o={0.4} />
          <g className="pf-scan pf-fb">
            <ellipse cx="50" cy="59" rx="3.8" ry="3.2" fill={INK} />
            <ellipse cx="70" cy="59" rx="3.8" ry="3.2" fill={INK} />
          </g>
          <Smile d="M56 67 Q60 69 64 67" />
        </g>
      )
    case 'tired':
      return (
        <g className="pf-breath pf-vb">
          <Body fill={fill} sag={sag} /><Shine o={0.3} />
          <path className="pf-slowblink pf-fb" d="M45.8 59 a4.2 4.2 0 0 0 8.4 0 z M65.8 59 a4.2 4.2 0 0 0 8.4 0 z" fill={INK} />
          <path d="M45 59 h10 M65 59 h10 M56 68 h8" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )
    case 'very_tired':
      return (
        <g className="pf-breath pf-vb">
          <Body fill={fill} sag={sag} />
          <path className="pf-squint pf-fb" d="M46.3 60 a3.7 2.4 0 0 0 7.4 0 z M66.3 60 a3.7 2.4 0 0 0 7.4 0 z" fill={INK} />
          <path d="M45.5 60 h9 M65.5 60 h9" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <ellipse className="pf-yawn pf-fb" cx="60" cy="69" rx="2.4" ry="2.4" fill={INK} />
        </g>
      )
    case 'sleepy':
      return (
        <>
          <g className="pf-nod pf-vb">
            <Body fill={fill} sag={sag} />
            <path d="M46 62 Q50 65 54 62 M66 62 Q70 65 74 62 M57.5 70 h5" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </g>
          {[[90, 34, 12, 0], [96, 26, 9, 1], [101, 19, 7, 2]].map(([x, y, s, d]) => (
            <text key={x} className="pf-zz" style={{ animationDelay: `${d}s` }} x={x} y={y} fontSize={s} fontWeight="600" fill="#7C95A5">z</text>
          ))}
        </>
      )
    case 'nudge':
      return (
        <>
          <g className="pf-hop pf-vb">
            <Body fill={fill} /><Shine />
            <g className="pf-wave"><Limb cx={100} cy={50} rx={7} ry={5.5} fill={fill} /></g>
            <Cheeks o={0.55} /><OpenEyes blink={false} />
            <path d="M54 65 Q60 72 66 65 Z" fill={INK} />
          </g>
        </>
      )
    case 'pleading':
      // Long overdue: a soaked, sagging cloud looking straight at you with wet eyes. The alert
      // badge is the one place Puff uses a symbol, because this is the one time it insists.
      return (
        <>
          <g className="pf-alert pf-fb">
            <circle cx="22" cy="22" r="9.5" fill="#FFD66B" stroke={INK} strokeWidth="2.2" />
            <rect x="20.4" y="15" width="3.2" height="9" rx="1.6" fill={INK} />
            <circle cx="22" cy="27.6" r="1.8" fill={INK} />
          </g>
          <g className="pf-breath pf-vb">
            <Body fill={fill} sag={sag} />
            <path d="M44.5 50 Q49 49 53.5 46.5 M66.5 46.5 Q71 49 75.5 50" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {[50, 70].map(x => (
              <g key={x}>
                <circle cx={x} cy="59" r="6.6" fill={INK} />
                <circle cx={x + 2.1} cy="56.6" r="2.6" fill="#fff" />
                <circle cx={x - 2.2} cy="61.4" r="1.2" fill="#fff" />
                <path d={`M${x - 7} 63 Q${x} 68.5 ${x + 7} 63`} stroke="#BFE6F7" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            ))}
            <path d="M55 72 q2.5 -2.4 5 0 q2.5 2.4 5 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <ellipse cx="41" cy="68" rx="4.5" ry="2.6" fill={BLUSH} opacity=".45" />
            <ellipse cx="79" cy="68" rx="4.5" ry="2.6" fill={BLUSH} opacity=".45" />
            <path className="pf-tear pf-fb" d="M43.5 64 q-3.4 5.2 0 7 q3.4 -1.8 0 -7 z" fill="#A9DBF2" />
            <path className="pf-tear pf-fb" style={{ animationDelay: '1.1s' }} d="M76.5 64 q-3.4 5.2 0 7 q3.4 -1.8 0 -7 z" fill="#A9DBF2" />
          </g>
        </>
      )
    case 'finished':
      return (
        <>
          {[[24, 10, '#F5C842', 0], [92, 8, '#F4A6B6', 0.5], [58, 4, '#7CC2E0', 1], [40, 6, '#A7E3B0', 1.3]].map(([x, y, c, d]) => (
            <rect key={String(x)} className="pf-confetti" style={{ animationDelay: `${d}s` }} x={x as number} y={y as number} width="4" height="7" rx="1" fill={c as string} />
          ))}
          <g className="pf-jump pf-vb">
            <Body fill={fill} /><Shine /><HappyEyes />
            <path d="M53 65 Q60 74 67 65 Z" fill={INK} /><Cheeks o={0.6} />
          </g>
        </>
      )
    case 'saving':
      return (
        <g className="pf-hug pf-vb">
          <Body fill={fill} /><Shine /><HappyEyes />
          <Smile d="M56 66 Q60 69 64 66" />
          <path d="M53 70 h14 v16 l-7 -5 -7 5 z" fill="#F5C842" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="49.5" cy="78" rx="6" ry="4.6" fill="#1A3A48" opacity=".14" />
          <ellipse cx="73.5" cy="78" rx="6" ry="4.6" fill="#1A3A48" opacity=".14" />
          <Limb cx={48} cy={76} rx={6} ry={5} fill={fill} />
          <Limb cx={72} cy={76} rx={6} ry={5} fill={fill} />
          <ellipse cx="46.5" cy="74.5" rx="2.4" ry="1.4" fill="#fff" opacity=".35" />
          <ellipse cx="70.5" cy="74.5" rx="2.4" ry="1.4" fill="#fff" opacity=".35" />
        </g>
      )
    case 'break':
      return (
        <>
          <path className="pf-steam" d="M84 52 q3 -4 0 -8 q-3 -4 0 -8" stroke="#B4B2A9" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path className="pf-steam" style={{ animationDelay: '1.2s' }} d="M90 52 q3 -4 0 -8 q-3 -4 0 -8" stroke="#B4B2A9" strokeWidth="2" fill="none" strokeLinecap="round" />
          <g className="pf-sip">
            <Body fill={fill} /><Shine />
            {season === 'winter' && (
              <>
                <path d="M36 34 Q60 4 88 34 Z" fill="#F08A8A" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
                <circle cx="88" cy="34" r="4" fill="#fff" stroke={INK} strokeWidth="1.8" />
                <rect x="32" y="31" width="58" height="7" rx="3.5" fill="#fff" stroke={INK} strokeWidth="1.8" />
              </>
            )}
            <HappyEyes />
            <ellipse cx="42" cy="66" rx="5.5" ry="3.2" fill={BLUSH} opacity=".6" />
            <ellipse cx="78" cy="66" rx="5.5" ry="3.2" fill={BLUSH} opacity=".6" />
            <Smile d="M56 67 Q60 70 64 67" />
          </g>
          <path d="M95 59 a4 4 0 0 1 0 8" stroke={INK} strokeWidth="2.2" fill="none" />
          <path d="M79 56 h16 l-2 14 a4 4 0 0 1 -4 3 h-4 a4 4 0 0 1 -4 -3 z" fill="#FFFBF4" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </>
      )
    case 'paused':
      return (
        <>
          <text className="pf-note" x="94" y="36" fontSize="13" fill="#9FA8DA">♪</text>
          <text className="pf-note" style={{ animationDelay: '1.4s' }} x="100" y="30" fontSize="10" fill="#9FA8DA">♫</text>
          <g className="pf-sway pf-vb">
            <Body fill={fill} />
            <path d="M30 46 Q62 6 94 46" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <rect x="23" y="44" width="11" height="16" rx="5.5" fill="#F9C9D6" stroke={INK} strokeWidth="2" />
            <rect x="90" y="44" width="11" height="16" rx="5.5" fill="#F9C9D6" stroke={INK} strokeWidth="2" />
            <path d="M46 60 Q50 63 54 60 M66 60 Q70 63 74 60" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <Smile d="M56 68 Q60 70 64 68" />
          </g>
        </>
      )
    case 'welcome':
      return (
        <>
          <path className="pf-twinkle-star pf-fb" d="M100 14 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8 z" fill="#F5C842" />
          <path className="pf-twinkle-star pf-fb" style={{ animationDelay: '.7s' }} d="M18 30 l1.3 3 3 1.3 -3 1.3 -1.3 3 -1.3 -3 -3 -1.3 3 -1.3 z" fill="#F5C842" />
          <g className="pf-jump pf-vb">
            <Body fill={fill} /><Shine /><Cheeks o={0.55} />
            <OpenEyes r={4.6} y={57.5} />
            <path d="M54 65.5 Q60 72.5 66 65.5 Z" fill={INK} />
          </g>
        </>
      )
    case 'dragged':
      return (
        <>
          <g className="pf-wobble pf-vb">
            <Body fill={fill} /><Shine />
            <circle cx="50" cy="57" r="5" fill="#fff" stroke={INK} strokeWidth="1.6" />
            <circle cx="70" cy="57" r="5" fill="#fff" stroke={INK} strokeWidth="1.6" />
            <circle cx="50" cy="57" r="2.2" fill={INK} /><circle cx="70" cy="57" r="2.2" fill={INK} />
            <ellipse cx="60" cy="68" rx="3" ry="3.6" fill={INK} />
            <path d="M45 47.5 Q50 44 55 47 M65 47 Q70 44 75 47.5" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </>
      )
    case 'petted':
      return (
        <>
          <path className="pf-heart pf-fb" d="M96 30 c-2 -3 -7 -1 -5 3 l5 5 5 -5 c2 -4 -3 -6 -5 -3 z" fill={BLUSH} />
          <path className="pf-heart pf-fb" style={{ animationDelay: '1.1s' }} d="M24 34 c-1.5 -2.2 -5 -.8 -3.7 2.2 l3.7 3.7 3.7 -3.7 c1.3 -3 -2.2 -4.4 -3.7 -2.2 z" fill={BLUSH} />
          <g className="pf-squish pf-vb">
            <Body fill={fill} /><Shine />
            <ellipse cx="41" cy="66" rx="6" ry="3.4" fill={BLUSH} opacity=".7" />
            <ellipse cx="79" cy="66" rx="6" ry="3.4" fill={BLUSH} opacity=".7" />
            <path d="M45 58 l5 3 -5 3 M75 58 l-5 3 5 3" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Smile />
          </g>
        </>
      )
  }
}

/** A still, flat mark for the panel header. */
export function CloudMark() {
  return (
    <svg width="20" height="16" viewBox="14 14 92 70" aria-hidden="true">
      <Body fill="#86CCE8" />
    </svg>
  )
}
