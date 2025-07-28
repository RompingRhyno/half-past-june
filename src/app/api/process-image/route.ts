export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/your-edge-func-name`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ path: body.path }),
  });

  const json = await res.json();
  return new Response(JSON.stringify(json), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
