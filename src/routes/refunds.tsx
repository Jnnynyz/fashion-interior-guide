import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy — What's Missing" },
      { name: "description", content: "Refund policy for What's Missing by JennyNystrand. 30-day money-back guarantee via Paddle." },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <div className="min-h-screen bg-gradient-warm">
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link to="/" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="font-display text-4xl mt-6">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: April 20, 2026</p>

        <div className="mt-8 space-y-6 text-foreground/85 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-foreground">30-day money-back guarantee</h2>
            <p>JennyNystrand offers a <strong>30-day money-back guarantee</strong> on all purchases of What's Missing — including monthly, 6-month, and yearly subscriptions, as well as one-time credit packs. If you're not satisfied, you can request a full refund within 30 days of your order date.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">How to request a refund</h2>
            <p>Refunds are processed by our payment provider, Paddle, the Merchant of Record for our orders.</p>
            <p>To request a refund, visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline font-medium">paddle.net</a> and look up your order using the email address used at checkout. You can also reply to your Paddle order receipt to reach Paddle support directly.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">After a refund</h2>
            <p>Once a refund is issued, access to paid features and any unused credits associated with the refunded purchase will be removed.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">Cancellations</h2>
            <p>You can cancel an active subscription at any time. Cancellation stops future renewals; you keep access until the end of the current paid period. Cancelling on its own does not trigger a refund — request a refund via Paddle within the 30-day window if applicable.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
