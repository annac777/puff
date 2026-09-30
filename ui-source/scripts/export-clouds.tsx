/* @jsxRuntime automatic */
// Writes every expression, and the four break seasons, as standalone SVG files for Figma.
// Usage: npx tsx scripts/export-clouds.tsx <output-folder>
// SVGs are static: CSS animation does not travel into Figma, so each file is the resting pose.
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Cloud, type Mood, type Season } from '../src/Cloud'

const out = process.argv[2]
if (!out) throw new Error('Give an output folder.')
mkdirSync(out, { recursive: true })

const MOODS: Mood[] = ['idle', 'focused', 'tired', 'very_tired', 'sleepy', 'nudge', 'finished', 'saving', 'break', 'paused', 'welcome', 'dragged', 'petted']
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

function save(name: string, markup: string) {
  // Figma needs the namespace and a real size; the component relies on its container for both.
  const svg = markup
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200" ')
    .replace(/ class="[^"]*"/g, '')
  writeFileSync(path.join(out, `${name}.svg`), svg)
}

MOODS.forEach((m, i) => save(`${String(i + 1).padStart(2, '0')}-${m}`, renderToStaticMarkup(<Cloud mood={m} season="autumn" />)))
save('11b-welcome-after-rain', renderToStaticMarkup(<Cloud mood="welcome" afterRain />))
SEASONS.forEach(s => save(`break-${s}`, renderToStaticMarkup(<Cloud mood="break" season={s} />)))
console.log(`Wrote ${MOODS.length + 1 + SEASONS.length} SVGs to ${out}`)
