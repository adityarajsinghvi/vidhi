import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToSubscriptions } from "@/lib/push";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: dueReminders } = await supabase
    .from("reminders")
    .select("id, wedding_id, message_text, wa_link")
    .eq("sent", false)
    .lte("scheduled_at", new Date().toISOString());

  if (!dueReminders || dueReminders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const weddingIds = [...new Set(dueReminders.map((r) => r.wedding_id))];

  // Notify everyone who can act on reminders: owners and coordinators.
  const { data: members } = await supabase
    .from("wedding_members")
    .select("wedding_id, user_id")
    .in("wedding_id", weddingIds)
    .in("role", ["owner", "coordinator"]);

  const userIdsByWedding = new Map<string, string[]>();
  for (const m of members ?? []) {
    const list = userIdsByWedding.get(m.wedding_id) ?? [];
    list.push(m.user_id);
    userIdsByWedding.set(m.wedding_id, list);
  }

  type Subscription = {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh_key: string;
    auth_key: string;
  };

  const recipientIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: subscriptions } =
    recipientIds.length > 0
      ? await supabase
          .from("push_subscriptions")
          .select("id, user_id, endpoint, p256dh_key, auth_key")
          .in("user_id", recipientIds)
      : { data: [] as Subscription[] };

  const subsByUser = new Map<string, Subscription[]>();
  for (const sub of subscriptions ?? []) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  const allStaleIds: string[] = [];
  let sentCount = 0;

  for (const reminder of dueReminders) {
    const userIds = userIdsByWedding.get(reminder.wedding_id) ?? [];
    const subs = userIds.flatMap((uid) => subsByUser.get(uid) ?? []);

    if (subs.length > 0) {
      const { staleIds } = await sendPushToSubscriptions(subs, {
        title: "Vidhi reminder",
        body: reminder.message_text,
        url: reminder.wa_link ?? "/dashboard",
      });
      allStaleIds.push(...staleIds);
      sentCount += 1;
    }

    await supabase.from("reminders").update({ sent: true }).eq("id", reminder.id);
  }

  if (allStaleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", allStaleIds);
  }

  return NextResponse.json({ sent: sentCount, processed: dueReminders.length });
}
