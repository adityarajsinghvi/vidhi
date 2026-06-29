"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";

type ActionResult = { success: true } | { success: false; error: string };

const inviteSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  role: z.enum(["coordinator", "helper"], { message: "Pick a role" }),
});

export async function inviteMember(formData: FormData): Promise<ActionResult> {
  const active = await requireWedding();
  if (!can.manageTeam(active.role)) {
    return { success: false, error: "Only the owner can manage the team" };
  }

  const rawPhone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const parsed = inviteSchema.safeParse({ phone: rawPhone, role: formData.get("role") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Match the E.164-without-plus form Supabase stores on the auth user's phone.
  const phone = `91${parsed.data.phone}`;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("wedding_invites").upsert(
    {
      wedding_id: active.id,
      phone,
      role: parsed.data.role,
      invited_by: userData.user?.id ?? null,
    },
    { onConflict: "wedding_id,phone" },
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/more");
  return { success: true };
}

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["coordinator", "helper"], { message: "Pick a role" }),
});

export async function changeMemberRole(formData: FormData): Promise<ActionResult> {
  const active = await requireWedding();
  if (!can.manageTeam(active.role)) {
    return { success: false, error: "Only the owner can manage the team" };
  }

  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  // Never downgrade the owner via this path.
  const { error } = await supabase
    .from("wedding_members")
    .update({ role: parsed.data.role })
    .eq("wedding_id", active.id)
    .eq("user_id", parsed.data.userId)
    .neq("role", "owner");

  if (error) return { success: false, error: error.message };

  revalidatePath("/more");
  return { success: true };
}

export async function removeMember(formData: FormData): Promise<ActionResult> {
  const active = await requireWedding();
  if (!can.manageTeam(active.role)) {
    return { success: false, error: "Only the owner can manage the team" };
  }

  const userId = String(formData.get("userId"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("wedding_members")
    .delete()
    .eq("wedding_id", active.id)
    .eq("user_id", userId)
    .neq("role", "owner");

  if (error) return { success: false, error: error.message };

  revalidatePath("/more");
  return { success: true };
}

export async function cancelInvite(formData: FormData): Promise<ActionResult> {
  const active = await requireWedding();
  if (!can.manageTeam(active.role)) {
    return { success: false, error: "Only the owner can manage the team" };
  }

  const inviteId = String(formData.get("inviteId"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("wedding_invites")
    .delete()
    .eq("id", inviteId)
    .eq("wedding_id", active.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/more");
  return { success: true };
}
