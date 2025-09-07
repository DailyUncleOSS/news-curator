# News Curator

AI‑assisted news selection CLI, designed for open source use. It fetches recent news items from a Supabase table, asks an LLM (via OpenRouter) to rank and deduplicate, then updates each item with a queued status. Includes a safe dry‑run mode that prints chosen items without writing to the database.
By [DailyUncle.com](https://dailyuncle.com).
ภาษาไทยอยู่ด้านล่าง

## Features

- Structured prompt (TH) optimized for technology/science/innovation news
- Dedupes and limits final picks to a fixed `K`
- Dry‑run mode for previewing selections
- JSON log output for pipelines
- Supabase integration using service role key

## Requirements

- Node.js 18+
- Supabase project with a `feed_items` table
- OpenRouter API key

## Install

Clone the repo and install dependencies:

```
npm install
```

Copy `.env.example` to `.env` and fill values:

```
cp .env.example .env
```
## Live Demo
https://dailyuncle.com
## Configure

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key
- `OPENROUTER_API_KEY`: OpenRouter API key

Optional defaults:

- `OPENROUTER_MODEL` (default: `tngtech/deepseek-r1t2-chimera:free`)
- `NEWS_SELECT_HOURS` (default: `48`)
- `NEWS_SELECT_LIMIT` (default: `100`)
- `NEWS_SELECT_FINAL_K` (default: `12`)

## Build

```
npm run build
```

This creates the CLI at `bin/news-curator.js` which loads `dist/index.js`.

## Usage

Run with Node (requires build):

```
news-curator --dry-run
```

Or during development without building:

```
npx tsx src/index.ts --dry-run
```

Options:

```
--hours <n>    Look back N hours (default: 48)
--limit <n>    Fetch at most N items (default: 100)
--final <k>    Target number to queue (default: 12)
--model <name> OpenRouter model (env OPENROUTER_MODEL)
--dry-run      Do not write to DB; print selections
--json         Emit JSON logs only
--help         Show help
```

Example (dry‑run):

```
news-curator --hours 36 --limit 80 --final 12 --dry-run
```

## Supabase schema

Minimum required columns on `feed_items` (types shown for reference):

- `id` (uuid or text, primary key)
- `title` (text)
- `url` (text)
- `summary` (text, nullable)
- `published_at` (timestamp with time zone, nullable)
- `status` (text) — expected values include `ready` and `completed`
- `queued_status` (text) — one of `queued|skipped|duplicate|low_quality|clickbait|out_of_scope`
- `selection_reason` (text, nullable)

Example SQL (adjust types/constraints as needed):

```
-- ids may be text or uuid depending on your pipeline
create table if not exists public.feed_items (
  id text primary key,
  title text not null,
  url text not null,
  summary text,
  published_at timestamptz,
  status text not null default 'ready',
  queued_status text,
  selection_reason text
);
```

## Prompt

The selection prompt (Thai) is tailored to pick high‑quality, non‑duplicative, tech/science/innovation news. It instructs the model to return only a strict JSON array and to label each item with a `queued_status` and short `reason`.

## Notes

- The tool adjusts to ensure exactly `K` items are marked `queued` per run.
- If the model returns fewer than `K`, it fills from the input order to reach `K`.
- Set `--dry-run` while tuning prompts and defaults.

---

## (TH) คำอธิบายภาษาไทย

News Curator เป็น CLI ช่วยคัดเลือกข่าวด้วย AI ออกแบบให้เปิดเผยซอร์ส ใช้งานง่าย และตั้งค่าได้ โดยจะดึงข่าวล่าสุดจาก Supabase (`feed_items`) ส่งให้โมเดลผ่าน OpenRouter เพื่อคัดและตัดซ้ำ แล้วอัปเดตสถานะที่ฐานข้อมูล มีโหมด Dry‑run สำหรับทดสอบโดยไม่เขียนข้อมูลจริง

จุดเด่น:

- Prompt ภาษาไทย เน้นข่าว เทคโนโลยี/วิทยาศาสตร์/นวัตกรรม
- เลือกข่าวที่ดีที่สุด และไม่ซ้ำกัน ในจำนวน K รายการ
- Dry‑run โชว์ผลที่เลือกโดยไม่แตะฐานข้อมูล
- Log แบบ JSON เหมาะกับ workflow อัตโนมัติ

ติดตั้งและใช้งาน:

1) เติมค่าใน `.env` (ดูตัวอย่าง `.env.example`)
2) รัน `npm run build`
3) รัน `news-curator --dry-run` เพื่อทดสอบ

ตัวเลือกสำคัญ:

- `--hours` ชั่วโมงย้อนหลัง (ค่าเริ่มต้น 48)
- `--limit` จำนวนสูงสุดที่ดึง (ค่าเริ่มต้น 100)
- `--final` จำนวน K ที่ต้องการเลือก (ค่าเริ่มต้น 12)
- `--model` เลือกโมเดล OpenRouter
- `--dry-run` แสดงผลโดยไม่เขียนฐานข้อมูล

สคีมาที่ใช้บน Supabase ดูหัวข้อ “Supabase schema” ด้านบน

## License

MIT

