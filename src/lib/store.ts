"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConstellationStar, Star } from "./types";
import { STARS } from "./seed";

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export interface OtherUniverseStar {
  starId: string;
  encounterRegionLabel: string | null;
  addedAt: number;
}

export interface NotificationItem {
  id: string;
  starIds: string[];
  starCount: number;
  encounterRegionLabel: string | null;
  sentAt: number;
  opened: boolean;
}

interface AppState {
  onboarded: boolean;
  myStars: ConstellationStar[];
  otherUniverse: OtherUniverseStar[];
  cooldowns: Record<string, number>;
  notifications: NotificationItem[];
  customStars: Star[];

  addCustomStar: (star: Star) => void;
  completeOnboarding: (starIds: string[]) => void;
  addStar: (
    starId: string,
  ) => { ok: true } | { ok: false; reason: "full"; current: ConstellationStar[] };
  forceAddStar: (starId: string, replaceTargetId: string) => void;
  dropStar: (starId: string) => { ok: boolean; reason?: "last" };

  setNotifications: (items: NotificationItem[]) => void;
  markNotificationOpenedLocal: (id: string) => void;

  resetAll: () => void;
}

function makeConstellation(starIds: string[]): ConstellationStar[] {
  const now = Date.now();
  return starIds.map((id, i) => ({
    starId: id,
    addedAt: now + i,
  }));
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      myStars: [],
      otherUniverse: seedOtherUniverse(),
      cooldowns: {},
      notifications: [],
      customStars: [],

      addCustomStar: (star) => {
        const { customStars } = get();
        if (customStars.some((c) => c.id === star.id)) return;
        set({ customStars: [...customStars, star] });
      },

      completeOnboarding: (starIds) => {
        // dedup + 7개 cap
        const ids = Array.from(new Set(starIds)).slice(0, 7);
        set({ onboarded: true, myStars: makeConstellation(ids) });
      },

      addStar: (starId) => {
        const { myStars, otherUniverse } = get();
        if (myStars.some((s) => s.starId === starId)) return { ok: true };
        if (myStars.length >= 7) {
          return { ok: false, reason: "full", current: myStars };
        }
        const nextIds = Array.from(
          new Set([...myStars.map((s) => s.starId), starId]),
        ).slice(0, 7);
        set({
          myStars: makeConstellation(nextIds),
          // 내 별자리에 들어왔으니 다른 우주 풀에서 제거
          otherUniverse: otherUniverse.filter((u) => u.starId !== starId),
        });
        return { ok: true };
      },

      forceAddStar: (starId, replaceTargetId) => {
        const { myStars, cooldowns, otherUniverse } = get();
        // 가드 — 이미 들어 있거나 잘못된 타겟이면 작업 안 함 (7개 초과 방지)
        if (myStars.some((s) => s.starId === starId)) return;
        if (!myStars.some((s) => s.starId === replaceTargetId)) return;
        const filteredIds = myStars
          .filter((s) => s.starId !== replaceTargetId)
          .map((s) => s.starId);
        const nextIds = Array.from(
          new Set([...filteredIds, starId]),
        ).slice(0, 7);
        set({
          myStars: makeConstellation(nextIds),
          cooldowns: {
            ...cooldowns,
            [replaceTargetId]: Date.now() + COOLDOWN_MS,
          },
          // 새로 추가된 별은 다른 우주에서 제거
          otherUniverse: otherUniverse.filter((u) => u.starId !== starId),
        });
      },

      dropStar: (starId) => {
        const { myStars, cooldowns } = get();
        if (myStars.length <= 1) return { ok: false, reason: "last" };
        set({
          myStars: makeConstellation(
            myStars.filter((s) => s.starId !== starId).map((s) => s.starId),
          ),
          cooldowns: { ...cooldowns, [starId]: Date.now() + COOLDOWN_MS },
        });
        return { ok: true };
      },

      setNotifications: (items) => {
        set({ notifications: items });
      },

      markNotificationOpenedLocal: (id) => {
        const { notifications } = get();
        set({
          notifications: notifications.map((n) =>
            n.id === id ? { ...n, opened: true } : n,
          ),
        });
      },

      resetAll: () => {
        set({
          onboarded: false,
          myStars: [],
          otherUniverse: seedOtherUniverse(),
          cooldowns: {},
          notifications: [],
          customStars: [],
        });
      },
    }),
    {
      name: "byeolzari-state-v2",
      partialize: (s) => ({
        onboarded: s.onboarded,
        myStars: s.myStars,
        cooldowns: s.cooldowns,
        otherUniverse: s.otherUniverse,
        customStars: s.customStars,
      }),
      // hydrate 시 기존 손상 데이터 자동 복구 — 중복 제거 + 7개 cap
      onRehydrateStorage: () => (state) => {
        if (!state || !state.myStars) return;
        const seen = new Set<string>();
        const cleaned = state.myStars.filter((s) => {
          if (seen.has(s.starId)) return false;
          seen.add(s.starId);
          return true;
        }).slice(0, 7);
        if (cleaned.length !== state.myStars.length) {
          state.myStars = cleaned;
        }
      },
    },
  ),
);

function seedOtherUniverse(): OtherUniverseStar[] {
  const candidates: { starId: string; region: string | null }[] = [
    { starId: "butoh", region: null },
    { starId: "filmcam", region: null },
    { starId: "seongsushoes", region: "성수동" },
    { starId: "kindie", region: "대한민국" },
    { starId: "matgyup", region: "대한민국" },
    { starId: "calligraphy", region: null },
    { starId: "vinyl", region: null },
    { starId: "haiku", region: null },
    { starId: "shortform", region: null },
    { starId: "trail", region: null },
    { starId: "pottery", region: null },
    { starId: "noporo", region: "대한민국" },
  ];
  const now = Date.now();
  return candidates
    .filter((c) => STARS.some((s) => s.id === c.starId))
    .map((c, i) => ({
      starId: c.starId,
      encounterRegionLabel: c.region,
      addedAt: now - i * 60 * 1000,
    }));
}

export function getStarsForOtherUniverseDisplay(
  pool: OtherUniverseStar[],
  count = 7,
): OtherUniverseStar[] {
  if (pool.length <= count) return pool;
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

export function isStarKnown(myStars: ConstellationStar[], starId: string): boolean {
  return myStars.some((s) => s.starId === starId);
}

export function resolveStar(starId: string): Star | undefined {
  const fromStatic = STARS.find((s) => s.id === starId);
  if (fromStatic) return fromStatic;
  return useApp.getState().customStars.find((s) => s.id === starId);
}
