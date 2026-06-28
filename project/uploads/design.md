# Design doc — wedding vendor ops tool (working name: WeddingOps)

> Name not finalized — candidates discussed: ShaadiSetu, Vidhi, Mantap, Rasam. Pick one before launch; doesn't block build.

## What this is

A mobile-first web app for Indian wedding planners to manage vendors, payments, and tasks across multiple ceremonies — without forcing them off WhatsApp, which is how they already run vendor relationships.

**Who it's for:** small/independent wedding planners in India juggling 5–15 vendors across 4–7 ceremonies per wedding (haldi, mehendi, sangeet, wedding, reception, etc.), tracking advance/balance payments in cash and UPI, currently doing all of this across scattered WhatsApp threads and notebooks.

**Core bet:** don't replace WhatsApp — sit next to it as the structured memory layer (who's paid what, who owes what, what's due when), and make the only "new" surface (voice input) feel faster than typing, not like extra software.

## Non-negotiable architecture decisions (and why)

1. **No WhatsApp Business API in v1.** Official API requires a new business number + Meta template approval (5–15 days, with rejection risk), and breaks the one thing the product depends on: vendors already trust the planner's personal number. v1 uses `wa.me` deep links only — opens the planner's own WhatsApp with a pre-filled message, they hit send themselves. Zero approval wait, zero new number, ₹0 messaging cost. Revisit Business API only after retention is proven.
2. **No payment gateway in v1.** Indian wedding vendor payments run on cash/UPI/bank with informal advance-balance customs. v1 is a manual confirmation flow (planner marks "received ₹10,000 via UPI"), same logic as Parcha. Razorpay or similar is a v2+ decision, not a launch blocker.
3. **PWA, not native app.** Planners are on phones, but native means App Store review delays and two codebases before product-market fit is proven. A mobile-first responsive web app, installable via "Add to Home Screen," gets ~95% of native's feel. See note on iOS push below — this is the one place PWA has a real (solvable) gap.
4. **AI calls happen server-side only.** Client never talks to Gemini directly — always through a Next.js API route. Keeps the API key off the device and centralizes rate-limiting/cost control.
5. **iOS push requires "Add to Home Screen."** An open Safari tab gets zero push support on iOS — only a PWA actually added to the home screen does, and only since iOS 16.4 (now >95% of iPhones). This is a discovery problem, not a reliability problem — once installed, iOS push behaves like native (lock screen, Notification Center). Solve it with a mandatory onboarding step where you personally walk each early planner through "Add to Home Screen," not by hoping they find it.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API routes | Next.js (App Router) | Reused from Parcha, already operationally familiar |
| Hosting | Vercel | Same — git-deploy, built-in Cron for the reminder job |
| Database + Auth | Supabase (Postgres) | Phone OTP auth fits this user base better than email/password |
| File storage | Cloudflare R2 | Vendor docs, contracts, photos — cheaper than Supabase storage at scale |
| AI | Gemini Flash | Cheap, fast, already proven in Parcha; handles audio input directly (no separate transcription step needed) |
| Push notifications | Web Push API (VAPID) + Vercel Cron | Cron checks due reminders, fires push via standard web-push library |
| WhatsApp | `wa.me` deep links only | No API, no approval process, see decision #1 above |
| Payments | Manual entry | No gateway in v1, see decision #2 |

## Data model (Supabase / Postgres)

```
users
  id, phone, name, created_at

weddings
  id, owner_user_id (fk users), couple_names, start_date, end_date,
  budget_total, created_at

ceremonies
  id, wedding_id (fk), name, date, time, venue, notes

vendors
  id, wedding_id (fk), name, category, phone, quoted_amount, notes

vendor_ceremony   -- junction: a vendor can serve multiple ceremonies
  id, vendor_id (fk), ceremony_id (fk)

payments
  id, vendor_id (fk), amount, mode (cash|upi|bank), type (advance|balance),
  paid_at, notes, created_via (manual|voice|chat_paste)

tasks
  id, ceremony_id (fk), vendor_id (fk, nullable), description,
  due_at, done (bool)

reminders
  id, wedding_id (fk), vendor_id (fk), message_text, scheduled_at,
  sent (bool), wa_link

push_subscriptions
  id, user_id (fk), endpoint, p256dh_key, auth_key
```

## AI feature spec (the actual wedge — keep this narrow)

One pipeline, two entry points: forwarded vendor voice notes/text, and the planner's own voice commands. Both go through the same flow:

**Audio or text → Gemini Flash (server-side) → structured JSON → confirmation card (never auto-commit) → write to DB on confirm.**

v1 supported intents — do not expand this list without a real reason:
- `payment_received` — fields: amount, vendor (from screen context or fuzzy-matched name), mode (optional, ask if missing)
- `add_task` — fields: vendor, ceremony, description, optional due time
- `mark_task_done` — fields: task reference
- `schedule_message` — fields: vendor, scheduled_at, message_text → creates a `reminders` row. **This schedules a push notification + pre-filled WhatsApp link — it does not auto-send.** Be careful not to imply otherwise anywhere in the UI copy.

Rules:
- Always show a confirmation card before writing anything financial or vendor-facing. Never silently commit a parsed voice/chat result.
- Default to context (current vendor screen) for "this vendor" pronoun resolution in v1. Global voice command with fuzzy vendor-name matching is a fast-follow, not v1.
- Test Hinglish/code-switched input ("10 hazaar mil gaye") — this is why raw audio goes straight to Gemini rather than through browser-native speech recognition first.

## Design language

- Reference: Notion/Linear-style clarity, not Pinterest-wedding aesthetics. This is a work tool used mid-chaos on event day.
- Base: warm neutral (cream/off-white light mode, charcoal dark mode). Dark mode is required, not optional — planners work late.
- One accent color carrying all the "festive" weight: deep marigold gold or deep maroon. No multi-color palettes.
- Typography: clean modern sans (Inter-style) for the product. Festive type treatment, if any, lives only on the brand wordmark.
- Festive visual motifs (borders, patterns) belong on the marketing/login page only — never inside dashboards, lists, or forms.

## Folder structure (suggested starting point)

```
/app
  /api
    /parse-voice        -- Gemini Flash call, returns structured intent
    /parse-chat          -- same pipeline, text input
    /cron/check-reminders -- Vercel Cron target, fires due push notifications
  /(dashboard)           -- main authenticated app routes
/components
/lib
  supabase.ts
  gemini.ts
  whatsapp.ts            -- wa.me link builder
  push.ts                -- VAPID/web-push helpers
/types
/public
  manifest.json
  sw.js                  -- service worker (push handling, offline cache)
```

## Explicitly out of scope for v1 — do not build

- WhatsApp Business API (auto-capture, auto-send)
- Payment gateway integration
- Multi-planner/team accounts, role permissions
- Vendor-side portal or app
- Contract e-signing
- Proactive AI campaigns/insights beyond the 4 intents listed above
