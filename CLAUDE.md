# What's Missing — CLAUDE.md

## Om Jenny & hur vi jobbar

- Jenny är designer, inte utvecklare. Förklara alltid teknik på vanlig svenska.
- Fråga alltid innan du gör stora ändringar (mer än ett par rader).
- Aldrig push till `main` utan Jennys godkännande.
- Använd branches för experiment och nya features.
- Svara på svenska om inget annat sägs.

## Var saker finns

| Vad | Var |
|-----|-----|
| Kod (detta repo) | `C:\Users\Jenny\fashion-interior-guide\` |
| Anteckningar / minne | `G:\Min enhet\obsidian-vault\` |
| Hosting | Cloudflare Workers (whatsmissing.info) |
| Backend | Supabase (edge functions + databas + storage) |
| Betalningar | Paddle (web) |
| AI | Lovable AI Gateway → Gemini 2.5 Flash |

## Var koden faktiskt ligger

### AI-prompterna
- **Bildanalys:** `supabase/functions/analyze-image/index.ts` (inloggad) och `supabase/functions/analyze-image-public/index.ts` (gäst)
- **After-bild:** `supabase/functions/generate-after-image/index.ts` (inloggad) och `generate-after-image-public/`
- Systemprompten i `analyze-image` är inline runt rad 104–108

### Pris & promo-kod
- Prisplaner definieras i `src/routes/pricing.tsx` (rad 36–61) — tre prenumerationer + 10-pack
- Promo-kod-logik: `supabase/functions/redeem-promo/index.ts` + Supabase RPC `redeem_promo_code`

### Sidor (routes)
`/` startsida · `/upload` ladda upp bild · `/results/:id` resultat · `/pricing` priser · `/auth` inloggning · `/history` historik · `/admin` · `/terms` · `/privacy` · `/refunds`

### Viktiga komponenter
- `src/components/AppShell.tsx` — layout, header, footer, bottom-nav
- `src/components/PaywallCard.tsx` — visas när krediter är slut
- `src/hooks/useEntitlement.ts` — kollar prenumeration & krediter
- `src/lib/i18n.tsx` — svenska/engelska-stöd
- `src/lib/guest.ts` — gäst-läge (5 gratis analyser i localStorage)

## Tech stack

- **Frontend:** Vite + React 19 + TanStack Router + Tailwind CSS v4
- **Backend:** Supabase (Edge Functions i Deno, PostgreSQL, Storage)
- **Mobilapp:** Capacitor (iOS-mapp finns, ej i App Store än)
- **Betalningar:** Paddle (webbcheckout)
- **AI:** Lovable AI Gateway → Gemini 2.5 Flash (analys) + Gemini 2.5 Flash Image (after-bild)

## Deployment-läge (april 2026)

- Appen är live på **whatsmissing.info** via Cloudflare Workers
- Deploy-kommando: `npm run build && CLOUDFLARE_API_TOKEN=xxx npx wrangler deploy --config dist/server/wrangler.json`
- iOS-appen är INTE i App Store
- Betalningar körs i **test-läge** (Paddle sandbox)

## ⚠ Anti-patterns — rör inte utan att fråga

1. **`server.url` i `capacitor.config.ts`** pekar på `whatsmissing.info`. Måste tas bort (inte ändras) inför App Store-submit. Fråga alltid först.
2. **Pusha inte till `main`** utan att Jenny har godkänt.
3. **Ändra inte Paddle price-IDn** utan att kontrollera mot Paddle-dashboarden.
4. **Ta inte bort gäst-läget** — det är en viktig del av onboarding-flödet.

## Session-minne

I början av varje session: läs senaste filen i `G:\Min enhet\obsidian-vault\Claude\Sessioner\`
I slutet av varje session: spara sammanfattning till samma mapp med dagens datum som filnamn.
