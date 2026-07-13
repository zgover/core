/**
 * Per-plugin bundle budgets (AGL-436).
 *
 *   node tools/scripts/check-plugin-budgets.mjs           # check
 *   node tools/scripts/check-plugin-budgets.mjs --update  # rebaseline
 *
 * Measures each first-party plugin's OWN minified code: esbuild-bundles
 * the client barrel with everything outside the plugin's directory left
 * external, so the number is the plugin's source weight — the thing a PR
 * can regress — independent of shared vendor chunks. Budgets live in
 * tools/plugin-budgets.json (measured baseline + 25% headroom); the check
 * fails when a plugin outgrows its budget, and `--update` re-baselines
 * after a deliberate size change.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const update = process.argv.includes('--update')
const budgetsPath = join(repoRoot, 'tools', 'plugin-budgets.json')

const { plugins } = JSON.parse(
  readFileSync(join(repoRoot, 'plugins.config.json'), 'utf8'),
)

const outDir = mkdtempSync(join(tmpdir(), 'aglyn-budget-'))
const sizes = {}
for (const plugin of plugins) {
  const libDir = plugin.package.replace('@aglyn/plugins-', 'libs/plugins/')
  const entry = join(repoRoot, libDir, 'src', 'index.ts')
  const outFile = join(outDir, `${plugin.id}.js`)
  // Everything not under the plugin's own directory stays external —
  // the measurement is the plugin's code, not its dependency graph.
  execFileSync(
    'npx',
    [
      'esbuild',
      entry,
      '--bundle',
      '--minify',
      '--format=esm',
      '--platform=browser',
      `--outfile=${outFile}`,
      '--packages=external',
      '--alias:@aglyn/aglyn=@aglyn/aglyn',
      '--log-level=silent',
      '--external:@aglyn/*',
      '--external:react',
      '--external:react/jsx-runtime',
      '--external:react-dom',
      '--loader:.svg=text',
    ],
    { cwd: repoRoot, stdio: 'pipe' },
  )
  sizes[plugin.id] = statSync(outFile).size
}

if (update) {
  const budgets = Object.fromEntries(
    Object.entries(sizes).map(([id, size]) => [
      id,
      { baseline: size, budget: Math.ceil((size * 1.25) / 1024) * 1024 },
    ]),
  )
  writeFileSync(budgetsPath, JSON.stringify(budgets, null, 2) + '\n')
  console.log(`Wrote ${budgetsPath}`)
  for (const [id, entry] of Object.entries(budgets)) {
    console.log(
      `  ${id.padEnd(16)} ${(entry.baseline / 1024).toFixed(1).padStart(8)} KB` +
        `  (budget ${(entry.budget / 1024).toFixed(0)} KB)`,
    )
  }
  process.exit(0)
}

const budgets = JSON.parse(readFileSync(budgetsPath, 'utf8'))
let failed = false
for (const [id, size] of Object.entries(sizes)) {
  const budget = budgets[id]?.budget
  const label = `${id.padEnd(16)} ${(size / 1024).toFixed(1).padStart(8)} KB`
  if (!budget) {
    console.log(`NEW:  ${label} — no budget yet (run with --update)`)
    failed = true
  } else if (size > budget) {
    console.log(
      `FAIL: ${label} > budget ${(budget / 1024).toFixed(0)} KB — ` +
        'trim the plugin or deliberately re-baseline with --update',
    )
    failed = true
  } else {
    console.log(`OK:   ${label} (budget ${(budget / 1024).toFixed(0)} KB)`)
  }
}
process.exit(failed ? 1 : 0)
