import { z } from "zod";

const uploadPrintResponseSchema = z.object({
  cardPngPath: z.string(),
  publicUrl: z.string().url(),
});

export async function uploadCardPrint(cardId: string, imageDataUrl: string) {
  const response = await fetch(`/api/cards/${cardId}/print-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageDataUrl }),
  });

  if (!response.ok) {
    throw new Error("Could not save generated card PNG.");
  }

  const data: unknown = await response.json();
  return uploadPrintResponseSchema.parse(data);
}
