import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { FeedItemRow, QueuedStatus, UpdateItem } from "../types"

export function createAdminClient(env = process.env): SupabaseClient {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function fetchReadyItems(
  admin: SupabaseClient,
  hours = 48,
  limit = 100
) {
  const sinceIso = new Date(Date.now() - hours * 3600 * 1000).toISOString()
  const { data, error } = await admin
    .from("feed_items")
    .select("id,title,url,summary,published_at")
    .eq("status", "ready")
    .gte("published_at", sinceIso)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as FeedItemRow[]
}

export async function updateSelectionResults(
  updates: UpdateItem[],
  admin: SupabaseClient
) {
  if (updates.length === 0) return { count: 0 }
  let success = 0
  // Update sequentially to keep it simple and predictable
  for (const u of updates) {
    const { error } = await admin
      .from("feed_items")
      .update({
        queued_status: u.queued_status as QueuedStatus,
        selection_reason: u.selection_reason,
        status: "completed",
      })
      .eq("id", u.id)
    if (!error) success++
  }
  return { count: success }
}

