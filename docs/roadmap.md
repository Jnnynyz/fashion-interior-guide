# Roadmap — What's Missing
_Uppdaterad: 2026-04-27_

## Närmaste 30 dagarna

### 🔴 Måste göras (blockerar App Store)

- [ ] **Ta bort `server.url` ur `capacitor.config.ts`**
  Pekar på `whatsmissing.info` nu. Måste tas bort helt innan iOS-submit.

- [x] **Flytta till Cloudflare Workers** ✅ 2026-04-29
  Appen är live på whatsmissing.info.

- [ ] **IAP vs Stripe-beslut**
  Apple kräver In-App Purchase (IAP) för digitala köp i iOS-appar. Paddle (som används nu) fungerar på webb men inte i App Store. Alternativ:
  - RevenueCat + Apple IAP (rekommenderas för appar)
  - Behåll Paddle enbart för webbversionen
  Måste bestämmas innan App Store-submit.

- [ ] **App Store-ikoner & splash screens**
  Behöver ikoner i rätt storlekar för iOS (1024×1024 + varianter).
  Splash screens för iPhone.

### 🟡 Viktigt men inte blockerande

- [ ] **Ta bort Lovable-badge**
  Syns troligen i footer eller som overlay. Inte lämpligt i en betald app.

- [ ] **Byt ut Lovable AI Gateway**
  Just nu går AI-anropen via Lovable (kräver `LOVABLE_API_KEY`). När appen lämnar Lovable måste detta bytas till direkt API-nyckel (OpenAI, Gemini, etc.) eller annan gateway.

- [ ] **Sätt Paddle i live-läge**
  Just nu kör appen i sandbox (test). Behöver live price-IDn från Paddle-dashboarden.

- [ ] **App Privacy-manifest för iOS**
  Apple kräver ett `PrivacyInfo.xcprivacy`-manifest. Saknas troligen.

### 🟢 Kan vänta (men bra att ha)

- [ ] **Onboarding-flöde**
  Ny användare förstår kanske inte vad appen gör direkt. En enkel 2-3 stegs intro?

- [ ] **Push-notiser**
  "Din analys är klar" — kräver Capacitor Push plugin + APNS-certifikat.

- [ ] **Förbättra after-bild-funktionen**
  Gemini Flash Image är snabb men inte alltid perfekt. Kan testas mot andra modeller.

- [ ] **Admin-sida**
  `/admin`-routen finns men är okänd — vad gör den? Behöver granskas.

---

## Beslutslogg

| Datum | Beslut |
|-------|--------|
| 2026-04-27 | Behåller Paddle för webb, IAP-frågan öppen |
| 2026-04-27 | Vercel som hosting-mål |
