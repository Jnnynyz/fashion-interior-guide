import { useState } from "react";
import { initializePaddle, getPaddlePriceId, getPaymentsEnv } from "@/lib/paddle";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function usePaddleCheckout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const openCheckout = async (priceId: string, successPath = "/upload?checkout=success") => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(priceId);
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id, env: getPaymentsEnv() },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}${successPath}`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Could not open checkout");
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
