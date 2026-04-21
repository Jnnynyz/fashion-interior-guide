import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PaywallCard() {
  return (
    <div className="rounded-3xl bg-card border border-border/60 p-6 sm:p-8 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-full bg-accent text-accent-foreground grid place-items-center">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Premium</p>
      </div>

      <p className="font-display text-2xl mt-4 leading-snug text-balance">
        You've used all your free analyses.
        <br />
        Want to keep refining your style?
      </p>

      <p className="font-display text-xl mt-5 leading-snug">Unlock your full style potential</p>

      <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
        <li className="flex gap-2.5">
          <span className="text-accent mt-0.5">·</span>
          Unlimited outfit & interior analysis
        </li>
        <li className="flex gap-2.5">
          <span className="text-accent mt-0.5">·</span>
          Smarter, more refined suggestions
        </li>
        <li className="flex gap-2.5">
          <span className="text-accent mt-0.5">·</span>
          Build a cleaner, more confident look
        </li>
      </ul>

      <Link
        to="/pricing"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition"
      >
        👉 Try Premium
      </Link>
    </div>
  );
}
