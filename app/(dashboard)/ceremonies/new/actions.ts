"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/weddings";

const ceremonySchema = z.object({
  name: z.string().trim().min(1, "Enter a ceremony name"),
  date: z.string().optional(),
  time: z.string().optional(),
  venue: z.string().optional(),
  notes: z.string().optional(),
});

export async function createCeremony(formData: FormData) {
  const parsed = ceremonySchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date") || undefined,
    time: formData.get("time") || undefined,
    venue: formData.get("venue") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    redirect(`/ceremonies/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const wedding = await requireWedding();
  const supabase = await createClient();
  const { name, date, time, venue, notes } = parsed.data;

  const { error } = await supabase.from("ceremonies").insert({
    wedding_id: wedding.id,
    name,
    date: date || null,
    time: time || null,
    venue: venue || null,
    notes: notes || null,
  });

  if (error) {
    redirect(`/ceremonies/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
