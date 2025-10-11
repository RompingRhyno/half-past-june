import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { productId, basename, extension, order } = await req.json();

    if (!productId || !basename || !extension) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newImage = await prisma.image.create({
      data: {
        product: { connect: { id: productId } },
        basename,
        extension,
        order,
      },
    });

    return NextResponse.json({ id: newImage.id });
  } catch (err: any) {
    console.error("Failed to create image row:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
