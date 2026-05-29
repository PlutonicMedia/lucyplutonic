import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { prompt, aspectRatio, quality, format: imgFormat, folderId, referenceImages } = await req.json();

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build message content with optional reference images
    const baseContentParts: any[] = [];

    if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const refImg of referenceImages) {
        baseContentParts.push({
          type: "image_url",
          image_url: { url: refImg },
        });
      }
    }

    // ---- Sensitive content overrides + multi-model fallback ----
    const SENSITIVE_TRIGGERS = [
      "lingerie","undertøj","undertoj","bra","bh","panties","trusser",
      "swimwear","badetøj","badetoj","bikini","swimsuit","briefs",
      "bodysuit","negligé","neglige","thong","string","corset","korset",
    ];
    const isSensitive = (p: string) => {
      const lower = p.toLowerCase();
      return SENSITIVE_TRIGGERS.some((t) => new RegExp(`\\b${t}\\b`, "i").test(lower));
    };
    const sanitizePrompt = (p: string) =>
      `Professional e-commerce product photography for an apparel catalog. ` +
      `Tasteful, modest editorial styling with a fully posed adult model in a brightly lit photo studio. ` +
      `Focus on the garment fit, fabric, and color. No nudity, no suggestive posing. Subject: ${p}`;

    const buildContentParts = (text: string) => [
      ...baseContentParts,
      {
        type: "text",
        text: `Generate an image: ${text}. Aspect ratio: ${aspectRatio || "1:1"}. Style: high quality, professional.`,
      },
    ];

    type CallResult =
      | { kind: "ok"; imageBase64: string }
      | { kind: "blocked"; refusal: string }
      | { kind: "rate_limited" }
      | { kind: "no_credits" }
      | { kind: "error"; status: number; detail: string };

    const callImageModel = async (model: string, text: string): Promise<CallResult> => {
      const isOpenAIImage = model.startsWith("openai/gpt-image");
      let body: any;
      if (isOpenAIImage) {
        // OpenAI image endpoint shape — referenceImages are ignored here (different API).
        body = {
          model,
          prompt: `${text}. Aspect ratio: ${aspectRatio || "1:1"}. Professional product photography.`,
          size: "1024x1024",
          quality: "low",
          n: 1,
        };
      } else {
        body = {
          model,
          messages: [{ role: "user", content: buildContentParts(text) }],
          modalities: ["image", "text"],
        };
      }

      const endpoint = isOpenAIImage
        ? "https://ai.gateway.lovable.dev/v1/images/generations"
        : "https://ai.gateway.lovable.dev/v1/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) return { kind: "rate_limited" };
      if (res.status === 402) return { kind: "no_credits" };

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const looksLikeSafety = /safety|policy|content|blocked|moderation|sensitive/i.test(detail);
        if (looksLikeSafety) return { kind: "blocked", refusal: detail.slice(0, 500) };
        console.error(`Model ${model} error:`, res.status, detail);
        return { kind: "error", status: res.status, detail: detail.slice(0, 500) };
      }

      const data = await res.json();

      if (isOpenAIImage) {
        const b64 = data?.data?.[0]?.b64_json;
        if (b64) return { kind: "ok", imageBase64: `data:image/png;base64,${b64}` };
        return { kind: "blocked", refusal: JSON.stringify(data).slice(0, 500) };
      }

      const msg = data?.choices?.[0]?.message;
      const imageUrl = msg?.images?.[0]?.image_url?.url;
      if (imageUrl) return { kind: "ok", imageBase64: imageUrl };

      // No image but possibly a refusal text — treat as blocked
      const refusal =
        (typeof msg?.content === "string" ? msg.content : JSON.stringify(msg?.content)) ||
        "Model returned no image";
      return { kind: "blocked", refusal: String(refusal).slice(0, 500) };
    };

    const MODEL_CHAIN = [
      "google/gemini-3-pro-image-preview",
      "google/gemini-3.1-flash-image-preview",
      "openai/gpt-image-2",
    ];

    const sensitive = isSensitive(prompt);
    const triedModels: string[] = [];
    let lastRefusal = "";
    let imageBase64: string | null = null;

    outer: for (const model of MODEL_CHAIN) {
      // For sensitive prompts, skip the raw attempt and go straight to sanitized.
      const attempts = sensitive ? [sanitizePrompt(prompt)] : [prompt, sanitizePrompt(prompt)];
      for (const attemptText of attempts) {
        triedModels.push(model);
        const result = await callImageModel(model, attemptText);

        if (result.kind === "ok") {
          imageBase64 = result.imageBase64;
          break outer;
        }
        if (result.kind === "rate_limited") {
          return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (result.kind === "no_credits") {
          return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (result.kind === "blocked") {
          lastRefusal = result.refusal;
          continue; // try next attempt / model
        }
        // hard error → try next model
        lastRefusal = result.detail;
      }
    }

    if (!imageBase64) {
      return new Response(
        JSON.stringify({
          error: "Content was rejected by all available image models. Try rephrasing the prompt.",
          detail: lastRefusal,
          triedModels,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload to storage
    const ext = (imgFormat || "png").toLowerCase();
    const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;
    
    // Decode base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, binaryData, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    const { data: urlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    // Enforce 40-image limit per folder
    if (folderId) {
      const { data: folderImages } = await supabase
        .from("generated_images")
        .select("id, created_at")
        .eq("folder_id", folderId)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (folderImages && folderImages.length >= 40) {
        const toDelete = folderImages.slice(0, folderImages.length - 39);
        for (const img of toDelete) {
          await supabase.from("generated_images").delete().eq("id", img.id);
        }
      }
    }

    // Save to database
    const { data: savedImage, error: dbError } = await supabase
      .from("generated_images")
      .insert({
        user_id: userId,
        folder_id: folderId || null,
        prompt,
        aspect_ratio: aspectRatio || "1:1",
        quality: quality || "2K",
        format: imgFormat || "PNG",
        image_url: urlData.publicUrl,
        storage_path: fileName,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to save image record");
    }

    return new Response(JSON.stringify({ image: savedImage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
