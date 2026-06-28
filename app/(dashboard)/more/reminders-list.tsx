import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { CancelReminderButton } from "./cancel-reminder-button";

export async function RemindersList() {
  const wedding = await requireWedding();
  const supabase = await createClient();

  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, message_text, scheduled_at, vendors(name)")
    .eq("wedding_id", wedding.id)
    .eq("sent", false)
    .order("scheduled_at", { ascending: true });

  if (!reminders || reminders.length === 0) {
    return <p className="text-sm text-muted">No reminders scheduled.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {reminders.map((r) => {
        const vendor = Array.isArray(r.vendors) ? r.vendors[0] : r.vendors;
        return (
          <div
            key={r.id}
            className="flex items-start justify-between gap-3 rounded-card border border-field-border bg-field p-3.5"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">{vendor?.name ?? "Vendor"}</div>
              <div className="mt-0.5 text-xs text-muted">{r.message_text}</div>
              <div className="mt-1 text-xs text-accent">
                {new Date(r.scheduled_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <CancelReminderButton reminderId={r.id} />
          </div>
        );
      })}
    </div>
  );
}
