"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { SelectField } from "@/components/select-field";
import {
  confirmVoicePayment,
  confirmVoiceTask,
  confirmVoiceTaskDone,
  confirmVoiceReminder,
} from "./voice-actions";

type ParsedVoiceCommand = {
  intent: "payment_received" | "add_task" | "mark_task_done" | "schedule_message" | "unrecognized";
  transcript: string;
  amount: number | null;
  mode: "cash" | "upi" | "bank" | null;
  vendorId: string | null;
  vendorName: string | null;
  ceremonyId: string | null;
  ceremonyName: string | null;
  description: string | null;
  dueAt: string | null;
  taskId: string | null;
  taskDescription: string | null;
  scheduledAt: string | null;
  messageText: string | null;
  notAllowed?: boolean;
};

type Stage = "idle" | "recording" | "processing" | "confirm" | "done" | "error";

const RECORDER_MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string {
  for (const candidate of RECORDER_MIME_CANDIDATES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "audio/webm";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function VoiceRecorder() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedVoiceCommand | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function reset() {
    setStage("idle");
    setError(null);
    setParsed(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void handleRecordingComplete(mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStage("recording");
    } catch {
      setError("Couldn't access the microphone — check your browser permissions.");
      setStage("error");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setStage("processing");
  }

  async function handleRecordingComplete(mimeType: string) {
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const audioBase64 = await blobToBase64(blob);

      const res = await fetch("/api/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not understand that");

      setParsed(data);
      setStage("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not understand that");
      setStage("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Voice commands"
        className="-mt-3.5 flex h-[54px] w-[54px] items-center justify-center rounded-card bg-accent text-[22px] text-accent-ink shadow-[0_8px_20px_var(--color-accent-glow)]"
      >
        🎙
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col justify-end bg-voice-scrim">
            <div className="rounded-t-[24px] bg-sheet p-5 pb-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-display text-lg text-ink">Voice command</div>
                <button type="button" onClick={close} className="text-sm text-muted">
                  Close
                </button>
              </div>

              {stage === "idle" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <p className="text-center text-sm text-muted">
                    Try things like &ldquo;10 hazaar mil gaye from Royal Caters via UPI&rdquo; or
                    &ldquo;remind Royal Caters tomorrow 5pm about the menu&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
                  >
                    🎙
                  </button>
                </div>
              )}

              {stage === "recording" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <p className="text-sm text-muted">Listening… tap to stop</p>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl text-accent-ink"
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50" />
                    <span className="relative">⏹</span>
                  </button>
                </div>
              )}

              {stage === "processing" && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <p className="text-sm text-muted">Working out what you meant…</p>
                </div>
              )}

              {stage === "error" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <p className="text-center text-sm text-red-500">{error}</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-btn border border-field-border bg-field px-4 py-3 text-sm font-semibold text-ink"
                  >
                    Try again
                  </button>
                </div>
              )}

              {stage === "confirm" && parsed && (
                <VoiceConfirmCard
                  parsed={parsed}
                  onCancel={reset}
                  onDone={() => {
                    setStage("done");
                    router.refresh();
                    setTimeout(close, 900);
                  }}
                />
              )}

              {stage === "done" && (
                <div className="flex flex-col items-center gap-2 py-10">
                  <div className="text-2xl">✓</div>
                  <p className="text-sm text-muted">Saved</p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function VoiceConfirmCard({
  parsed,
  onCancel,
  onDone,
}: {
  parsed: ParsedVoiceCommand;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(parsed.amount ?? "");
  const [mode, setMode] = useState(parsed.mode ?? "");
  const [type, setType] = useState("");
  const [description, setDescription] = useState(parsed.description ?? "");
  const [dueAt, setDueAt] = useState(parsed.dueAt ?? "");
  const [messageText, setMessageText] = useState(parsed.messageText ?? "");
  const [scheduledAt, setScheduledAt] = useState(parsed.scheduledAt ?? "");

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      let result: { success: boolean; error?: string };

      if (parsed.intent === "payment_received") {
        if (!parsed.vendorId) throw new Error("Couldn't match that to a vendor");
        result = await confirmVoicePayment({
          vendorId: parsed.vendorId,
          amount,
          mode,
          type,
        });
      } else if (parsed.intent === "add_task") {
        if (!parsed.ceremonyId) throw new Error("Couldn't match that to a ceremony");
        result = await confirmVoiceTask({
          ceremonyId: parsed.ceremonyId,
          description,
          vendorId: parsed.vendorId,
          dueAt: dueAt || null,
        });
      } else if (parsed.intent === "mark_task_done") {
        if (!parsed.taskId) throw new Error("Couldn't match that to an open task");
        result = await confirmVoiceTaskDone({ taskId: parsed.taskId });
      } else if (parsed.intent === "schedule_message") {
        if (!parsed.vendorId) throw new Error("Couldn't match that to a vendor");
        result = await confirmVoiceReminder({
          vendorId: parsed.vendorId,
          scheduledAt,
          messageText,
        });
      } else {
        throw new Error("Didn't catch a command in that — try again");
      }

      if (!result.success) throw new Error(result.error ?? "Could not save that");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-card border border-field-border bg-field p-3 text-sm text-muted">
        &ldquo;{parsed.transcript}&rdquo;
      </div>

      {parsed.intent === "unrecognized" && (
        <p className="text-sm text-muted">
          {parsed.notAllowed
            ? "As a Helper you can only manage tasks by voice — try adding or completing a task."
            : "Didn't catch a command in that. Try mentioning an amount, a vendor, or a task."}
        </p>
      )}

      {parsed.intent === "payment_received" && (
        <>
          <div className="text-xs font-medium text-accent">
            {parsed.vendorName ?? "Unmatched vendor"} — confirm the payment:
          </div>
          <div className="flex items-center gap-2.5 rounded-btn border border-field-border bg-field px-4 py-3.5">
            <span className="font-mono text-base text-ink">₹</span>
            <span className="h-5 w-px bg-field-border" />
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent font-mono text-base text-ink outline-none"
            />
          </div>
          <div className="flex gap-2.5">
            <SelectField
              name="mode"
              placeholder="Mode"
              className="flex-1"
              defaultValue={mode}
              options={[
                { value: "cash", label: "Cash" },
                { value: "upi", label: "UPI" },
                { value: "bank", label: "Bank" },
              ]}
              onValueChange={setMode}
            />
            <SelectField
              name="type"
              placeholder="Type"
              className="flex-1"
              defaultValue={type}
              options={[
                { value: "advance", label: "Advance" },
                { value: "balance", label: "Balance" },
              ]}
              onValueChange={setType}
            />
          </div>
        </>
      )}

      {parsed.intent === "add_task" && (
        <>
          <div className="text-xs font-medium text-accent">
            {parsed.ceremonyName ?? "Unmatched ceremony"} — confirm the task:
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to be done?"
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none"
          />
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
          />
        </>
      )}

      {parsed.intent === "mark_task_done" && (
        <div className="text-sm text-ink">
          Mark <span className="font-semibold">{parsed.taskDescription ?? "this task"}</span> as
          done?
        </div>
      )}

      {parsed.intent === "schedule_message" && (
        <>
          <div className="text-xs font-medium text-accent">
            {parsed.vendorName ?? "Unmatched vendor"} — schedule a reminder (this never sends
            automatically):
          </div>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm text-ink outline-none"
          />
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={2}
            className="rounded-btn border border-field-border bg-field px-4 py-3.5 text-base text-ink outline-none"
          />
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-btn border border-field-border bg-field px-4 py-3.5 text-sm font-semibold text-muted"
        >
          Discard
        </button>
        {parsed.intent !== "unrecognized" && (
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="flex-1 rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Confirm & save"}
          </button>
        )}
      </div>
    </div>
  );
}
