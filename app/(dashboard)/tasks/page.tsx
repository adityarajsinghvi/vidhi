import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { SelectField } from "@/components/select-field";
import { createTask, toggleTask } from "./actions";
import { DeleteTaskButton } from "./delete-task-button";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const wedding = await requireWedding();
  const supabase = await createClient();

  const [{ data: ceremonies }, { data: vendors }] = await Promise.all([
    supabase
      .from("ceremonies")
      .select("id, name, date")
      .eq("wedding_id", wedding.id)
      .order("date", { ascending: true }),
    supabase
      .from("vendors")
      .select("id, name")
      .eq("wedding_id", wedding.id)
      .order("name", { ascending: true }),
  ]);

  const ceremonyIds = (ceremonies ?? []).map((c) => c.id);
  const { data: tasks } =
    ceremonyIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, ceremony_id, vendor_id, description, due_at, done")
          .in("ceremony_id", ceremonyIds)
          .order("due_at", { ascending: true })
      : { data: [] as never[] };

  const vendorNameById = new Map((vendors ?? []).map((v) => [v.id, v.name]));

  if ((ceremonies ?? []).length === 0) {
    return (
      <div className="flex flex-col items-center px-5 pt-[120px] text-center">
        <div className="mb-3 text-3xl">✓</div>
        <div className="font-display text-xl text-ink">No ceremonies yet</div>
        <p className="mt-2 max-w-[260px] text-sm text-muted">
          Add a ceremony first, then you can build its task checklist here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-[60px]">
      <div className="mb-5 font-display text-[26px] leading-tight tracking-[0.01em] text-ink">
        Tasks
      </div>

      <form
        action={createTask}
        className="mb-[22px] flex flex-col gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
      >
        <input
          name="description"
          type="text"
          required
          placeholder="What needs to be done?"
          className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none placeholder:text-faint"
        />

        <div className="flex flex-col gap-2.5 min-[420px]:flex-row">
          <SelectField
            name="ceremonyId"
            required
            placeholder="Ceremony"
            className="flex-1"
            options={(ceremonies ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <SelectField
            name="vendorId"
            placeholder="No vendor"
            className="flex-1"
            options={(vendors ?? []).map((v) => ({ value: v.id, label: v.name }))}
          />
        </div>

        <input
          name="dueAt"
          type="datetime-local"
          className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
        >
          Add task
        </button>
      </form>

      {(ceremonies ?? []).map((ceremony) => {
        const ceremonyTasks = (tasks ?? []).filter((t) => t.ceremony_id === ceremony.id);
        if (ceremonyTasks.length === 0) return null;

        return (
          <div key={ceremony.id} className="mb-[22px]">
            <div className="mb-2.5 text-[15px] font-semibold text-ink">{ceremony.name}</div>
            <div className="flex flex-col gap-2.5">
              {ceremonyTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-card border border-field-border bg-card p-3.5 shadow-card"
                >
                  <form action={toggleTask} className="flex items-center gap-3 flex-1 min-w-0">
                    <input type="hidden" name="taskId" value={t.id} />
                    <input type="hidden" name="nextDone" value={String(!t.done)} />
                    <button
                      type="submit"
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs ${
                        t.done
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-field-border bg-field text-transparent"
                      }`}
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium ${t.done ? "text-muted line-through" : "text-ink"}`}
                      >
                        {t.description}
                      </div>
                      <div className="text-xs text-muted">
                        {t.vendor_id && vendorNameById.get(t.vendor_id)}
                        {t.vendor_id && t.due_at && " · "}
                        {t.due_at &&
                          new Date(t.due_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                  </form>
                  <DeleteTaskButton taskId={t.id} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {(tasks ?? []).length === 0 && (
        <p className="text-sm text-muted">No tasks yet — add your first one above.</p>
      )}
    </div>
  );
}
