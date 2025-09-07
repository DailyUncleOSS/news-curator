#!/usr/bin/env node
import 'dotenv/config'
import { parseArgs, renderHelp } from './utils/args'
import { getEnvVar } from './utils/env'
import { getSourceFromUrl, truncateSummary } from './utils/text'
import { buildPrompt } from './core/prompt'
import { coerceResults, extractJsonArray, finalizeStatuses } from './core/selection'
import { createAdminClient, fetchReadyItems, updateSelectionResults } from './services/supabase'
import { callOpenRouter } from './services/openrouter'

function logJson(obj: unknown) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(obj))
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.help === true) {
    // eslint-disable-next-line no-console
    console.log(renderHelp())
    return
  }

  const hours = Number(args.hours ?? getEnvVar('NEWS_SELECT_HOURS', '48'))
  const limit = Number(args.limit ?? getEnvVar('NEWS_SELECT_LIMIT', '100'))
  const finalK = Number(args.final ?? getEnvVar('NEWS_SELECT_FINAL_K', '12'))
  const model = String(args.model ?? getEnvVar('OPENROUTER_MODEL', 'tngtech/deepseek-r1t2-chimera:free'))
  const apiKey = getEnvVar('OPENROUTER_API_KEY')
  const jsonOnly = Boolean(args.json)

  const dryRunRaw = (args['dry-run'] ?? (args as Record<string, unknown>)['dryRun'] ?? (args as Record<string, unknown>)['dryrun']) as string | boolean | undefined
  const dryRun = dryRunRaw === true || String(dryRunRaw).toLowerCase() === 'true'

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error('OPENROUTER_API_KEY is required')
    process.exit(1)
  }

  const startEvent = {
    action: 'news:select:batch:start',
    params: { hours, limit, finalK, model, dryRun },
    timestamp: new Date().toISOString(),
  }
  if (jsonOnly) logJson(startEvent)
  else console.log(`[start] hours=${hours} limit=${limit} k=${finalK} model=${model} dry=${dryRun}`)

  const admin = createAdminClient()
  const items = await fetchReadyItems(admin, hours, limit)
  if (items.length === 0) {
    const evt = { action: 'news:select:batch:nothing_to_do', count: 0, timestamp: new Date().toISOString() }
    if (jsonOnly) logJson(evt)
    else console.log('No items to process.')
    return
  }

  const prompt = buildPrompt(items, items.length, finalK)
  const raw = await callOpenRouter({ prompt, model, apiKey })
  const parsed = extractJsonArray(raw)
  const coerced = coerceResults(parsed)
  const updates = finalizeStatuses(items, coerced, finalK)
  if (!dryRun) await updateSelectionResults(updates, admin)

  const chosen = updates.filter((u) => u.queued_status === 'queued').length
  const skipped = updates.length - chosen

  const doneEvent = {
    action: dryRun ? 'news:select:batch:dry_run' : 'news:select:batch:completed',
    total: updates.length,
    chosen,
    skipped,
    finalK,
    dryRun,
    timestamp: new Date().toISOString(),
  }
  if (jsonOnly) logJson(doneEvent)
  else console.log(`[done] total=${updates.length} chosen=${chosen} skipped=${skipped} dry=${dryRun}`)

  if (dryRun && !jsonOnly) {
    const chosenUpdates = updates.filter((u) => u.queued_status === 'queued')
    console.log('\nDry-run selected items (not saved):')
    chosenUpdates.forEach((update, idx) => {
      const item = items.find((it) => it.id === update.id)
      if (!item) return
      const source = getSourceFromUrl(item.url)
      const summary = truncateSummary(item.summary ?? '', 400).replace(/\s+/g, ' ').trim()
      const reason = update.selection_reason || 'No reason provided'
      console.log(`${idx + 1}. ${item.title} - ${source}`)
      console.log(`Reason: ${reason}`)
      console.log(`Summary: ${summary}\n`)
    })
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      action: 'news:select:batch:error',
      error: String((err as any)?.message ?? err),
      timestamp: new Date().toISOString(),
    }),
  )
  process.exit(1)
})

