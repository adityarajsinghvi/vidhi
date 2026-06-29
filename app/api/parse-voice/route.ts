import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseVoiceCommand } from "@/lib/gemini";
import { fuzzyFind } from "@/lib/fuzzy-match";
import { requireWedding } from "@/lib/weddings";
import { can } from "@/lib/permissions";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wedding = await requireWedding();

  const body = await request.json().catch(() => null);
  const audioBase64 = body?.audioBase64;
  const mimeType = body?.mimeType;

  if (typeof audioBase64 !== "string" || typeof mimeType !== "string") {
    return NextResponse.json({ error: "audioBase64 and mimeType are required" }, { status: 400 });
  }

  const [{ data: vendors }, { data: ceremonies }] = await Promise.all([
    supabase.from("vendors").select("id, name").eq("wedding_id", wedding.id),
    supabase.from("ceremonies").select("id, name").eq("wedding_id", wedding.id),
  ]);

  const ceremonyIds = (ceremonies ?? []).map((c) => c.id);
  const { data: openTasks } =
    ceremonyIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, description")
          .in("ceremony_id", ceremonyIds)
          .eq("done", false)
      : { data: [] as { id: string; description: string }[] };

  try {
    const parsed = await parseVoiceCommand(audioBase64, mimeType, {
      now: new Date().toISOString(),
      vendorNames: (vendors ?? []).map((v) => v.name),
      ceremonyNames: (ceremonies ?? []).map((c) => c.name),
      incompleteTaskDescriptions: (openTasks ?? []).map((t) => t.description),
    });

    // Helpers can only act on tasks — refuse money/reminder intents up front.
    if (
      !can.viewMoney(wedding.role) &&
      (parsed.intent === "payment_received" || parsed.intent === "schedule_message")
    ) {
      return NextResponse.json({
        intent: "unrecognized",
        transcript: parsed.transcript,
        notAllowed: true,
      });
    }

    const vendor = fuzzyFind(vendors ?? [], parsed.vendorName);
    const ceremony = fuzzyFind(ceremonies ?? [], parsed.ceremonyName);
    const task = fuzzyFind(
      (openTasks ?? []).map((t) => ({ id: t.id, name: t.description })),
      parsed.taskDescription,
    );

    return NextResponse.json({
      ...parsed,
      vendorId: vendor?.id ?? null,
      vendorName: vendor?.name ?? parsed.vendorName,
      ceremonyId: ceremony?.id ?? null,
      ceremonyName: ceremony?.name ?? parsed.ceremonyName,
      taskId: task?.id ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse voice command" },
      { status: 500 },
    );
  }
}
