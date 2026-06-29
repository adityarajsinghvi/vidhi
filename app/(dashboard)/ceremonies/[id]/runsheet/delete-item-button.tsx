"use client";

import { deleteRunSheetItem } from "./actions";

export function DeleteItemButton({ itemId, ceremonyId }: { itemId: string; ceremonyId: string }) {
  return (
    <form
      action={deleteRunSheetItem}
      onSubmit={(e) => {
        if (!confirm("Delete this run sheet item?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="ceremonyId" value={ceremonyId} />
      <button type="submit" className="px-1 text-base text-faint">
        ×
      </button>
    </form>
  );
}
