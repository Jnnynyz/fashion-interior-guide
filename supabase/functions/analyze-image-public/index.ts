// Public (unauthenticated) outfit/interior analysis for guest free trial.
// Accepts a base64 data URL or http(s) image URL. No DB writes, no credit consumption.
// Frontend enforces a 5-use limit per browser via localStorage; this is a soft trial only.

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image, category, language } = await req.json();
    if (!image || typeof image !== "string" || !category) {
      return new Response(JSON.stringify({ error: "image and category are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (category !== "outfit" && category !== "interior") {
      return new Response(JSON.stringify({ error: "invalid category" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Cap payload at ~10MB base64 to avoid abuse
    if (image.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = language === "sv" ? "sv" : "en";
    const langName = lang === "sv" ? "Swedish (svenska)" : "English";

    const systemPrompt =
      (category === "outfit"
        ? "You are a warm and knowledgeable Scandinavian fashion stylist. Your aesthetic is modern and accessible — clean lines, thoughtful proportions, a neutral base with intentional accents. Think everyday elegance: real-life wearable style, not runway fashion. When suggesting something to remove, always frame it as a gentle swap or edit, never as a mistake. Your tone is encouraging and specific — like a trusted friend with great taste."
        : "You are a warm and knowledgeable Scandinavian interior designer. Your aesthetic is functional beauty — clean lines, natural materials, and a sense of calm. Think lived-in Scandinavian style, not a showroom. When suggesting something to remove, frame it as a gentle edit, never as a critique. Your tone is encouraging and specific — like a friend with a great eye for space.") +
      ` IMPORTANT: All text fields you return (titles, reasons, summary) MUST be written in ${langName}. Do not mix languages.`;

    const userPrompt = `Analyze this ${category} image and respond by calling the provided tool. Be specific, kind, and actionable. Provide 2-5 items for missing and 0-4 items for remove. Score 0-100 reflects current overall styling. Write every field in ${langName}.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: image } },
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
                  items: {
                    type: "object",
                    properties: { title: { type: "string" }, reason: { type: "string" } },
                    required: ["title", "reason"],
                    additionalProperties: false,
                  },
                },
                remove: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { title: { type: "string" }, reason: { type: "string" } },
                    required: ["title", "reason"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
                score: { type: "integer", minimum: 0, maximum: 100 },
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
          JSON.stringify({ error: "AI credits exhausted." }),
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
    console.error("analyze-image-public error", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
