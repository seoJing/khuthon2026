"use client";

import { useEffect } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getDb, getFirebaseAuth } from "./firebase";
import { useApp, type NotificationItem } from "./store";

/**
 * 로그인된 사용자의 users/{uid}/notifications 를 Firestore onSnapshot 으로 구독.
 * 도착·열람 변화 즉시 store.notifications 에 반영.
 */
export function useNotificationsSync() {
  const setNotifications = useApp((s) => s.setNotifications);

  useEffect(() => {
    let unsubAuth: (() => void) | null = null;
    let unsubSnap: (() => void) | null = null;

    unsubAuth = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (unsubSnap) {
        unsubSnap();
        unsubSnap = null;
      }
      if (!user) {
        setNotifications([]);
        return;
      }
      const ref = collection(
        getDb(),
        "users",
        user.uid,
        "notifications",
      );
      const q = query(ref, orderBy("sentAt", "desc"));
      unsubSnap = onSnapshot(
        q,
        (snap) => {
          const items: NotificationItem[] = snap.docs.map((d) => {
            const data = d.data();
            const sent = data.sentAt as Timestamp | undefined;
            return {
              id: d.id,
              starIds: (data.starIds as string[]) ?? [],
              starCount: (data.starCount as number) ?? 0,
              encounterRegionLabel:
                (data.encounterRegionLabel as string | null) ?? null,
              sentAt: sent ? sent.toMillis() : 0,
              opened: !!data.opened,
            };
          });
          setNotifications(items);
        },
        (err) => {
          console.warn("[notifications] snapshot error", err);
        },
      );
    });

    return () => {
      if (unsubSnap) unsubSnap();
      if (unsubAuth) unsubAuth();
    };
  }, [setNotifications]);
}
