import { supabase } from "@/integrations/supabase/client";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

declare global {
  interface Window {
    Paddle: any;
  }
}

let paddleInitialized = false;

export function getPaymentsEnv(): "sandbox" | "live" {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

export async function initializePaddle() {
  if (paddleInitialized) return;
  if (!clientToken) throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src*="paddle.com/paddle/v2/paddle.js"]');
    const init = () => {
      const environment = clientToken.startsWith("test_") ? "sandbox" : "production";
      window.Paddle.Environment.set(environment);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      resolve();
    };
    if (existing && window.Paddle) {
      init();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = init;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function getPaddlePriceId(priceId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-paddle-price", {
    body: { priceId, environment: getPaymentsEnv() },
  });
  if (error || !data?.paddleId) throw new Error(`Failed to resolve price: ${priceId}`);
  return data.paddleId;
}
