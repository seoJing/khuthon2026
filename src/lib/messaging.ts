"use client";

import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { getFirebaseApp } from "./firebase";

let messagingInstance: Messaging | null = null;
let registration: ServiceWorkerRegistration | null = null;

function getMessagingSafe(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!("Notification" in window)) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(getFirebaseApp());
  }
  return messagingInstance;
}

async function ensureRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (registration) return registration;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" },
  );
  await navigator.serviceWorker.ready;
  return registration;
}

/**
 * 푸시 권한 요청 + FCM 토큰 발급.
 * 반환: 토큰 또는 null (권한 거부/지원 X).
 */
export async function requestPushPermission(): Promise<string | null> {
  const messaging = getMessagingSafe();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  if (!vapidKey) {
    console.warn("[messaging] NEXT_PUBLIC_FCM_VAPID_KEY 미설정");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const reg = await ensureRegistration();
  if (!reg) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: reg,
    });
    return token || null;
  } catch (err) {
    console.warn("[messaging] getToken failed", err);
    return null;
  }
}

/**
 * 포그라운드 메시지 리스너. 앱이 켜져 있는 동안 도착한 메시지.
 */
export function onForegroundMessage(
  callback: (payload: {
    notifId?: string;
    title?: string;
    body?: string;
  }) => void,
): () => void {
  const messaging = getMessagingSafe();
  if (!messaging) return () => undefined;
  const unsub = onMessage(messaging, (payload) => {
    const data = (payload.data ?? {}) as Record<string, string>;
    callback({
      notifId: data.notifId,
      title: payload.notification?.title,
      body: payload.notification?.body,
    });
  });
  return unsub;
}
