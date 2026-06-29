"use client";

import { deleteContact } from "./actions";

export function DeleteContactButton({ contactId }: { contactId: string }) {
  return (
    <form
      action={deleteContact}
      onSubmit={(e) => {
        if (!confirm("Delete this contact?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="contactId" value={contactId} />
      <button type="submit" className="px-1 text-base text-faint">
        ×
      </button>
    </form>
  );
}
