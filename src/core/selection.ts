import { FeedItemRow, ModelResultItem, QueuedStatus, UpdateItem } from "../types"

export function extractJsonArray(text: string) {
  const start = text.indexOf("[")
  const end = text.lastIndexOf("]")
  if (start === -1 || end === -1 || end <= start) throw new Error("Model did not return a JSON array")
  const slice = text.slice(start, end + 1)
  return JSON.parse(slice) as unknown
}

export function coerceResults(raw: unknown): ModelResultItem[] {
  if (!Array.isArray(raw)) throw new Error("Parsed JSON is not an array")
  const allowed: ReadonlyArray<QueuedStatus> = [
    "queued",
    "skipped",
    "duplicate",
    "low_quality",
    "clickbait",
    "out_of_scope",
  ]
  const result: ModelResultItem[] = []
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue
    const e = entry as Record<string, unknown>
    const id = typeof e.id === "string" ? e.id : ""
    const title = typeof e.title === "string" ? e.title : ""
    const url = typeof e.url === "string" ? e.url : ""
    const reason = typeof e.reason === "string" ? e.reason : undefined
    const qsRaw = typeof e.queued_status === "string" ? e.queued_status : "skipped"
    const queued_status = (allowed.includes(qsRaw as QueuedStatus) ? (qsRaw as QueuedStatus) : "skipped")
    if (!id || !title || !url) continue
    result.push({ id, title, url, reason, queued_status })
  }
  return result
}

export function finalizeStatuses(
  items: FeedItemRow[],
  modelItems: ModelResultItem[],
  finalK: number
): UpdateItem[] {
  const idToModel = new Map<string, ModelResultItem>()
  for (const mi of modelItems) idToModel.set(mi.id, mi)

  const queuedIds: string[] = []
  const updates: UpdateItem[] = items.map((it) => {
    const picked = idToModel.get(it.id)
    const proposed = picked?.queued_status ?? (picked ? "queued" : "skipped")
    return {
      id: it.id,
      queued_status: proposed as QueuedStatus,
      selection_reason: picked?.reason ?? null,
    }
  })

  for (const u of updates) if (u.queued_status === "queued") queuedIds.push(u.id)

  if (queuedIds.length !== finalK) {
    const modelIdOrder = modelItems.map((m) => m.id)
    const idToUpdate = new Map<string, UpdateItem>()
    for (const u of updates) idToUpdate.set(u.id, u)

    // Reset all to skipped
    for (const u of updates) u.queued_status = "skipped"

    let assigned = 0
    for (const id of modelIdOrder) {
      const u = idToUpdate.get(id)
      if (u && assigned < finalK) {
        u.queued_status = "queued"
        assigned++
      }
    }
    if (assigned < finalK) {
      for (const it of items) {
        if (assigned >= finalK) break
        const u = idToUpdate.get(it.id)
        if (u && u.queued_status !== "queued") {
          u.queued_status = "queued"
          assigned++
        }
      }
    }
  }

  return updates
}

