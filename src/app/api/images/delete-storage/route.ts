import { supabaseAdmin } from "@/lib/supabaseAdmin"; // service role client
import { BASE_BUCKET } from "@/lib/imagePaths";

export async function POST(req: Request) {
  const { paths } = await req.json();

  const { data, error } = await supabaseAdmin.storage
    .from(BASE_BUCKET)
    .remove(paths);

  if (error) {
    console.error("Storage delete failed:", error);
    return new Response("Storage delete failed", { status: 500 });
  }

  return new Response(JSON.stringify({ data }), { status: 200 });
}
