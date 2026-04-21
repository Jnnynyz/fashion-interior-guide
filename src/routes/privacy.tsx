import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — What's Missing" },
      { name: "description", content: "Privacy notice for What's Missing by JennyNystrand. How we collect, use, and protect your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-warm">
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link to="/" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="font-display text-4xl mt-6">Privacy Notice</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: April 20, 2026</p>

        <div className="mt-8 space-y-6 text-foreground/85 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-foreground">1. Who we are</h2>
            <p>What's Missing is operated by <strong>JennyNystrand</strong>. JennyNystrand is the data controller responsible for personal data processed through this service.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">2. What data we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account data</strong> — email address, login credentials, display name.</li>
              <li><strong>Uploaded content</strong> — photos you upload of outfits or interiors, and AI-generated suggestions and visualizations derived from them.</li>
              <li><strong>Usage data</strong> — analyses you perform, credits consumed, subscription status.</li>
              <li><strong>Technical data</strong> — IP address, device type, browser, basic telemetry needed to operate and secure the service.</li>
              <li><strong>Support communications</strong> — messages you send us.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">3. Why we use it</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To create and maintain your account (legal basis: contract).</li>
              <li>To process your photos and provide AI styling suggestions (contract).</li>
              <li>To prevent fraud, abuse, and secure the service (legitimate interests).</li>
              <li>To improve the service (legitimate interests).</li>
              <li>To respond to support requests (contract / legitimate interests).</li>
              <li>To comply with legal obligations (legal obligation).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">4. Who we share data with</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Hosting & infrastructure providers</strong> — to store data and run the service.</li>
              <li><strong>AI processing providers</strong> — uploaded photos are sent to AI model providers (e.g. Google) for analysis and image generation.</li>
              <li><strong>Paddle.com (Merchant of Record)</strong> — for sale of subscriptions and credit packs, payment processing, subscription management, tax compliance, and invoicing.</li>
              <li><strong>Professional advisers and authorities</strong> — where required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">5. Data retention</h2>
            <p>We retain account data for as long as your account is active. Uploaded photos and analyses are retained until you delete them or close your account. Backups and minimal transactional records may be kept for a limited additional period to satisfy legal and accounting obligations, after which data is deleted or anonymised.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">6. Your rights</h2>
            <p>Depending on your jurisdiction, you may have the right to access, correct, delete, restrict, port, or object to processing of your personal data, and to withdraw consent at any time. EEA/UK users also have the right to lodge a complaint with their local data protection authority. We aim to respond within one month of a verified request.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">7. International transfers</h2>
            <p>Your data may be processed outside your country of residence, including in the United States, where our infrastructure and AI providers operate. Where required, we rely on appropriate safeguards such as Standard Contractual Clauses.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">8. Security</h2>
            <p>We use appropriate technical and organisational measures — including encryption in transit, access controls, and least-privilege practices — to protect your personal data.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">9. Cookies</h2>
            <p>We use only essential cookies and similar technologies required to keep you signed in and to operate checkout. We do not use advertising cookies.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">10. Contact</h2>
            <p>For privacy questions or to exercise your rights, contact JennyNystrand via the support channel listed in your account.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
