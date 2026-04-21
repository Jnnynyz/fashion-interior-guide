import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — What's Missing" },
      { name: "description", content: "Terms and conditions for using What's Missing by JennyNystrand." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-warm">
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link to="/" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="font-display text-4xl mt-6">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: April 20, 2026</p>

        <div className="prose prose-sm max-w-none mt-8 space-y-6 text-foreground/85 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-foreground">1. Who we are</h2>
            <p>What's Missing is operated by <strong>JennyNystrand</strong> ("we", "us", "our"). By using our service you ("you", "user") agree to be bound by these Terms & Conditions.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">2. The service</h2>
            <p>What's Missing provides AI-generated styling suggestions for outfits and interiors based on photos you upload. Suggestions are automated and provided for inspiration only — we make no guarantee of suitability or accuracy.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">3. Acceptance & eligibility</h2>
            <p>By creating an account or continuing to use the service you agree to these terms. You confirm you are of legal age in your jurisdiction and have authority to accept these terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">4. Acceptable use</h2>
            <p>You must not misuse the service, including: unlawful use, fraud, spam, infringing intellectual property, uploading content you do not have rights to, attempting to interfere with security (malware, probing, scraping), or generating harmful, deceptive, or illegal content.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">5. AI-generated content</h2>
            <p>You are responsible for the photos you upload and how you use generated suggestions and visualizations. AI outputs may be inaccurate or imperfect; verify before relying on them. We may filter, refuse, or remove outputs and suspend accounts that violate these terms. We accept rights-holder takedown requests at the contact below.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">6. Intellectual property</h2>
            <p>We retain all rights in the service, software, branding, and documentation. You retain rights in the photos you upload; you grant us a limited license to process them solely to provide the service.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">7. Plans, billing & payments</h2>
            <p>Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.</p>
            <p>Payment, billing, taxes, cancellations, and refund mechanics are governed by the <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="underline">Paddle Buyer Terms</a>. Subscriptions auto-renew at the end of each billing period until cancelled. You can cancel at any time; access continues until the end of the paid period.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">8. Service availability</h2>
            <p>We do not guarantee uninterrupted or error-free service. We may modify or discontinue features at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">9. Suspension & termination</h2>
            <p>We may suspend or terminate access for material breach, non-payment, security or fraud risk, or repeated violations of these terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">10. Disclaimers & liability</h2>
            <p>To the fullest extent permitted by law, we disclaim all implied warranties (merchantability, fitness for a particular purpose). Our aggregate liability is capped at fees paid by you in the prior 12 months. We exclude liability for indirect, consequential, or special damages, except where law prohibits such exclusion (e.g. fraud, death, or personal injury).</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">11. Changes to these terms</h2>
            <p>We may update these terms from time to time. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">12. Contact</h2>
            <p>Questions about these terms? Contact JennyNystrand via the support channel listed in your account or refund requests via <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline">paddle.net</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
