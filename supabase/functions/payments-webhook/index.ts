import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhook, EventName, type PaddleEnv } from "../_shared/paddle.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const SUBSCRIPTION_PRODUCTS = new Set([
  "monthly_unlimited",
  "halfyear_unlimited",
  "yearly_unlimited",
]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("event:", event.eventType, "env:", env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
        await upsertSubscription(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await markSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        await handleTransactionCompleted(event.data);
        break;
      case EventName.TransactionPaymentFailed:
        console.log("payment failed:", event.data.id);
        break;
      default:
        console.log("unhandled:", event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

async function upsertSubscription(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData, scheduledChange } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("no userId in customData");
    return;
  }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product?.importMeta?.externalId || item.price.productId;

  // Only persist subscription rows for unlimited plans
  if (!SUBSCRIPTION_PRODUCTS.has(productId)) {
    console.log("ignoring non-subscription product:", productId);
    return;
  }

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,environment" }
  );
}

async function markSubscriptionCanceled(data: any, env: PaddleEnv) {
  await supabase
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

async function handleTransactionCompleted(data: any) {
  // Only grant pack credits for one-off pack purchases
  const userId = data.customData?.userId;
  if (!userId) return;

  const items: any[] = data.items || [];
  for (const it of items) {
    const externalPriceId = it.price?.importMeta?.externalId;
    if (externalPriceId === "pack_10_price") {
      const qty = (it.quantity || 1) * 10;
      const { error } = await supabase.rpc("grant_pack_credits", {
        user_uuid: userId,
        qty,
      });
      if (error) console.error("grant_pack_credits error:", error);
      else console.log("granted", qty, "pack credits to", userId);
    }
  }
}
