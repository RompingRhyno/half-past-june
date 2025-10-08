import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });

    await prisma.image.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete image row:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
