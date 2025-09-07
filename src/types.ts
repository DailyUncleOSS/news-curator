export interface FeedItemRow {
  id: string
  title: string
  url: string
  summary: string | null
  published_at: string | null
}

export type QueuedStatus =
  | "queued"
  | "skipped"
  | "duplicate"
  | "low_quality"
  | "clickbait"
  | "out_of_scope"

export interface ModelResultItem {
  id: string
  title: string
  url: string
  reason?: string
  queued_status: QueuedStatus
}

export interface UpdateItem {
  id: string
  queued_status: QueuedStatus
  selection_reason: string | null
}

