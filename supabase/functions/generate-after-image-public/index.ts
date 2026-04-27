// Public (unauthenticated) AI "after" image generation for guest free trial.
// Accepts a base64 data URL or http(s) image URL plus the missing/remove lists
// from the analysis. Returns a base64 data URL for the generated image.
// Frontend enforces the 5-use guest limit; this is a soft trial only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { image, category, missing, remove } = await req.json();
    if (!image || typeof image !== "string" || !category) {
      return new Response(JSON.stringify({ error: "image and category required" }), {
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
    if (image.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const missArr = Array.isArray(missing) ? missing : [];
    const remArr = Array.isArray(remove) ? remove : [];
    const subject = category === "outfit" ? "outfit photo of this person" : "interior photo of this room";
    const addList =
      missArr.map((m: { title?: string }) => m?.title).filter(Boolean).join(", ") || "nothing specific";
    const removeList =
      remArr.map((r: { title?: string }) => r?.title).filter(Boolean).join(", ") || "nothing specific";

    const promptText = `Edit this ${subject} to reflect these styling changes. Add: ${addList}. Remove or replace: ${removeList}. Keep the same person/room identity, pose, framing, camera angle, and natural lighting. Photorealistic, Scandinavian minimal aesthetic, elevated and clean. Do not add text or watermarks.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const dataUrl: string | undefined = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      console.error("No image in AI response", JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image returned by model" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ after_image_url: dataUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-after-image-public error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
