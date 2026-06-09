"use server";

import {
  deleteCardGeneration,
  type PrintStatus,
  updateCardPrintStatus,
} from "@/lib/admin-cards";

export async function updatePrintStatusAction(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "");
  const status = String(formData.get("status") ?? "") as PrintStatus;

  if (!cardId) {
    throw new Error("Missing card id.");
  }

  await updateCardPrintStatus(cardId, status);
}

export async function deleteCardGenerationAction(formData: FormData) {
  const cardId = String(formData.get("cardId") ?? "");

  if (!cardId) {
    throw new Error("Missing card id.");
  }

  await deleteCardGeneration(cardId);
}
