import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGIN = "https://app.molnify.com";
const PERIOD_DAYS_DEFAULT = 90;
const ENV_FILTER_DEFAULT: "live" | "sandbox" = "live";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-dashboard-key, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Vary": "Origin",
};

type PriceCache = Map<string, { unit_amount: number; currency: string; interval: string | null }>;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const expected = Deno.env.get("DASHBOARD_KEY");
  const presented = req.headers.get("x-dashboard-key");
  if (!expected || presented !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const periodDays = clamp(parseInt(url.searchParams.get("period") ?? "") || PERIOD_DAYS_DEFAULT, 1, 365);
  const envFilter = (url.searchParams.get("env") ?? ENV_FILTER_DEFAULT) as "live" | "sandbox";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      usersAll,
      usersPeriod,
      analysesAll,
      analysesPeriod,
      activeUsers7d,
      activeUsers30d,
      subsAll,
      subsActive,
      subsCanceledPeriod,
      creditsAgg,
      promoStats,
      topUsers,
      dailySignups,
      dailyAnalyses,
      dailyCredits,
      catBreakdown,
      statusBreakdown,
    ] = await Promise.all([
      countTable(supabase, "profiles"),
      countTable(supabase, "profiles", { since: periodStart }),
      countTable(supabase, "analyses"),
      countTable(supabase, "analyses", { since: periodStart }),
      activeUserCount(supabase, 7),
      activeUserCount(supabase, 30),
      countTable(supabase, "subscriptions", { eq: { environment: envFilter } }),
      activeSubscriptions(supabase, envFilter),
      countTable(supabase, "subscriptions", { eq: { environment: envFilter, status: "canceled" }, since: periodStart }),
      creditAggregates(supabase),
      promoAggregates(supabase),
      topUsersByAnalyses(supabase, 10),
      dailyBucketProfiles(supabase, periodDays),
      dailyBucketAnalyses(supabase, periodDays),
      dailyBucketCredits(supabase, periodDays),
      analysesByCategory(supabase, periodStart),
      subscriptionStatusBreakdown(supabase, envFilter),
    ]);

    const mrr = await computeMRR(supabase, subsActive);

    return json({
      generated_at: new Date().toISOString(),
      period_days: periodDays,
      environment: envFilter,
      kpis: {
        mrr_usd: mrr.mrr,
        arr_usd: mrr.mrr * 12,
        currency: mrr.currency,
        active_subscriptions: subsActive.length,
        signups_total: usersAll,
        signups_period: usersPeriod,
        analyses_total: analysesAll,
        analyses_period: analysesPeriod,
        active_users_7d: activeUsers7d,
        active_users_30d: activeUsers30d,
        subscriptions_total: subsAll,
        subscriptions_canceled_period: subsCanceledPeriod,
        credits_outstanding: creditsAgg.outstanding,
        credits_granted_period: creditsAgg.granted_period,
        credits_spent_period: creditsAgg.spent_period,
        avg_score: creditsAgg.avgScore,
      },
      breakdowns: {
        analyses_by_category: catBreakdown,
        subscription_status: statusBreakdown,
        credit_source: creditsAgg.bySource,
      },
      time_series: {
        daily_signups: dailySignups,
        daily_analyses: dailyAnalyses,
        daily_credits_consumed: dailyCredits,
      },
      lists: {
        top_users: topUsers,
        promo_performance: promoStats,
      },
    });
  } catch (err) {
    console.error("dashboard-stats error", err);
    return json({ error: "Internal error", detail: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "private, max-age=300" },
  });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

async function countTable(
  supabase: any,
  table: string,
  opts?: { since?: string; eq?: Record<string, string> }
): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (opts?.since) q = q.gte("created_at", opts.since);
  if (opts?.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
  const { count } = await q;
  return count ?? 0;
}

async function activeUserCount(supabase: any, days: number): Promise<number> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase.from("analyses").select("user_id").gte("created_at", since);
  if (!data) return 0;
  return new Set(data.map((r: any) => r.user_id)).size;
}

async function activeSubscriptions(supabase: any, env: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id, price_id, status, current_period_end, cancel_at_period_end")
    .eq("environment", env)
    .in("status", ["active", "trialing", "past_due"]);
  return data ?? [];
}

async function creditAggregates(supabase: any) {
  const periodStart = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: outstanding } = await supabase
    .from("credit_ledger")
    .select("remaining")
    .gt("remaining", 0);
  const outstandingTotal = (outstanding ?? []).reduce((s: number, r: any) => s + r.remaining, 0);

  const { data: periodLedger } = await supabase
    .from("credit_ledger")
    .select("amount, source, created_at")
    .gte("created_at", periodStart);
  let granted = 0, spent = 0;
  const bySource: Record<string, number> = {};
  for (const r of periodLedger ?? []) {
    if (r.amount > 0) granted += r.amount;
    else spent += -r.amount;
    bySource[r.source] = (bySource[r.source] ?? 0) + Math.abs(r.amount);
  }

  const { data: scores } = await supabase.from("analyses").select("score").not("score", "is", null);
  const valid = (scores ?? []).filter((r: any) => typeof r.score === "number");
  const avgScore = valid.length ? valid.reduce((s: number, r: any) => s + r.score, 0) / valid.length : null;

  return {
    outstanding: outstandingTotal,
    granted_period: granted,
    spent_period: spent,
    bySource,
    avgScore,
  };
}

async function analysesByCategory(supabase: any, since: string) {
  const { data } = await supabase.from("analyses").select("category").gte("created_at", since);
  const out: Record<string, number> = {};
  for (const r of data ?? []) out[r.category] = (out[r.category] ?? 0) + 1;
  return out;
}

async function subscriptionStatusBreakdown(supabase: any, env: string) {
  const { data } = await supabase.from("subscriptions").select("status").eq("environment", env);
  const out: Record<string, number> = {};
  for (const r of data ?? []) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}

async function promoAggregates(supabase: any) {
  const { data: codes } = await supabase
    .from("promo_codes")
    .select("id, code, credits, redemption_count, max_redemptions, active");
  return (codes ?? []).map((c: any) => ({
    code: c.code,
    credits_per_redemption: c.credits,
    redemptions: c.redemption_count,
    max: c.max_redemptions,
    active: c.active,
  }));
}

async function topUsersByAnalyses(supabase: any, n: number) {
  const { data: rows } = await supabase.from("analyses").select("user_id");
  const counts = new Map<string, number>();
  for (const r of rows ?? []) counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  if (!sorted.length) return [];
  const ids = sorted.map(([id]) => id);
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  const nameById = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));
  return sorted.map(([id, count]) => ({
    user_id: id,
    display_name: nameById.get(id) ?? "(no name)",
    analyses: count,
  }));
}

async function dailyBucketProfiles(supabase: any, days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase.from("profiles").select("created_at").gte("created_at", since);
  return bucketByDay(data ?? [], days, "created_at");
}

async function dailyBucketAnalyses(supabase: any, days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase.from("analyses").select("created_at, category").gte("created_at", since);
  const byDay: Record<string, { outfit: number; interior: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    byDay[d] = { outfit: 0, interior: 0 };
  }
  for (const r of data ?? []) {
    const d = String(r.created_at).slice(0, 10);
    if (!byDay[d]) byDay[d] = { outfit: 0, interior: 0 };
    if (r.category === "outfit") byDay[d].outfit++;
    else if (r.category === "interior") byDay[d].interior++;
  }
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
}

async function dailyBucketCredits(supabase: any, days: number) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase.from("credit_ledger").select("created_at, amount").gte("created_at", since).lt("amount", 0);
  return bucketByDay((data ?? []).map((r: any) => ({ created_at: r.created_at, count: -r.amount })), days, "created_at", "count");
}

function bucketByDay(rows: any[], days: number, dateKey: string, valueKey?: string) {
  const byDay: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    byDay[d] = 0;
  }
  for (const r of rows) {
    const d = String(r[dateKey]).slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + (valueKey ? r[valueKey] : 1);
  }
  return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

async function computeMRR(supabase: any, activeSubs: any[]) {
  if (!activeSubs.length) return { mrr: 0, currency: "USD" };
  const cache: PriceCache = new Map();
  const uniquePriceIds = [...new Set(activeSubs.map((s) => s.price_id))];

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  await Promise.all(
    uniquePriceIds.map(async (priceId) => {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/get-paddle-price`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${anonKey}` },
          body: JSON.stringify({ price_id: priceId }),
        });
        if (!resp.ok) return;
        const body = await resp.json();
        if (typeof body?.unit_amount === "number") {
          cache.set(priceId, {
            unit_amount: body.unit_amount,
            currency: body.currency ?? "USD",
            interval: body.interval ?? "month",
          });
        }
      } catch (e) {
        console.warn(`Failed to price ${priceId}`, e);
      }
    })
  );

  let mrr = 0;
  let currency = "USD";
  for (const sub of activeSubs) {
    const p = cache.get(sub.price_id);
    if (!p) continue;
    currency = p.currency;
    const monthlyMinor =
      p.interval === "year" ? p.unit_amount / 12 :
      p.interval === "month" ? p.unit_amount :
      p.interval === "week" ? p.unit_amount * (52 / 12) :
      p.interval === "day" ? p.unit_amount * (365 / 12) :
      p.unit_amount;
    mrr += monthlyMinor;
  }
  return { mrr: Math.round(mrr) / 100, currency };
}
