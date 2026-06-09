"use client";

interface DeleteCardButtonProps {
  cardId: string;
  action: (formData: FormData) => void;
  compact?: boolean;
}

export function DeleteCardButton({ cardId, action, compact = false }: DeleteCardButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Delete this card record and its stored PNG? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="cardId" value={cardId} />
      <button
        type="submit"
        className={`rounded-[6px] border border-[#fecaca] bg-[#fef2f2] font-bold text-[#991b1b] hover:bg-[#fee2e2] ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        Delete
      </button>
    </form>
  );
}
