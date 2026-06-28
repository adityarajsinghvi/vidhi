import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

// Returns the subscription ids that turned out to be stale (410 Gone) so
// the caller can delete them — no point keeping a dead endpoint around.
export async function sendPushToSubscriptions(
  subscriptions: StoredSubscription[],
  payload: PushPayload,
): Promise<{ staleIds: string[] }> {
  const staleIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
          },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    }),
  );

  return { staleIds };
}
