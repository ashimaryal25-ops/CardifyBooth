import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const uploadPrintSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/png;base64,"),
});

function decodePngDataUrl(dataUrl: string) {
  const base64 = dataUrl.replace("data:image/png;base64,", "");
  return Buffer.from(base64, "base64");
}

async function ensurePrintBucket() {
  const supabase = getSupabaseAdmin();
  const bucketName = "card-prints";
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Could not list storage buckets: ${listError.message}`);
  }

  const bucketExists = buckets.some((bucket) => bucket.name === bucketName);

  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
    });

    if (createError) {
      throw new Error(`Could not create storage bucket: ${createError.message}`);
    }
  }

  return bucketName;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = uploadPrintSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PNG upload." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const bucketName = await ensurePrintBucket();
    const filePath = `${id}.png`;
    const pngBuffer = decodePngDataUrl(parsed.data.imageDataUrl);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Could not upload card PNG: ${uploadError.message}`);
    }

    const cardPngPath = `${bucketName}/${filePath}`;
    const { error: updateError } = await supabase
      .from("card_generations")
      .update({ card_png_path: cardPngPath })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Could not update card record: ${updateError.message}`);
    }

    const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return NextResponse.json({
      cardPngPath,
      publicUrl: publicUrl.publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PNG upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
