"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dhKey: z.string().min(1),
  authKey: z.string().min(1),
});

export async function subscribeToPush(
  input: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { success: false, error: "Not signed in" };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userData.user.id,
      endpoint: parsed.data.endpoint,
      p256dh_key: parsed.data.p256dhKey,
      auth_key: parsed.data.authKey,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}
