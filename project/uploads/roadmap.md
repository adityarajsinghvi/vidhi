# Roadmap — wedding vendor ops tool

Build order matters here more than usual — each phase is meant to be a working, demoable slice, not a layer that only makes sense once everything else exists. Don't start a phase's "stretch" items until its core is working end-to-end.

## Phase 0 — Setup
- Repo, Next.js (App Router) project, Vercel project linked
- Supabase project: tables from `design.md`, phone OTP auth wired up
- Cloudflare R2 bucket created, env vars in place
- Deploy an empty skeleton to Vercel — confirm the pipeline works before writing features

## Phase 1 — Core data: weddings, ceremonies, vendors
- Create/list/edit a wedding (couple names, dates, budget)
- Add ceremonies to a wedding (name, date, time, venue)
- Add vendors to a wedding, assign each to one or more ceremonies
- Basic dashboard listing all of this — no styling polish yet, just correctness

## Phase 2 — Payments and budget
- Manual payment entry per vendor (amount, mode, advance/balance)
- Budget rollup: total budget vs paid vs pending, per wedding
- This is the first genuinely useful slice — a planner could track money with just this

## Phase 3 — Tasks and WhatsApp links
- Per-ceremony task checklist, optionally tied to a vendor
- `wa.me` deep link button on every vendor record (pre-filled message optional)
- No server involvement here — confirm this stays 100% client-side as designed

## Phase 4 — AI parsing, text first
- `/api/parse-chat` route: planner pastes vendor text, Gemini Flash extracts a `payment_received` intent
- Confirmation card UI — build this properly now, voice will reuse it in Phase 5
- Ship with just this one intent before adding others

## Phase 5 — Voice commands
- Mic capture in browser, audio sent to `/api/parse-voice`
- Add the remaining intents one at a time: `add_task`, `mark_task_done`, `schedule_message`
- Reuse the Phase 4 confirmation card — don't build a second UI for this
- Test explicitly with Hindi/Hinglish phrasing, not just English

## Phase 6 — Push notifications and reminders
- VAPID keys, service worker, push subscription flow
- Vercel Cron job: checks `reminders` table, fires push for anything due
- iOS: build the "Add to Home Screen" walkthrough now, not as an afterthought — test on a real iPhone before considering this phase done
- Confirm: notification opens straight into the pre-filled WhatsApp chat, planner still taps send

## Phase 7 — Client-facing view
- Read-only shareable link or PDF summary of a wedding's plan, for the couple/family
- No login required to view it

## Phase 8 — Polish and real-world test
- PWA manifest, icons, install prompts
- Onboarding flow that explicitly walks a new planner through setup and (if iPhone) home screen install
- Run this end-to-end with 2–3 real planners before writing a single line of anything from the "explicitly out of scope" list in `design.md`

## What "done with v1" looks like

A planner can: create a wedding, add ceremonies and vendors, track every payment, message vendors with one tap, get a reminder that survives their phone being locked, and hand the couple a clean summary — all without you or Rishi touching the database by hand. That's the bar. Everything past that is v2.
