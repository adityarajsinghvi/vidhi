const GEMINI_MODEL = "gemini-2.5-flash";

export type ParsedPayment = {
  amount: number | null;
  mode: "cash" | "upi" | "bank" | null;
  confidence: "high" | "low";
};

// Server-side only — never call Gemini from the client, keeps the API key
// off the device per the design doc's AI architecture rule.
export async function parsePaymentMessage(text: string): Promise<ParsedPayment> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `Extract a single payment-received event from a short message a wedding vendor or planner sent. ` +
                  `The message may mix Hindi/Hinglish and English, e.g. "10 hazaar mil gaye", "received 5000 via upi", ` +
                  `"advance ka 20k cash le liya". "hazaar" and "k" mean thousands; "lakh" means hundred thousand. ` +
                  `Return strict JSON only matching the schema. If no clear amount is present, set amount to null and confidence to "low".\n\n` +
                  `Message: ${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              amount: { type: "number", nullable: true },
              mode: { type: "string", enum: ["cash", "upi", "bank"], nullable: true },
              confidence: { type: "string", enum: ["high", "low"] },
            },
            required: ["confidence"],
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini request failed: ${res.status} ${body}`.trim());
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error("Gemini returned no content");
  }

  const parsed = JSON.parse(raw);
  return {
    amount: typeof parsed.amount === "number" ? parsed.amount : null,
    mode: parsed.mode === "cash" || parsed.mode === "upi" || parsed.mode === "bank" ? parsed.mode : null,
    confidence: parsed.confidence === "high" ? "high" : "low",
  };
}

export type VoiceIntent =
  | "payment_received"
  | "add_task"
  | "mark_task_done"
  | "schedule_message"
  | "unrecognized";

export type ParsedVoiceCommand = {
  intent: VoiceIntent;
  transcript: string;
  amount: number | null;
  mode: "cash" | "upi" | "bank" | null;
  vendorName: string | null;
  ceremonyName: string | null;
  description: string | null;
  dueAt: string | null;
  taskDescription: string | null;
  scheduledAt: string | null;
  messageText: string | null;
};

// One flat schema covers all 4 v1 intents (the model fills only the fields
// relevant to whichever it picks) — Gemini's structured-output schema
// doesn't support discriminated unions cleanly, and v1's intent set is
// small and fixed, so this is simpler than per-intent schemas.
export async function parseVoiceCommand(
  audioBase64: string,
  mimeType: string,
  context: {
    now: string;
    vendorNames: string[];
    ceremonyNames: string[];
    incompleteTaskDescriptions: string[];
  },
): Promise<ParsedVoiceCommand> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const promptText =
    `You are parsing a short voice command from an Indian wedding planner, recorded as audio. ` +
    `Speech may mix Hindi/Hinglish and English (e.g. "10 hazaar mil gaye", "kal 5 baje", "Royal Caterers ko bol dena"). ` +
    `Current date/time: ${context.now}. ` +
    `Known vendors: ${context.vendorNames.join(", ") || "(none)"}. ` +
    `Known ceremonies: ${context.ceremonyNames.join(", ") || "(none)"}. ` +
    `Open tasks: ${context.incompleteTaskDescriptions.join(", ") || "(none)"}. ` +
    `\n\nFirst transcribe the audio, then classify it into exactly one of these intents:\n` +
    `- payment_received: a vendor payment was received (fields: amount, mode, vendorName)\n` +
    `- add_task: a new to-do tied to a ceremony (fields: ceremonyName, description, vendorName optional, dueAt optional ISO 8601 resolved against current date/time)\n` +
    `- mark_task_done: an existing open task should be marked complete (field: taskDescription — match it as closely as possible to one of the open tasks listed above)\n` +
    `- schedule_message: schedule a reminder to message a vendor later, never send immediately (fields: vendorName, scheduledAt ISO 8601 resolved against current date/time, messageText)\n` +
    `- unrecognized: doesn't clearly match any of the above\n\n` +
    `Match vendorName/ceremonyName as closely as possible to the known lists above when there's a clear match. ` +
    `Return strict JSON only matching the schema, with every field present (null where not applicable).`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              { inlineData: { mimeType, data: audioBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: [
                  "payment_received",
                  "add_task",
                  "mark_task_done",
                  "schedule_message",
                  "unrecognized",
                ],
              },
              transcript: { type: "string" },
              amount: { type: "number", nullable: true },
              mode: { type: "string", enum: ["cash", "upi", "bank"], nullable: true },
              vendorName: { type: "string", nullable: true },
              ceremonyName: { type: "string", nullable: true },
              description: { type: "string", nullable: true },
              dueAt: { type: "string", nullable: true },
              taskDescription: { type: "string", nullable: true },
              scheduledAt: { type: "string", nullable: true },
              messageText: { type: "string", nullable: true },
            },
            required: ["intent", "transcript"],
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini request failed: ${res.status} ${body}`.trim());
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error("Gemini returned no content");
  }

  const parsed = JSON.parse(raw);
  const validIntents: VoiceIntent[] = [
    "payment_received",
    "add_task",
    "mark_task_done",
    "schedule_message",
    "unrecognized",
  ];

  return {
    intent: validIntents.includes(parsed.intent) ? parsed.intent : "unrecognized",
    transcript: typeof parsed.transcript === "string" ? parsed.transcript : "",
    amount: typeof parsed.amount === "number" ? parsed.amount : null,
    mode: parsed.mode === "cash" || parsed.mode === "upi" || parsed.mode === "bank" ? parsed.mode : null,
    vendorName: typeof parsed.vendorName === "string" ? parsed.vendorName : null,
    ceremonyName: typeof parsed.ceremonyName === "string" ? parsed.ceremonyName : null,
    description: typeof parsed.description === "string" ? parsed.description : null,
    dueAt: typeof parsed.dueAt === "string" ? parsed.dueAt : null,
    taskDescription: typeof parsed.taskDescription === "string" ? parsed.taskDescription : null,
    scheduledAt: typeof parsed.scheduledAt === "string" ? parsed.scheduledAt : null,
    messageText: typeof parsed.messageText === "string" ? parsed.messageText : null,
  };
}
