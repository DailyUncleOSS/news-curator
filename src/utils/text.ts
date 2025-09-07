export function truncateSummary(text: string | null | undefined, max = 400) {
  if (!text) return ""
  if (text.length <= max) return text
  return text.slice(0, max)
}

export function getSourceFromUrl(inputUrl: string) {
  try {
    const host = new URL(inputUrl).hostname
    return host.replace(/^www\./, "")
  } catch {
    return inputUrl
  }
}

