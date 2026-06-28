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
    .select("id, wedding_id, message_text, wa_link, weddings(owner_user_id)")
    .eq("sent", false)
    .lte("scheduled_at", new Date().toISOString());

  if (!dueReminders || dueReminders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const ownerIds = [
    ...new Set(
      dueReminders
        .map((r) => {
          const wedding = Array.isArray(r.weddings) ? r.weddings[0] : r.weddings;
          return wedding?.owner_user_id as string | undefined;
        })
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  type Subscription = {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh_key: string;
    auth_key: string;
  };

  const { data: subscriptions } =
    ownerIds.length > 0
      ? await supabase
          .from("push_subscriptions")
          .select("id, user_id, endpoint, p256dh_key, auth_key")
          .in("user_id", ownerIds)
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
    const wedding = Array.isArray(reminder.weddings) ? reminder.weddings[0] : reminder.weddings;
    const ownerId = wedding?.owner_user_id as string | undefined;
    const subs = ownerId ? subsByUser.get(ownerId) ?? [] : [];

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
