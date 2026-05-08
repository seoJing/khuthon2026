"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirebaseApp } from "./firebase";

function fns() {
  return getFunctions(getFirebaseApp(), "asia-northeast3");
}

export async function ensureMe(payload: {
  timezone?: string;
  fcmToken?: string | null;
}): Promise<{ ok: true; uid: string }> {
  const fn = httpsCallable(fns(), "ensureMe");
  const r = await fn(payload);
  return r.data as { ok: true; uid: string };
}

export async function addStarRemote(payload: {
  starId: string;
  replaceTargetId?: string;
}): Promise<{ ok: true }> {
  const fn = httpsCallable(fns(), "addStarToConstellation");
  const r = await fn(payload);
  return r.data as { ok: true };
}

export async function dropStarRemote(payload: {
  starId: string;
}): Promise<{ ok: true }> {
  const fn = httpsCallable(fns(), "dropStarFromConstellation");
  const r = await fn(payload);
  return r.data as { ok: true };
}

export async function handlePingRemote(payload: {
  lat: number;
  lng: number;
}): Promise<{ ok: true; summary: { processed: number; viewerAdded: number; otherAdded: number } }> {
  const fn = httpsCallable(fns(), "handlePing");
  const r = await fn(payload);
  return r.data as { ok: true; summary: { processed: number; viewerAdded: number; otherAdded: number } };
}

export async function markNotificationOpenedRemote(payload: {
  notifId: string;
}): Promise<{ ok: true }> {
  const fn = httpsCallable(fns(), "markNotificationOpened");
  const r = await fn(payload);
  return r.data as { ok: true };
}

export interface EncounterStarMeta {
  id: string;
  tag: string;
  title: string;
  description: string;
  categoryId: number;
  scope: "global" | "country" | "city" | "neighborhood";
  regionLabel: string | null;
}

export async function getEncounterStarsRemote(payload: {
  notifId: string;
}): Promise<{
  stars: EncounterStarMeta[];
  encounterRegionLabel: string | null;
}> {
  const fn = httpsCallable(fns(), "getEncounterStars");
  const r = await fn(payload);
  return r.data as {
    stars: EncounterStarMeta[];
    encounterRegionLabel: string | null;
  };
}

export async function seedCatalogRemote(): Promise<{
  ok: true;
  counts: { categories: number; stars: number; contents: number };
}> {
  const fn = httpsCallable(fns(), "seedCatalog");
  const r = await fn({ confirm: "yes-i-am-sure" });
  return r.data as {
    ok: true;
    counts: { categories: number; stars: number; contents: number };
  };
}

export interface YTVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbUrl: string;
  publishedAt: string;
}

export async function getStarFeedRemote(payload: {
  starId: string;
  pageToken?: string;
}): Promise<{
  videos: YTVideo[];
  nextPageToken: string | null;
  cached: boolean;
}> {
  const fn = httpsCallable(fns(), "getStarFeed");
  const r = await fn(payload);
  return r.data as {
    videos: YTVideo[];
    nextPageToken: string | null;
    cached: boolean;
  };
}
