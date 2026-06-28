"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "./push-actions";

type Status = "checking" | "unsupported" | "off" | "on" | "denied" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    });
  }, []);

  async function enable() {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error("Push isn't configured yet");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const keys = subscription.toJSON().keys;
      if (!keys?.p256dh || !keys?.auth) throw new Error("Subscription is missing keys");

      const result = await subscribeToPush({
        endpoint: subscription.endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
      });
      if (!result.success) throw new Error(result.error);

      setStatus("on");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't enable notifications");
      setStatus("error");
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted">
        Notifications aren&apos;t supported in this browser. On iPhone, add Vidhi to your Home
        Screen first.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-muted">
        Notifications are blocked for Vidhi. Enable them in your browser/device settings to get
        reminders.
      </p>
    );
  }

  if (status === "on") {
    return <p className="text-sm text-accent">Reminders are on for this device.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={enable}
        className="rounded-btn bg-accent px-4 py-3.5 text-sm font-semibold text-accent-ink shadow-[0_10px_24px_var(--color-accent-glow)]"
      >
        Enable reminder notifications
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
