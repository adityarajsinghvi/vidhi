"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallButton() {
  const router = useRouter();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!installEvent) return null;

  async function install(event: BeforeInstallPromptEvent) {
    await event.prompt();
    const { outcome } = await event.userChoice;
    setInstallEvent(null);
    if (outcome === "accepted") {
      setInstalled(true);
      setTimeout(() => router.push("/dashboard"), 800);
    }
  }

  return (
    <button
      type="button"
      onClick={() => install(installEvent)}
      className="mb-3 rounded-btn bg-accent px-4 py-4 text-center text-base font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
    >
      {installed ? "Installed!" : "Install Vidhi"}
    </button>
  );
}
