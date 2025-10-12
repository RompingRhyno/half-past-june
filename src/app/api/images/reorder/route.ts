import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {
      productId,
      orderedImages,
    }: {
      productId: string;
      orderedImages: { id: string; order: number }[];
    } = await req.json();

    if (!productId || !orderedImages?.length) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Update each image's order in the database
    const updates = orderedImages.map(({ id, order }) =>
      prisma.image.update({
        where: { id },
        data: { order },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Reorder images error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
