"use client";

import { deleteWedding } from "../actions";

export function DeleteWeddingButton({
  weddingId,
  coupleNames,
}: {
  weddingId: string;
  coupleNames: string;
}) {
  return (
    <form
      action={deleteWedding}
      className="mt-5"
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete ${coupleNames}'s wedding? This permanently removes all its ceremonies, vendors, payments, and tasks.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="weddingId" value={weddingId} />
      <button
        type="submit"
        className="w-full rounded-btn border border-red-500/40 bg-card px-4 py-3.5 text-sm font-semibold text-red-500"
      >
        Delete wedding
      </button>
    </form>
  );
}
