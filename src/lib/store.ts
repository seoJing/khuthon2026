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

interface AppState {
  onboarded: boolean;
  myStars: ConstellationStar[];
  otherUniverse: OtherUniverseStar[];
  cooldowns: Record<string, number>;

  completeOnboarding: (starIds: string[]) => void;
  addStar: (
    starId: string,
  ) => { ok: true } | { ok: false; reason: "full"; current: ConstellationStar[] };
  forceAddStar: (starId: string, replaceTargetId: string) => void;
  dropStar: (starId: string) => { ok: boolean; reason?: "last" };

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

      completeOnboarding: (starIds) => {
        const ids = starIds.slice(0, 7);
        set({ onboarded: true, myStars: makeConstellation(ids) });
      },

      addStar: (starId) => {
        const { myStars } = get();
        if (myStars.some((s) => s.starId === starId)) return { ok: true };
        if (myStars.length >= 7) {
          return { ok: false, reason: "full", current: myStars };
        }
        set({
          myStars: makeConstellation([...myStars.map((s) => s.starId), starId]),
        });
        return { ok: true };
      },

      forceAddStar: (starId, replaceTargetId) => {
        const { myStars, cooldowns } = get();
        const filteredIds = myStars
          .filter((s) => s.starId !== replaceTargetId)
          .map((s) => s.starId);
        set({
          myStars: makeConstellation([...filteredIds, starId]),
          cooldowns: {
            ...cooldowns,
            [replaceTargetId]: Date.now() + COOLDOWN_MS,
          },
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

      resetAll: () => {
        set({
          onboarded: false,
          myStars: [],
          otherUniverse: seedOtherUniverse(),
          cooldowns: {},
        });
      },
    }),
    {
      name: "byeolzari-state-v2",
      partialize: (s) => ({
        onboarded: s.onboarded,
        myStars: s.myStars,
        cooldowns: s.cooldowns,
      }),
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
  return STARS.find((s) => s.id === starId);
}
