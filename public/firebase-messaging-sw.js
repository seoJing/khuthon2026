/* eslint-disable */
// Firebase Cloud Messaging — Service Worker
// 백그라운드/앱 닫힘 상태에서 푸시 수신 + 알림 표시.
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCUav7iRoNNZm5EZ5ehvqlD8WHB4fhmy_4",
  authDomain: "byeolzari-dev.firebaseapp.com",
  projectId: "byeolzari-dev",
  storageBucket: "byeolzari-dev.firebasestorage.app",
  messagingSenderId: "573322577310",
  appId: "1:573322577310:web:42adb19f5cbf822cecc28f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "누가 스쳐갔어요";
  const body = payload.notification?.body ?? "당신이 모르는 문화";
  const data = payload.data ?? {};

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.notifId ?? "encounter",
    data: {
      notifId: data.notifId,
      type: data.type,
    },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notifId = event.notification.data?.notifId;
  const url = notifId ? `/encounter/${notifId}` : "/home";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
