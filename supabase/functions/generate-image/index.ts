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
    const contentParts: any[] = [];

    if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const refImg of referenceImages) {
        contentParts.push({
          type: "image_url",
          image_url: { url: refImg },
        });
      }
    }

    contentParts.push({
      type: "text",
      text: `Generate an image: ${prompt}. Aspect ratio: ${aspectRatio || "1:1"}. Style: high quality, professional.`,
    });

    // Generate image via AI gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error("No image returned from AI");
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
