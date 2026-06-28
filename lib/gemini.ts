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
