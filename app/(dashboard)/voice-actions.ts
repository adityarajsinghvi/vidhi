"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type ActionResult = { success: true } | { success: false; error: string };

async function currentWeddingId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("owner_user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return wedding?.id ?? null;
}

const paymentSchema = z.object({
  vendorId: z.string().uuid(),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  mode: z.enum(["cash", "upi", "bank"], { message: "Pick a payment mode" }),
  type: z.enum(["advance", "balance"], { message: "Pick a payment type" }),
});

export async function confirmVoicePayment(input: unknown): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    vendor_id: parsed.data.vendorId,
    amount: parsed.data.amount,
    mode: parsed.data.mode,
    type: parsed.data.type,
    created_via: "voice",
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${parsed.data.vendorId}`);
  return { success: true };
}

const taskSchema = z.object({
  ceremonyId: z.string().uuid(),
  description: z.string().trim().min(1, "Enter what needs to be done"),
  vendorId: z.string().uuid().optional().nullable(),
  dueAt: z.string().optional().nullable(),
});

export async function confirmVoiceTask(input: unknown): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    ceremony_id: parsed.data.ceremonyId,
    vendor_id: parsed.data.vendorId || null,
    description: parsed.data.description,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/tasks");
  return { success: true };
}

const markDoneSchema = z.object({ taskId: z.string().uuid() });

export async function confirmVoiceTaskDone(input: unknown): Promise<ActionResult> {
  const parsed = markDoneSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ done: true })
    .eq("id", parsed.data.taskId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/tasks");
  return { success: true };
}

const reminderSchema = z.object({
  vendorId: z.string().uuid(),
  scheduledAt: z.string().min(1, "Pick when to send this"),
  messageText: z.string().trim().min(1, "Enter the message"),
});

export async function confirmVoiceReminder(input: unknown): Promise<ActionResult> {
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const weddingId = await currentWeddingId();
  if (!weddingId) {
    return { success: false, error: "No wedding found" };
  }

  const supabase = await createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("phone")
    .eq("id", parsed.data.vendorId)
    .maybeSingle();

  const waLink = vendor?.phone ? buildWhatsAppLink(vendor.phone, parsed.data.messageText) : null;

  const { error } = await supabase.from("reminders").insert({
    wedding_id: weddingId,
    vendor_id: parsed.data.vendorId,
    message_text: parsed.data.messageText,
    scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
    wa_link: waLink,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/more");
  return { success: true };
}
