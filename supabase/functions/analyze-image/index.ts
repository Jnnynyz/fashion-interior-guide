// Analyze an outfit or interior image using Lovable AI Gateway (Gemini vision)
// Returns structured JSON with what's missing, what to remove, and a style summary.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller's JWT — derive userId from the verified token, never trust the body.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { imagePath, category, environment } = await req.json();
    if (!imagePath || !category) {
      return new Response(JSON.stringify({ error: "imagePath and category are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Path must be owned by the authenticated user (e.g. "<userId>/...")
    if (typeof imagePath !== "string" || !imagePath.startsWith(`${userId}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Entitlement check — userId comes from verified JWT only
    const env = environment === "live" ? "live" : "sandbox";
    const { data: ok, error: rpcErr } = await admin.rpc("consume_credit", {
      user_uuid: userId,
      related: null,
      check_env: env,
    });
    if (rpcErr) {
      console.error("consume_credit error", rpcErr);
      return new Response(JSON.stringify({ error: "Could not check credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ok) {
      return new Response(JSON.stringify({ error: "no_credits" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a short-lived signed URL for the AI model to fetch the image.
    const { data: signed, error: signErr } = await admin.storage
      .from("analysis-images")
      .createSignedUrl(imagePath, 600);
    if (signErr || !signed?.signedUrl) {
      console.error("sign url error", signErr);
      return new Response(JSON.stringify({ error: "Could not access image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const imageUrl = signed.signedUrl;

    const systemPrompt =
      category === "outfit"
        ? "You are a refined Scandinavian fashion stylist. Critique outfits with warmth and precision. Favor elegant minimalism, balanced proportion, and intentional accessorizing."
        : "You are a Scandinavian interior designer. Critique interiors with warmth and precision. Favor minimalism, natural materials, balanced negative space, and intentional styling.";

    const userPrompt = `Analyze this ${category} image and respond by calling the provided tool. Be specific, kind, and actionable. Provide 2-5 items for missing and 0-4 items for remove. Score 0-100 reflects current overall styling.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_analysis",
            description: "Submit the styling analysis.",
            parameters: {
              type: "object",
              properties: {
                missing: {
                  type: "array",
                  description: "Items or elements to add for a more elevated look.",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["title", "reason"],
                    additionalProperties: false,
                  },
                },
                remove: {
                  type: "array",
                  description: "Items or elements that detract and should be removed or swapped.",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["title", "reason"],
                    additionalProperties: false,
                  },
                },
                summary: {
                  type: "string",
                  description: "A 2-3 sentence elegant style summary.",
                },
                score: {
                  type: "integer",
                  description: "Overall current styling score 0-100.",
                  minimum: 0,
                  maximum: 100,
                },
              },
              required: ["missing", "remove", "summary", "score"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_analysis" } },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No analysis returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
