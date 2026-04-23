import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "sv";

const STORAGE_KEY = "wm_lang";

const dict = {
  en: {
    // Header / nav
    "nav.unlimited": "Unlimited",
    "nav.left": "{n} left",
    "nav.signIn": "Sign in",
    "nav.signOut": "Sign out",
    "nav.analyze": "Analyze",
    "nav.history": "History",
    "nav.premium": "Premium",
    "footer.pricing": "Pricing",
    "footer.terms": "Terms",
    "footer.refunds": "Refunds",
    "footer.privacy": "Privacy",
    "lang.label": "Language",
    "lang.en": "EN",
    "lang.sv": "SV",

    // Index
    "index.eyebrow": "Styling, refined",
    "index.h1.line1": "What's missing",
    "index.h1.line2": "from the picture?",
    "index.lede":
      "Upload a photo of an outfit or a room. We'll tell you what to add, what to remove, and why — with the calm precision of a Scandinavian stylist.",
    "index.cta.begin": "Begin an analysis",
    "index.cta.have": "I already have an account",
    "index.feature.outfit.title": "Outfit",
    "index.feature.outfit.body": "Layering, proportion, accessories. We help you finish the look.",
    "index.feature.interior.title": "Interior",
    "index.feature.interior.body": "Negative space, materials, focal points. A calmer room, intentional.",
    "index.steps.title": "Three easy steps",
    "index.step.1": "Choose outfit or interior.",
    "index.step.2": "Upload a single, well-lit photo.",
    "index.step.3": "Receive a refined, actionable critique.",

    // Auth
    "auth.home": "← Home",
    "auth.welcome": "Welcome back",
    "auth.create": "Create your account",
    "auth.lede.signin": "Sign in to continue your style journey.",
    "auth.lede.signup": "A quiet space for thoughtful styling.",
    "auth.field.name": "Display name",
    "auth.field.name.ph": "Your name",
    "auth.field.email": "Email",
    "auth.field.password": "Password",
    "auth.forgot": "Forgot your password?",
    "auth.submit.signin": "Sign in",
    "auth.submit.signup": "Create account",
    "auth.wait": "Please wait…",
    "auth.toggle.toSignup": "No account yet? Create one →",
    "auth.toggle.toSignin": "Already have an account? Sign in →",
    "auth.signedIn": "Signed in.",
    "auth.welcomeReady": "Welcome — your account is ready.",

    // Forgot / reset
    "forgot.back": "← Back to sign in",
    "forgot.title": "Forgot your password?",
    "forgot.lede": "Enter your email and we'll send you a link to reset it.",
    "forgot.send": "Send reset link",
    "forgot.sending": "Sending…",
    "forgot.sent.pre": "We've sent a reset link to ",
    "forgot.sent.post": ". Please check your inbox (and spam folder).",
    "forgot.toast": "Check your inbox for a reset link.",
    "reset.title": "Set a new password",
    "reset.lede.ready": "Choose a new password for your account.",
    "reset.lede.verifying": "Verifying your reset link…",
    "reset.field.new": "New password",
    "reset.field.confirm": "Confirm password",
    "reset.submit": "Update password",
    "reset.updating": "Updating…",
    "reset.mismatch": "Passwords don't match.",
    "reset.short": "Password must be at least 6 characters.",
    "reset.success": "Password updated. You're signed in.",

    // Upload
    "upload.step1": "Step 01",
    "upload.choose": "Choose a category",
    "upload.outfit": "Outfit",
    "upload.interior": "Interior",
    "upload.step2": "Step 02",
    "upload.uploadPhoto": "Upload a photo",
    "upload.tap": "Tap to add image",
    "upload.formats": "JPG or PNG · up to 10MB",
    "upload.replace": "Replace photo",
    "upload.analyzing": "Analyzing…",
    "upload.analyze": "Analyze {category}",
    "upload.err.image": "Please choose an image file.",
    "upload.err.size": "Image must be under 10MB.",
    "upload.err.failed": "Analysis failed",

    // Paywall
    "paywall.eyebrow": "Premium",
    "paywall.headline": "You've used all your free analyses.",
    "paywall.sub": "Want to keep refining your style?",
    "paywall.unlock": "Unlock your full style potential",
    "paywall.b1": "Unlimited outfit & interior analysis",
    "paywall.b2": "Smarter, more refined suggestions",
    "paywall.b3": "Build a cleaner, more confident look",
    "paywall.cta": "👉 Try Premium",

    // Pricing
    "pricing.back": "Back",
    "pricing.eyebrow": "Pricing",
    "pricing.h1.line1": "Refine your style,",
    "pricing.h1.line2": "on your own terms.",
    "pricing.lede": "Start free with 5 analyses each month. Upgrade for unlimited styling.",
    "pricing.onPlan.pre": "You're on ",
    "pricing.onPlan.post": ".",
    "pricing.creditsLeft": "Credits remaining: ",
    "pricing.choose": "Choose plan",
    "pricing.payg": "Pay as you go",
    "pricing.pack.title": "10 Picture Pack",
    "pricing.pack.body":
      "10 additional analyses for {price}. Credits expire after 12 months.",
    "pricing.pack.cta": "Buy 10 credits — $5",
    "pricing.free.note": "Free plan: 5 analyses every month, forever.",
    "promo.eyebrow": "Have a code?",
    "promo.title": "Redeem promo code",
    "promo.lede": "Enter your code to add free credits to your account.",
    "promo.placeholder": "Enter code",
    "promo.submit": "Redeem",
    "promo.success": "{n} credits added to your account!",
    "promo.error": "Could not redeem code",
    "plan.monthly.name": "Monthly Unlimited",
    "plan.monthly.period": "/month",
    "plan.monthly.f1": "Unlimited analyses",
    "plan.monthly.f2": "Unlimited After photos",
    "plan.monthly.f3": "Cancel anytime",
    "plan.half.name": "6 Months Unlimited",
    "plan.half.period": "every 6 months",
    "plan.half.badge": "Save 46%",
    "plan.half.f1": "Everything in Monthly",
    "plan.half.f2": "Half a year of refinement",
    "plan.half.f3": "Best for slow seasons",
    "plan.year.name": "Yearly Unlimited",
    "plan.year.period": "/year",
    "plan.year.badge": "Best value",
    "plan.year.f1": "Everything in Monthly",
    "plan.year.f2": "12 months of styling",
    "plan.year.f3": "Less than $4/month",

    // History
    "history.eyebrow": "Archive",
    "history.title": "Your analyses",
    "history.lede": "A quiet record of your refinements.",
    "history.loading": "Loading…",
    "history.empty.title": "Nothing here yet",
    "history.empty.body": "Begin your first analysis.",
    "history.empty.cta": "Analyze a photo",

    // Results
    "results.history": "History",
    "results.delete": "Delete",
    "results.confirmDelete": "Delete this analysis?",
    "results.deleted": "Deleted.",
    "results.score": "Score ",
    "results.summary.outfit": "Outfit · Style summary",
    "results.summary.interior": "Interior · Style summary",
    "results.missing.title": "What's missing",
    "results.missing.empty": "Nothing missing — beautifully complete.",
    "results.remove.title": "What to remove",
    "results.remove.empty": "Nothing to remove. Effortlessly edited.",
    "results.after": "After",
    "results.aiPreview": "AI preview",
    "results.before": "Before",
    "results.afterCap": "After",
    "results.save": "Save to camera roll",
    "results.disclaimer": "An AI visualization — not a real photo.",
    "results.redo": "Redo",
    "results.see": "See the fix, visualized.",
    "results.gen.lede": "Generate an AI mockup applying the suggestions above.",
    "results.gen.cta": "Generate after photo",
    "results.styling": "Styling your after photo… this takes 15–30s.",
    "results.loading": "Loading your analysis…",
    "results.notFound": "Analysis not found.",
    "results.startNew": "Start a new one",
    "results.again": "Analyze another",
    "results.noCredits": "You're out of credits. Upgrade to keep refining.",
    "results.rate": "Too many requests. Try again in a moment.",
    "results.noImage": "No image returned. Please try again.",
    "results.afterReady": "After photo ready.",
    "results.savedRoll": "Saved to camera roll.",
    "results.downloaded": "Downloaded.",

    // Admin
    "admin.eyebrow": "Admin",
    "admin.title": "Stats",
    "admin.lede": "A quiet glance at how things are going.",
    "admin.loading": "Loading…",
    "admin.forbidden": "You don't have access to this page.",
    "admin.totalUsers": "Total users",
    "admin.signupsHint": "+{n} in last 30 days",
    "admin.subs": "Active subscribers",
    "admin.subsHint": "Across all plans",
    "admin.packs": "Pack credits sold",
    "admin.packsHint": "All-time, 10-pack purchases",
    "admin.analyses": "Analyses",
    "admin.analysesHint": "{n} in last 30 days",
    "admin.byPlan": "Subscribers by plan",
    "admin.breakdown": "Breakdown",
    "admin.noSubs": "No active subscribers yet.",

    // Common
    "common.back": "Back",
  },
  sv: {
    "nav.unlimited": "Obegränsat",
    "nav.left": "{n} kvar",
    "nav.signIn": "Logga in",
    "nav.signOut": "Logga ut",
    "nav.analyze": "Analysera",
    "nav.history": "Historik",
    "nav.premium": "Premium",
    "footer.pricing": "Priser",
    "footer.terms": "Villkor",
    "footer.refunds": "Återbetalning",
    "footer.privacy": "Integritet",
    "lang.label": "Språk",
    "lang.en": "EN",
    "lang.sv": "SV",

    "index.eyebrow": "Stil, förfinad",
    "index.h1.line1": "Vad saknas",
    "index.h1.line2": "i bilden?",
    "index.lede":
      "Ladda upp en bild av en outfit eller ett rum. Vi berättar vad du ska lägga till, vad du ska ta bort och varför — med en skandinavisk stylists lugna precision.",
    "index.cta.begin": "Påbörja en analys",
    "index.cta.have": "Jag har redan ett konto",
    "index.feature.outfit.title": "Outfit",
    "index.feature.outfit.body": "Lager, proportioner, accessoarer. Vi hjälper dig fullända looken.",
    "index.feature.interior.title": "Inredning",
    "index.feature.interior.body": "Tomrum, material, fokuspunkter. Ett lugnare rum, med avsikt.",
    "index.steps.title": "Tre enkla steg",
    "index.step.1": "Välj outfit eller inredning.",
    "index.step.2": "Ladda upp en enda, väl belyst bild.",
    "index.step.3": "Få en förfinad, konkret kritik.",

    "auth.home": "← Hem",
    "auth.welcome": "Välkommen tillbaka",
    "auth.create": "Skapa ditt konto",
    "auth.lede.signin": "Logga in för att fortsätta din stilresa.",
    "auth.lede.signup": "En lugn plats för genomtänkt styling.",
    "auth.field.name": "Visningsnamn",
    "auth.field.name.ph": "Ditt namn",
    "auth.field.email": "E-post",
    "auth.field.password": "Lösenord",
    "auth.forgot": "Glömt lösenord?",
    "auth.submit.signin": "Logga in",
    "auth.submit.signup": "Skapa konto",
    "auth.wait": "Vänta…",
    "auth.toggle.toSignup": "Inget konto än? Skapa ett →",
    "auth.toggle.toSignin": "Har du redan ett konto? Logga in →",
    "auth.signedIn": "Inloggad.",
    "auth.welcomeReady": "Välkommen — ditt konto är redo.",

    "forgot.back": "← Tillbaka till inloggning",
    "forgot.title": "Glömt lösenord?",
    "forgot.lede": "Ange din e-post så skickar vi en länk för att återställa det.",
    "forgot.send": "Skicka återställningslänk",
    "forgot.sending": "Skickar…",
    "forgot.sent.pre": "Vi har skickat en återställningslänk till ",
    "forgot.sent.post": ". Kolla din inkorg (och skräpposten).",
    "forgot.toast": "Kolla inkorgen efter en återställningslänk.",
    "reset.title": "Välj nytt lösenord",
    "reset.lede.ready": "Välj ett nytt lösenord för ditt konto.",
    "reset.lede.verifying": "Verifierar din återställningslänk…",
    "reset.field.new": "Nytt lösenord",
    "reset.field.confirm": "Bekräfta lösenord",
    "reset.submit": "Uppdatera lösenord",
    "reset.updating": "Uppdaterar…",
    "reset.mismatch": "Lösenorden matchar inte.",
    "reset.short": "Lösenordet måste vara minst 6 tecken.",
    "reset.success": "Lösenordet uppdaterat. Du är inloggad.",

    "upload.step1": "Steg 01",
    "upload.choose": "Välj en kategori",
    "upload.outfit": "Outfit",
    "upload.interior": "Inredning",
    "upload.step2": "Steg 02",
    "upload.uploadPhoto": "Ladda upp en bild",
    "upload.tap": "Tryck för att lägga till bild",
    "upload.formats": "JPG eller PNG · upp till 10 MB",
    "upload.replace": "Byt bild",
    "upload.analyzing": "Analyserar…",
    "upload.analyze": "Analysera {category}",
    "upload.err.image": "Välj en bildfil.",
    "upload.err.size": "Bilden måste vara under 10 MB.",
    "upload.err.failed": "Analysen misslyckades",

    "paywall.eyebrow": "Premium",
    "paywall.headline": "Du har använt alla dina gratis analyser.",
    "paywall.sub": "Vill du fortsätta förfina din stil?",
    "paywall.unlock": "Lås upp din fulla stilpotential",
    "paywall.b1": "Obegränsade outfit- & inredningsanalyser",
    "paywall.b2": "Smartare, mer förfinade förslag",
    "paywall.b3": "Bygg en renare, mer självsäker look",
    "paywall.cta": "👉 Prova Premium",

    "pricing.back": "Tillbaka",
    "pricing.eyebrow": "Priser",
    "pricing.h1.line1": "Förfina din stil,",
    "pricing.h1.line2": "på dina villkor.",
    "pricing.lede": "Börja gratis med 5 analyser varje månad. Uppgradera för obegränsad styling.",
    "pricing.onPlan.pre": "Du har ",
    "pricing.onPlan.post": ".",
    "pricing.creditsLeft": "Krediter kvar: ",
    "pricing.choose": "Välj plan",
    "pricing.payg": "Betala efter behov",
    "pricing.pack.title": "10-bildspaket",
    "pricing.pack.body":
      "10 extra analyser för {price}. Krediter går ut efter 12 månader.",
    "pricing.pack.cta": "Köp 10 krediter — $5",
    "pricing.free.note": "Gratisplan: 5 analyser varje månad, för alltid.",
    "promo.eyebrow": "Har du en kod?",
    "promo.title": "Lös in kampanjkod",
    "promo.lede": "Ange din kod för att lägga till gratis krediter på ditt konto.",
    "promo.placeholder": "Ange kod",
    "promo.submit": "Lös in",
    "promo.success": "{n} krediter har lagts till ditt konto!",
    "promo.error": "Kunde inte lösa in koden",
    "plan.monthly.name": "Obegränsat månadsvis",
    "plan.monthly.period": "/månad",
    "plan.monthly.f1": "Obegränsade analyser",
    "plan.monthly.f2": "Obegränsade Efter-bilder",
    "plan.monthly.f3": "Avsluta när du vill",
    "plan.half.name": "Obegränsat 6 månader",
    "plan.half.period": "var 6:e månad",
    "plan.half.badge": "Spara 46 %",
    "plan.half.f1": "Allt i Månadsvis",
    "plan.half.f2": "Ett halvår av förfining",
    "plan.half.f3": "Bäst för lugna säsonger",
    "plan.year.name": "Obegränsat årsvis",
    "plan.year.period": "/år",
    "plan.year.badge": "Bästa värde",
    "plan.year.f1": "Allt i Månadsvis",
    "plan.year.f2": "12 månader av styling",
    "plan.year.f3": "Mindre än $4/månad",

    "history.eyebrow": "Arkiv",
    "history.title": "Dina analyser",
    "history.lede": "Ett stillsamt register över dina förfiningar.",
    "history.loading": "Laddar…",
    "history.empty.title": "Inget här än",
    "history.empty.body": "Påbörja din första analys.",
    "history.empty.cta": "Analysera en bild",

    "results.history": "Historik",
    "results.delete": "Ta bort",
    "results.confirmDelete": "Ta bort denna analys?",
    "results.deleted": "Borttagen.",
    "results.score": "Poäng ",
    "results.summary.outfit": "Outfit · Stilsammanfattning",
    "results.summary.interior": "Inredning · Stilsammanfattning",
    "results.missing.title": "Vad som saknas",
    "results.missing.empty": "Inget saknas — vackert komplett.",
    "results.remove.title": "Vad som ska tas bort",
    "results.remove.empty": "Inget att ta bort. Smakfullt redigerat.",
    "results.after": "Efter",
    "results.aiPreview": "AI-förhandsvisning",
    "results.before": "Före",
    "results.afterCap": "Efter",
    "results.save": "Spara i kamerarullen",
    "results.disclaimer": "En AI-visualisering — inte ett riktigt foto.",
    "results.redo": "Gör om",
    "results.see": "Se lösningen, visualiserad.",
    "results.gen.lede": "Generera en AI-mockup som tillämpar förslagen ovan.",
    "results.gen.cta": "Generera Efter-bild",
    "results.styling": "Stylar din Efter-bild… det tar 15–30 sekunder.",
    "results.loading": "Laddar din analys…",
    "results.notFound": "Analysen hittades inte.",
    "results.startNew": "Påbörja en ny",
    "results.again": "Analysera en till",
    "results.noCredits": "Du har inga krediter kvar. Uppgradera för att fortsätta.",
    "results.rate": "För många förfrågningar. Försök igen om en stund.",
    "results.noImage": "Ingen bild returnerades. Försök igen.",
    "results.afterReady": "Efter-bilden är klar.",
    "results.savedRoll": "Sparad i kamerarullen.",
    "results.downloaded": "Nedladdad.",

    "admin.eyebrow": "Admin",
    "admin.title": "Statistik",
    "admin.lede": "En lugn överblick över hur det går.",
    "admin.loading": "Laddar…",
    "admin.forbidden": "Du har inte åtkomst till denna sida.",
    "admin.totalUsers": "Totalt antal användare",
    "admin.signupsHint": "+{n} senaste 30 dagarna",
    "admin.subs": "Aktiva prenumeranter",
    "admin.subsHint": "Över alla planer",
    "admin.packs": "Sålda paketkrediter",
    "admin.packsHint": "Genom tiderna, 10-pakets köp",
    "admin.analyses": "Analyser",
    "admin.analysesHint": "{n} senaste 30 dagarna",
    "admin.byPlan": "Prenumeranter per plan",
    "admin.breakdown": "Fördelning",
    "admin.noSubs": "Inga aktiva prenumeranter än.",

    "common.back": "Tillbaka",
  },
} as const;

export type Key = keyof typeof dict.en;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | undefined>(undefined);

function detect(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "sv") return saved;
  } catch {
    // ignore
  }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("sv") ? "sv" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(detect());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  };

  const t = (key: Key, vars?: Record<string, string | number>) => {
    const table = dict[lang] as Record<string, string>;
    let s = table[key] ?? (dict.en as Record<string, string>)[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return s;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function getStoredLang(): Lang {
  return detect();
}
