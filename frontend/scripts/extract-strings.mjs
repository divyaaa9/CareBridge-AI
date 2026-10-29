// Collects every t('...') English string in src/ so the app can pre-translate all screens in the background.
// This does NOT translate anything by hand. It only lists the English source text. Runs on predev / prebuild.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [] })
const re = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g
const out = new Set()
for (const f of walk('src')) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(re)) { const v = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'); if (v.length > 1 && !v.includes('${')) out.add(v) }
}
writeFileSync('src/strings.json', JSON.stringify([...out].sort(), null, 1))
console.log(`extracted ${out.size} strings`)
