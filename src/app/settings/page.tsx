"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveStar, useApp } from "@/lib/store";
import { CosmicBackdrop } from "@/components/Cosmos";
import { seedCatalogRemote, injectFakeEncounterRemote } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const resetAll = useApp((s) => s.resetAll);
  const myStars = useApp((s) => s.myStars);
  const cooldowns = useApp((s) => s.cooldowns);
  const notifications = useApp((s) => s.notifications);

  const stats = useMemo(() => {
    const now = Date.now();
    const activeCooldowns = Object.entries(cooldowns).filter(
      ([, exp]) => exp > now,
    );
    const warmCount = myStars.filter((s) => {
      const meta = resolveStar(s.starId);
      return meta && meta.scope !== "global";
    }).length;
    const unread = notifications.filter((n) => !n.opened).length;
    return {
      myStarCount: myStars.length,
      warmCount,
      cooldownCount: activeCooldowns.length,
      cooldownStars: activeCooldowns.map(([id, exp]) => ({
        id,
        meta: resolveStar(id),
        daysLeft: Math.max(
          1,
          Math.ceil((exp - now) / (24 * 60 * 60 * 1000)),
        ),
      })),
      notifCount: notifications.length,
      unreadCount: unread,
    };
  }, [myStars, cooldowns, notifications]);

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [injecting, setInjecting] = useState(false);
  const [injectResult, setInjectResult] = useState<string | null>(null);

  const onSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const r = await seedCatalogRemote();
      setSeedResult(
        `카테고리 ${r.counts.categories} · 별 ${r.counts.stars} · 콘텐츠 ${r.counts.contents}`,
      );
    } catch (e) {
      setSeedResult(`실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSeeding(false);
    }
  };

  const onInjectEncounter = async (region: string) => {
    if (injecting) return;
    setInjecting(true);
    setInjectResult(null);
    try {
      const r = await injectFakeEncounterRemote({ region });
      setInjectResult(`${r.region} · ${r.addedCount}개 별 추가 — 홈 알림 확인`);
    } catch (e) {
      setInjectResult(`실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setInjecting(false);
    }
  };

  const onInjectAtMyLocation = async () => {
    if (injecting) return;
    setInjecting(true);
    setInjectResult(null);
    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setInjectResult("이 브라우저는 위치를 지원하지 않아요");
        setInjecting(false);
        return;
      }
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        }),
      );
      const r = await injectFakeEncounterRemote({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      setInjectResult(
        `${r.region} (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) · ${r.addedCount}개 별 — 홈 알림 확인`,
      );
    } catch (e) {
      setInjectResult(`실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop density={0.5} variant="soft" />
      <div className="absolute inset-0 safe-top safe-bottom px-6 flex flex-col">
      <header className="relative flex items-center justify-between py-3">
        <p className="label-kr">설정</p>
        <button
          onClick={() => router.back()}
          className="label-kr-bright active:text-fg transition"
        >
          닫기
        </button>
      </header>

      <main className="relative flex-1 mt-6 space-y-2.5 overflow-y-auto no-scrollbar pb-6">
        {/* 1. 내 우주의 기록 */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="label-kr mb-5">내 우주의 기록</p>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              value={stats.myStarCount}
              denom={7}
              label="별자리"
              sub={
                stats.warmCount > 0
                  ? `지역 ${stats.warmCount}`
                  : null
              }
            />
            <Stat
              value={stats.cooldownCount}
              label="떨군 별"
              sub={stats.cooldownCount > 0 ? "쿨다운 중" : null}
              dim={stats.cooldownCount === 0}
            />
            <Stat
              value={stats.notifCount}
              label="알림"
              sub={
                stats.unreadCount > 0 ? `안 본 ${stats.unreadCount}` : null
              }
              dim={stats.notifCount === 0}
            />
          </div>

          {stats.cooldownStars.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <p className="label-kr-fine mb-2.5">7일 동안 다시 만날 수 없는 별</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.cooldownStars.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: 10,
                      color: "rgba(243, 240, 234, 0.7)",
                      fontWeight: 300,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {c.meta?.title ?? c.id}
                    <span
                      style={{
                        color: "rgba(243, 240, 234, 0.4)",
                        fontSize: 9,
                      }}
                    >
                      D-{c.daysLeft}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. 시연 — 가상 스침 */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="label-kr mb-2.5">시연 — 가상 스침</p>
          <p className="text-[12px] text-fg-dim mt-2 mb-4 body-soft">
            다른 디바이스 없이 누가 스쳐간 상황을 만들어요. 홈에 알림이 뜸.
          </p>
          <div className="flex flex-wrap gap-2">
            {["성수동", "홍대", "을지로", "경희대", "서울"].map((r) => (
              <button
                key={r}
                onClick={() => onInjectEncounter(r)}
                disabled={injecting}
                className="text-[12px] font-light tracking-tight px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] active:scale-[0.97] transition disabled:opacity-50"
              >
                {r}
              </button>
            ))}
            <button
              onClick={onInjectAtMyLocation}
              disabled={injecting}
              className="text-[12px] font-light tracking-tight px-3 py-1.5 rounded-full bg-accent/14 border border-accent/30 text-accent active:scale-[0.97] transition disabled:opacity-50 flex items-center gap-1.5"
              style={{
                background: "rgba(245, 231, 196, 0.12)",
                borderColor: "rgba(245, 231, 196, 0.3)",
                color: "rgba(255, 240, 200, 0.95)",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 22s-7-7-7-13a7 7 0 0114 0c0 6-7 13-7 13z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="9"
                  r="2.4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
              내 위치
            </button>
          </div>
          {injectResult && (
            <p className="mt-3 text-[11px] text-fg-dim font-light tracking-tight">
              {injectResult}
            </p>
          )}
        </div>

        {/* 3. 관리자 (운영 전엔 숨김) */}
        <details className="bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <summary className="cursor-pointer px-5 py-4 list-none flex items-center justify-between">
            <p className="label-kr">관리자</p>
            <span className="label-kr-fine">▾</span>
          </summary>
          <div className="px-5 pb-5">
            <p className="text-[12px] text-fg-dim mt-1 mb-3 body-soft">
              카탈로그(카테고리·별·콘텐츠)를 Firestore에 주입. 첫 한 번만.
            </p>
            <button
              onClick={onSeed}
              disabled={seeding}
              className="text-[13px] text-accent active:scale-[0.98] font-light tracking-tight disabled:opacity-50"
            >
              {seeding ? "주입 중…" : "카탈로그 시드"}
            </button>
            {seedResult && (
              <p className="mt-3 text-[11px] text-fg-dim font-light tracking-tight">
                {seedResult}
              </p>
            )}
          </div>
        </details>

        {/* 4. 초기화 */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="label-kr mb-1.5">초기화</p>
          <p className="text-[12px] text-fg-dim mt-2 mb-4 body-soft">
            모든 별자리·알림·쿨다운을 지우고 온보딩부터 다시 시작해요.
          </p>
          <button
            onClick={() => {
              if (
                confirm(
                  "정말 모든 별자리를 초기화할까요?\n쿨다운·알림 기록도 모두 사라집니다.",
                )
              ) {
                resetAll();
                router.replace("/");
              }
            }}
            className="text-[13px] text-rose-300/90 active:scale-[0.98] font-light tracking-tight"
          >
            모두 지우기
          </button>
        </div>

        {/* 5. 버전 */}
        <div className="text-center pt-2 pb-4">
          <p className="label-kr-fine">별자리 · v0.1</p>
        </div>
      </main>
      </div>
    </div>
  );
}

function Stat({
  value,
  denom,
  label,
  sub,
  dim,
}: {
  value: number;
  denom?: number;
  label: string;
  sub?: string | null;
  dim?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        <p
          className="display-light text-[26px]"
          style={{
            color: dim ? "rgba(243,240,234,0.45)" : "rgba(243,240,234,0.96)",
          }}
        >
          {value}
        </p>
        {denom != null && (
          <p
            className="text-[12px] font-extralight"
            style={{ color: "rgba(243,240,234,0.4)" }}
          >
            / {denom}
          </p>
        )}
      </div>
      <p className="label-kr mt-1.5">{label}</p>
      {sub && <p className="label-kr-fine mt-0.5">{sub}</p>}
    </div>
  );
}
