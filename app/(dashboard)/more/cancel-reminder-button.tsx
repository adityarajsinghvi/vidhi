"use client";

import { cancelReminder } from "./reminders-actions";

export function CancelReminderButton({ reminderId }: { reminderId: string }) {
  return (
    <form
      action={cancelReminder}
      onSubmit={(e) => {
        if (!confirm("Cancel this reminder?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="reminderId" value={reminderId} />
      <button type="submit" className="text-sm font-medium text-red-500">
        Cancel
      </button>
    </form>
  );
}
