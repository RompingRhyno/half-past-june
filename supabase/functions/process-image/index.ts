import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from "npm:@imagemagick/magick-wasm@0.0.30";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

// Initialize ImageMagick
const wasmBytes = await Deno.readFile(
  new URL("magick.wasm", import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30"))
);
await initializeImageMagick(wasmBytes);

// const TARGET_WIDTHS = [720, 900, 1080, 1296, 1512, 1728, 2048];
const TARGET_WIDTHS = [720, 1080, 1512];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

Deno.serve(async (req) => {
  const startTime = Date.now();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers,
      });
    }

    let body;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", details: err.message }),
        { status: 400, headers },
      );
    }

    if (!body?.path || typeof body.path !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid path parameter" }),
        { status: 400, headers },
      );
    }

    const path = body.path;
    const ext = path.split(".").pop()?.toLowerCase();
    const validFormats = ["jpg", "jpeg", "png", "webp"];

    if (!ext || !validFormats.includes(ext)) {
      return new Response(
        JSON.stringify({
          error: "Unsupported format",
          supported_formats: validFormats,
          received_extension: ext,
        }),
        { status: 400, headers },
      );
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from("product-images")
      .download(path);
    if (downloadError || !file) {
      return new Response(
        JSON.stringify({
          error: downloadError?.message || "Download failed",
        }),
        { status: 400, headers },
      );
    }

    const originalBuffer = new Uint8Array(await file.arrayBuffer());
    if (originalBuffer.byteLength > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          max_size: MAX_FILE_SIZE,
          actual_size: originalBuffer.byteLength,
        }),
        { status: 400, headers },
      );
    }

    // Extract slug from path like "<slug>/original/image.jpg"
    const pathParts = path.split("/");
    const slug = pathParts[0];
    const baseName = pathParts[pathParts.length - 1].replace(`.${ext}`, "");

    const variants = [];

    for (const width of TARGET_WIDTHS) {
      console.log(`Processing ${width}px variant for ${slug}/${baseName}.${ext}`);

      try {
        const outputBuffer = ImageMagick.read(originalBuffer, (image) => {
          image.resize(width, 0); // Maintain aspect ratio
          if (ext === "jpg" || ext === "jpeg") {
            image.quality = 85;
          }
          if (ext === "png") {
            image.defineValue("png", "compression-level", "9");
          }
          const format = ext === "jpg"
            ? MagickFormat.Jpeg
            : ext === "png"
            ? MagickFormat.Png
            : MagickFormat.Webp;
          return image.write(format, (data) => data);
        });

        const uploadPath = `${slug}/resized/${baseName}_${width}x.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(uploadPath, outputBuffer, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        variants.push({
          width,
          path: uploadPath,
          size_bytes: outputBuffer.length,
        });
      } catch (err) {
        variants.push({
          width,
          error: err instanceof Error ? err.message : String(err),
          status: "failed",
        });
      }
    }

    const totalTime = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        success: true,
        slug,
        original_path: path,
        variants,
        processing_time_ms: totalTime,
      }),
      { headers },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMsg,
      }),
      { status: 500, headers },
    );
  }
});
