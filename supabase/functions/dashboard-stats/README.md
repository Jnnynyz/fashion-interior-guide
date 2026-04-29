# dashboard-stats

Read-only Supabase Edge Function powering the external CEO dashboard
at `app.molnify.com/app/whats-missing-dashboard`.

Added by Mattias (Molnify) on 2026-04-29 with Jenny's permission.

---

## Background (so future Claude Code knows what this is)

Mattias maintains a separate dashboard app on Molnify that visualises
KPIs for What's Missing: signups, MRR, analyses volume, credit usage,
top users, promo performance. It lived on synthetic data until this
function was added.

This function is the bridge. It reads the live Supabase database
(read-only), aggregates everything in TypeScript, and returns a single
JSON payload the dashboard fetches every few minutes.

It does NOT live inside the main app. It is invisible to end users,
has its own URL, its own auth (shared secret), and locked CORS.

## Why an edge function and not a SQL view

- No DB migration needed -> nothing changes in the schema
- If we ever pull the dashboard, just delete this folder
- TypeScript is easier to extend than Postgres functions
- Cleanly isolated from the main app's data layer

## What it reads (no writes, ever)

- `profiles` - signup counts, top user names
- `analyses` - volume, category split, scores, active users
- `subscriptions` - active count, status breakdown, MRR
- `credit_ledger` - granted vs spent, outstanding balance
- `promo_codes` / `promo_redemptions` - campaign performance
- Plus a fetch to the existing `get-paddle-price` function to convert
  price IDs into actual MRR

## Security

- **Auth**: shared secret in `X-Dashboard-Key` header, checked against
  `DASHBOARD_KEY` env var. Only Mattias holds the dashboard's copy.
- **CORS**: hardcoded to `https://app.molnify.com`. Other origins get
  rejected by the browser.
- **Service role key**: never leaves the Supabase Edge runtime.
- **PII in payload**: only `display_name` of the top 10 most active
  users. No emails, no IDs other than UUID. Acceptable because only
  Jenny and Mattias see the dashboard. If access widens, swap to
  anonymized labels in `topUsersByAnalyses` (one-line change).

## Deploy steps for Jenny

```bash
# 1. Generate a random secret (copy the output)
openssl rand -hex 32

# 2. Set it as a Supabase secret (replace <SECRET> with the value above)
supabase secrets set DASHBOARD_KEY=<SECRET>

# 3. Deploy the function
supabase functions deploy dashboard-stats

# 4. Send the function URL and the SECRET to Mattias via secure channel
#    URL format: https://<project-ref>.supabase.co/functions/v1/dashboard-stats
```

That is it. No migration, no schema change, no other deploy step.

## Usage (for the dashboard side)

```
GET https://<project>.supabase.co/functions/v1/dashboard-stats
  ?period=90        # optional, default 90, range 1-365
  &env=live         # optional, 'live' or 'sandbox', default 'live'

Headers:
  X-Dashboard-Key: <secret>
```

Response shape:
```json
{
  "generated_at": "ISO-8601",
  "period_days": 90,
  "environment": "live",
  "kpis": {
    "mrr_usd": 0,
    "arr_usd": 0,
    "currency": "USD",
    "active_subscriptions": 0,
    "signups_total": 0,
    "signups_period": 0,
    "analyses_total": 0,
    "analyses_period": 0,
    "active_users_7d": 0,
    "active_users_30d": 0,
    "subscriptions_total": 0,
    "subscriptions_canceled_period": 0,
    "credits_outstanding": 0,
    "credits_granted_period": 0,
    "credits_spent_period": 0,
    "avg_score": null
  },
  "breakdowns": {
    "analyses_by_category": { "outfit": 0, "interior": 0 },
    "subscription_status": { "active": 0, "canceled": 0 },
    "credit_source": { "free_monthly": 0, "pack": 0 }
  },
  "time_series": {
    "daily_signups": [{ "date": "2026-01-30", "count": 0 }, ...],
    "daily_analyses": [{ "date": "...", "outfit": 0, "interior": 0 }, ...],
    "daily_credits_consumed": [{ "date": "...", "count": 0 }, ...]
  },
  "lists": {
    "top_users": [{ "user_id": "uuid", "display_name": "Jenny", "analyses": 47 }, ...],
    "promo_performance": [{ "code": "...", "redemptions": 0, ... }, ...]
  }
}
```

## What is NOT tracked yet

These would need new columns or tables. Not in scope here:

- **UTM source / acquisition channel** - no column on `profiles`
- **Per-analysis AI cost** - no logging in `analyze-image` edge function
- **Pageview funnel** - would need PostHog or Plausible

When Jenny is ready to track any of these, this function gets a small
extension (one new query, one new field in the JSON). No changes
required in the main app.

## Failure mode

The dashboard at `app.molnify.com/app/whats-missing-dashboard` has
synthetic seed data baked in. If this function is down, returns 401,
or the schema diverges and a query fails, the dashboard falls back to
synthetic data and shows a "Last updated" timestamp from the most
recent successful fetch. Real numbers reappear automatically on next
success.

So: do not panic about uptime here. It is a nice-to-have layer, not
a critical path.

## When the schema changes

This function reads:
- `profiles.id`, `profiles.display_name`, `profiles.created_at`
- `analyses.user_id`, `analyses.category`, `analyses.score`, `analyses.created_at`
- `subscriptions.user_id`, `.price_id`, `.status`, `.environment`, `.cancel_at_period_end`, `.current_period_end`
- `credit_ledger.user_id`, `.source`, `.amount`, `.remaining`, `.created_at`
- `promo_codes.id`, `.code`, `.credits`, `.redemption_count`, `.max_redemptions`, `.active`

If any of these columns are renamed, removed, or change type, update
`index.ts` and redeploy. The function is intentionally tolerant: a
broken sub-query returns 0 / null for that field rather than 500-ing
the whole response.

## Rotating the secret

```bash
supabase secrets set DASHBOARD_KEY=<new-secret>
```

Then send the new value to Mattias. Old secret stops working
immediately. No DB damage possible regardless of who held the old key.

## Removing the function

```bash
supabase functions delete dashboard-stats
```

That's it. Nothing else in the app references this. The dashboard
will fall back to synthetic data forever.
