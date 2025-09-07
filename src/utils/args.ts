export type ArgValue = string | boolean

export interface ParsedArgs {
  _: string[]
  [key: string]: ArgValue
}

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { _: [] }
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith("-")) {
      out._.push(token)
      continue
    }
    if (token === "-h" || token === "--help") {
      out.help = true
      continue
    }
    if (token.startsWith("--")) {
      const [k, ...rest] = token.slice(2).split("=")
      const v = rest.length ? rest.join("=") : true
      out[k] = v as ArgValue
      continue
    }
    // short flags, combine like -abc or -k=12
    if (token.startsWith("-")) {
      const body = token.slice(1)
      const eq = body.indexOf("=")
      if (eq >= 0) {
        const key = body.slice(0, eq)
        const value = body.slice(eq + 1)
        out[key] = value
      } else {
        for (const ch of body) {
          out[ch] = true
        }
      }
    }
  }
  return out
}

export function renderHelp() {
  return `news-curator — AI-assisted news selection\n\nUsage:\n  news-curator [options]\n\nOptions:\n  --hours <n>         Look back N hours (default: 48)\n  --limit <n>         Fetch at most N items (default: 100)\n  --final <k>         Target number to queue (default: 12)\n  --model <name>      OpenRouter model (env OPENROUTER_MODEL)\n  --dry-run           Do not write to DB; print selections\n  --json              Emit JSON logs only\n  --help, -h          Show help\n\nEnvironment:\n  SUPABASE_URL              Supabase project URL (required)\n  SUPABASE_SERVICE_ROLE_KEY Supabase service key (required)\n  OPENROUTER_API_KEY        OpenRouter API key (required)\n  OPENROUTER_MODEL          Default model name\n  NEWS_SELECT_HOURS         Default hours fallback\n  NEWS_SELECT_LIMIT         Default limit fallback\n  NEWS_SELECT_FINAL_K       Default K fallback\n`
}

