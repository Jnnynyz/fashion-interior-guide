// Generate an AI "after" visualization for an analysis
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Verify caller's JWT
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
    const callerId = userData.user.id;

    const { analysisId, environment } = await req.json();
    if (!analysisId) {
      return new Response(JSON.stringify({ error: "Missing analysisId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: analysis, error: loadErr } = await admin
      .from("analyses")
      .select("*")
      .eq("id", analysisId)
      .maybeSingle();

    if (loadErr || !analysis) {
      return new Response(JSON.stringify({ error: "Analysis not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ownership check — caller must own this analysis
    if (analysis.user_id !== callerId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (analysis.after_image_url) {
      // Refresh signed URL for return
      const { data: signedAfter } = await admin.storage
        .from("analysis-images")
        .createSignedUrl(analysis.after_image_path ?? "", 3600);
      return new Response(
        JSON.stringify({ after_image_url: signedAfter?.signedUrl ?? analysis.after_image_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Entitlement: consume 1 credit per After image (subscriptions skip)
    const env = environment === "live" ? "live" : "sandbox";
    const { data: ok, error: rpcErr } = await admin.rpc("consume_credit", {
      user_uuid: analysis.user_id,
      related: analysis.id,
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

    // Sign source image for AI access
    const { data: signedSrc, error: signErr } = await admin.storage
      .from("analysis-images")
      .createSignedUrl(analysis.image_path, 600);
    if (signErr || !signedSrc?.signedUrl) {
      console.error("sign url error", signErr);
      return new Response(JSON.stringify({ error: "Could not access source image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const missing = (analysis.missing as Array<{ title: string }>) ?? [];
    const remove = (analysis.remove as Array<{ title: string }>) ?? [];
    const subject = analysis.category === "outfit" ? "outfit photo of this person" : "interior photo of this room";
    const addList = missing.map((m) => m.title).join(", ") || "nothing specific";
    const removeList = remove.map((r) => r.title).join(", ") || "nothing specific";

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
              { type: "image_url", image_url: { url: signedSrc.signedUrl } },
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
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable AI workspace." }), {
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

    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "image/png";
    const ext = mime.includes("jpeg") ? "jpg" : "png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const path = `${analysis.user_id}/${analysis.id}-after.${ext}`;
    const { error: upErr } = await admin.storage
      .from("analysis-images")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (upErr) {
      console.error("Upload error:", upErr);
      return new Response(JSON.stringify({ error: "Failed to save image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store path; image_url is kept for backward compatibility but not used to serve.
    const { error: updErr } = await admin
      .from("analyses")
      .update({ after_image_url: path, after_image_path: path })
      .eq("id", analysis.id);
    if (updErr) console.error("Update error:", updErr);

    const { data: signedNew } = await admin.storage
      .from("analysis-images")
      .createSignedUrl(path, 3600);

    return new Response(JSON.stringify({ after_image_url: signedNew?.signedUrl ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-after-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
