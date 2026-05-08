"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { resolveStar, useApp } from "@/lib/store";
import { CATEGORIES } from "@/lib/seed";
import { ReplaceModal } from "@/components/ReplaceModal";
import { DropConfirm } from "@/components/DropConfirm";
import { CosmosLite } from "@/components/Cosmos";
import { StarPoint } from "@/components/StarPoint";
import { getStarFeedRemote, type YTVideo } from "@/lib/api";
import type { SwipeContext } from "@/lib/types";

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 400;
const LONG_PRESS_MS = 600;
const PREFETCH_BEFORE_END = 3;

interface FeedState {
  videos: YTVideo[];
  nextPageToken: string | null;
  loading: boolean;
  error: string | null;
}

export default function CardClient() {
  const router = useRouter();
  const params = useSearchParams();

  const ctxParam = (params.get("ctx") ?? "mine") as SwipeContext;
  const startStarId = params.get("starId") ?? "";

  const myStars = useApp((s) => s.myStars);
  const otherUniverse = useApp((s) => s.otherUniverse);
  const addStar = useApp((s) => s.addStar);
  const dropStar = useApp((s) => s.dropStar);

  const starOrder: string[] = useMemo(() => {
    if (ctxParam === "mine") return myStars.map((s) => s.starId);
    if (ctxParam === "pool") return otherUniverse.map((s) => s.starId);
    return [startStarId];
  }, [ctxParam, myStars, otherUniverse, startStarId]);

  const [starIndex, setStarIndex] = useState(() => {
    const i = starOrder.indexOf(startStarId);
    return i >= 0 ? i : 0;
  });
  const [contentIndex, setContentIndex] = useState(0);

  const currentStarId = starOrder[starIndex] ?? startStarId;
  const star = resolveStar(currentStarId);
  const isMyStar = myStars.some((s) => s.starId === currentStarId);

  // 별마다 별도 피드 상태 캐시
  const [feeds, setFeeds] = useState<Record<string, FeedState>>({});
  const currentFeed: FeedState | undefined = feeds[currentStarId];
  const currentVideo: YTVideo | undefined =
    currentFeed?.videos[contentIndex];

  const [compress, setCompress] = useState(false);
  const [flying, setFlying] = useState(false);
  const [replaceModal, setReplaceModal] = useState(false);
  const [dropConfirm, setDropConfirm] = useState(false);
  const [pendingNewStar, setPendingNewStar] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<{
    title: string;
    count: number;
  } | null>(null);
  const addedTimerRef = useRef<number | null>(null);
  const showToastTimerRef = useRef<number | null>(null);
  const [transition, setTransition] = useState<{
    dx: number;
    dy: number;
    key: string;
  }>({ dx: 0, dy: 0, key: `${currentStarId}-0` });

  const longPressTimer = useRef<number | null>(null);
  const fetchInflight = useRef<Set<string>>(new Set());

  // 피드 fetch (멱등; inflight 가드)
  const fetchFeed = useCallback(
    async (starId: string, pageToken?: string) => {
      const key = `${starId}|${pageToken ?? ""}`;
      if (fetchInflight.current.has(key)) return;
      fetchInflight.current.add(key);
      setFeeds((prev) => ({
        ...prev,
        [starId]: {
          videos: prev[starId]?.videos ?? [],
          nextPageToken: prev[starId]?.nextPageToken ?? null,
          loading: true,
          error: null,
        },
      }));
      try {
        const r = await getStarFeedRemote({ starId, pageToken });
        setFeeds((prev) => {
          const existing = prev[starId]?.videos ?? [];
          // dedup by id
          const seen = new Set(existing.map((v) => v.id));
          const merged = [...existing];
          for (const v of r.videos) {
            if (!seen.has(v.id)) merged.push(v);
          }
          return {
            ...prev,
            [starId]: {
              videos: merged,
              nextPageToken: r.nextPageToken,
              loading: false,
              error: null,
            },
          };
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setFeeds((prev) => ({
          ...prev,
          [starId]: {
            videos: prev[starId]?.videos ?? [],
            nextPageToken: prev[starId]?.nextPageToken ?? null,
            loading: false,
            error: msg,
          },
        }));
      } finally {
        fetchInflight.current.delete(key);
      }
    },
    [],
  );

  // 별 바뀔 때 첫 페이지 로드
  useEffect(() => {
    if (!currentStarId) return;
    setContentIndex(0);
    if (!feeds[currentStarId]) {
      fetchFeed(currentStarId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStarId]);

  // 끝 -3 도달 시 prefetch
  useEffect(() => {
    if (!currentFeed) return;
    const remaining = currentFeed.videos.length - contentIndex;
    if (
      remaining <= PREFETCH_BEFORE_END &&
      currentFeed.nextPageToken &&
      !currentFeed.loading
    ) {
      fetchFeed(currentStarId, currentFeed.nextPageToken);
    }
  }, [contentIndex, currentFeed, currentStarId, fetchFeed]);

  const goNextContent = () => {
    if (!currentFeed || currentFeed.videos.length === 0) return;
    const max = currentFeed.videos.length;
    if (contentIndex + 1 >= max) {
      // 끝 도달 — 마지막에서 멈춤. 추가 페이지 도착하면 자연스럽게 진행 가능
      return;
    }
    // 사용자가 위로 쓸어올리면(swipe up) 다음 콘텐츠 — 새 카드는 아래에서 올라오고, 옛 카드는 위로 사라짐
    setTransition({ dx: 0, dy: 1, key: `${currentStarId}-${contentIndex + 1}` });
    setContentIndex((i) => i + 1);
  };
  const goPrevContent = () => {
    if (contentIndex === 0) return;
    setTransition({ dx: 0, dy: -1, key: `${currentStarId}-${contentIndex - 1}` });
    setContentIndex((i) => i - 1);
  };
  const goNextStar = () => {
    if (starOrder.length <= 1) return;
    const next = (starIndex + 1) % starOrder.length;
    // 왼쪽으로 쓸어 다음 별 — 새 카드는 오른쪽에서 들어오고, 옛 카드는 왼쪽으로 사라짐
    setTransition({ dx: 1, dy: 0, key: `${starOrder[next]}-0` });
    setStarIndex(next);
  };
  const goPrevStar = () => {
    if (starOrder.length <= 1) return;
    const prev = (starIndex - 1 + starOrder.length) % starOrder.length;
    setTransition({ dx: -1, dy: 0, key: `${starOrder[prev]}-0` });
    setStarIndex(prev);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const ax = Math.abs(offset.x);
    const ay = Math.abs(offset.y);
    if (
      ax < SWIPE_THRESHOLD &&
      ay < SWIPE_THRESHOLD &&
      Math.abs(velocity.x) < VELOCITY_THRESHOLD &&
      Math.abs(velocity.y) < VELOCITY_THRESHOLD
    ) {
      return;
    }
    if (ax > ay) {
      if (offset.x < 0) goNextStar();
      else goPrevStar();
    } else {
      if (offset.y < 0) goNextContent();
      else goPrevContent();
    }
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onPointerDown = () => {
    cancelLongPress();
    longPressTimer.current = window.setTimeout(() => {
      triggerLongPress();
    }, LONG_PRESS_MS);
  };

  const triggerLongPress = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      // 패턴 햅틱: 짧은 강타 + 긴 진동 → 더 묵직한 감각
      navigator.vibrate([40, 40, 220]);
    }
    if (isMyStar) {
      setDropConfirm(true);
    } else {
      const result = addStar(currentStarId);
      if (!result.ok && result.reason === "full") {
        setPendingNewStar(currentStarId);
        setReplaceModal(true);
      } else {
        // 모션이 끝난 후 (2500ms 시점, 다음 별 화면에서) 토스트 등장
        const titleSnap = star?.title ?? "";
        const nextCount = Math.min(myStars.length + 1, 7);
        if (showToastTimerRef.current) {
          window.clearTimeout(showToastTimerRef.current);
          showToastTimerRef.current = null;
        }
        if (addedTimerRef.current) {
          window.clearTimeout(addedTimerRef.current);
          addedTimerRef.current = null;
        }
        showToastTimerRef.current = window.setTimeout(() => {
          setAddedToast({ title: titleSnap, count: nextCount });
          showToastTimerRef.current = null;
          addedTimerRef.current = window.setTimeout(() => {
            setAddedToast(null);
            addedTimerRef.current = null;
          }, 3500);
        }, 2500);
        playPong();
      }
    }
  };

  const playPong = () => {
    setCompress(true);
    // 카드가 한 점으로 천천히 압축된 직후 — 그 점이 별이 되어 모습을 드러냄
    window.setTimeout(() => {
      setFlying(true);
    }, 700);
    // 별이 충분히 천천히 위로 빠져나간 뒤 다음 별로 이동
    window.setTimeout(() => {
      setCompress(false);
      setFlying(false);
      if (starOrder.length > 1) goNextStar();
      else goNextContent();
    }, 2400);
  };

  if (!star) {
    return (
      <div className="absolute inset-0 flex items-center justify-center label-kr">
        별 정보를 불러올 수 없어요
      </div>
    );
  }

  const warm = star.scope !== "global";

  return (
    <div className="absolute inset-0 overflow-hidden bg-bg">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={transition.key}
          drag
          dragElastic={0.2}
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          onDragEnd={onDragEnd}
          onPointerDown={onPointerDown}
          onPointerUp={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onPointerLeave={cancelLongPress}
          initial={{
            opacity: 0,
            x: transition.dx * 100,
            y: transition.dy * 100,
            scale: 1,
            rotate: 0,
          }}
          animate={
            compress
              ? {
                  // 천천히 한 점으로 빨려들어가는 압축 — 휘청은 미세하게
                  opacity: [1, 0.96, 0.7, 0.32, 0],
                  x: [0, -3, 4, -1.5, 0],
                  y: [0, 1, 0, -1, -2],
                  rotate: [0, -1.2, 1.5, -0.6, 0],
                  scale: [1, 0.85, 0.48, 0.16, 0],
                }
              : { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }
          }
          exit={{
            opacity: 0,
            x: -transition.dx * 100,
            y: -transition.dy * 100,
            scale: 1,
          }}
          transition={
            compress
              ? {
                  duration: 0.7,
                  times: [0, 0.22, 0.5, 0.8, 1],
                  // ease-in: 시작은 천천히, 마지막에 가속하며 한 점으로 빨려들어감
                  ease: [0.42, 0, 0.95, 0.8],
                }
              : {
                  // TikTok 스타일 빠르고 자연스러운 카드 전환
                  duration: 0.32,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
          className="absolute inset-0 flex flex-col safe-top safe-bottom touch-none bg-black"
        >
          {/* 영상 본체 — 9:16 비율로 가운데 fit, 위아래 잘리는 부분은 cinema crop */}
          {currentVideo ? (
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black">
              <div
                className="relative bg-black"
                style={{
                  width: "100%",
                  aspectRatio: "9 / 16",
                  maxHeight: "none",
                }}
              >
                <iframe
                  key={currentVideo.id}
                  src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${currentVideo.id}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen={false}
                  referrerPolicy="origin"
                  frameBorder={0}
                />
              </div>
            </div>
          ) : (
            <FeedFallback
              loading={currentFeed?.loading ?? true}
              error={currentFeed?.error ?? null}
            />
          )}

          {/* 위/아래 vignette */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
            }}
          />

          <header className="relative flex items-start justify-between px-6 pt-3 z-10">
            <div className="flex items-start gap-2.5">
              <div className="mt-1.5">
                <StarPoint size={5} warm={warm} intensity="medium" twinkle />
              </div>
              <div>
                <p
                  className="text-[13px] font-light tracking-tight"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                >
                  {star.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {ctxParam === "mine" && (
                    <span
                      className="text-[10px] font-light tracking-wide"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      내 별
                    </span>
                  )}
                  {ctxParam === "mine" && star.regionLabel && (
                    <span
                      className="block w-0.5 h-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.3)" }}
                    />
                  )}
                  {star.regionLabel && (
                    <span
                      className="text-[10px] font-light tracking-wide"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {star.regionLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full glass active:scale-95 transition text-white/85 text-[14px]"
              aria-label="닫기"
            >
              ✕
            </button>
          </header>

          {currentVideo && (
            <div className="relative flex-1 flex flex-col justify-end px-7 pb-14 z-10 pointer-events-none">
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const cat = CATEGORIES.find((c) => c.id === star.categoryId);
                  return cat ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "rgba(255, 255, 255, 0.85)",
                        fontSize: 10,
                        letterSpacing: "-0.01em",
                        fontWeight: 300,
                      }}
                    >
                      <span style={{ fontSize: 11 }}>{cat.emoji}</span>
                      {cat.name}
                    </span>
                  ) : null;
                })()}
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: 10,
                    letterSpacing: "0.04em",
                    fontWeight: 300,
                  }}
                >
                  숏폼
                </span>
                {ctxParam === "mine" && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window === "undefined") return;
                      const q = encodeURIComponent(star.title);
                      window.open(
                        `https://www.google.com/search?q=${q}`,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full pointer-events-auto active:scale-[0.97] transition"
                    style={{
                      background: "rgba(245, 231, 196, 0.14)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "rgba(255, 240, 200, 0.95)",
                      fontSize: 10,
                      letterSpacing: "-0.01em",
                      fontWeight: 400,
                      border: "1px solid rgba(245, 231, 196, 0.22)",
                    }}
                    aria-label={`${star.title} 더 알아보기`}
                  >
                    더 알아보기
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ marginLeft: 1 }}
                      aria-hidden
                    >
                      <path
                        d="M7 17L17 7M9 7h8v8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <h3
                className="text-white text-[18px] font-light tracking-tight leading-snug"
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  overflow: "hidden",
                }}
              >
                {currentVideo.title}
              </h3>
              <p
                className="mt-2 text-[11px] font-light tracking-tight"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {currentVideo.channelTitle}
              </p>
            </div>
          )}

          <FirstHintToast isMyStar={isMyStar} />
        </motion.div>
      </AnimatePresence>

      <CompressionGlow active={compress} />
      <ShootingStar active={flying} />

      <ConstellationToast toast={addedToast} />

      <ReplaceModal
        open={replaceModal}
        newStarId={pendingNewStar}
        onCancel={() => {
          setReplaceModal(false);
          setPendingNewStar(null);
        }}
        onDone={() => {
          setReplaceModal(false);
          setPendingNewStar(null);
          playPong();
        }}
      />

      <DropConfirm
        open={dropConfirm}
        starId={currentStarId}
        onCancel={() => setDropConfirm(false)}
        onConfirm={() => {
          const r = dropStar(currentStarId);
          setDropConfirm(false);
          if (r.ok) {
            router.replace("/home");
          } else {
            window.alert(
              "당신의 우주에 마지막 별이에요. 새 별을 먼저 추가해주세요.",
            );
          }
        }}
      />
    </div>
  );
}

function FeedFallback({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="absolute inset-0 bg-bg">
      <div className="absolute inset-0">
        <CosmosLite density={0.4} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none">
        <div className="text-center">
          {loading ? (
            <p className="label-kr">별을 띄우는 중…</p>
          ) : error ? (
            <>
              <p className="label-kr text-rose-300/80">불러올 수 없어요</p>
              <p className="mt-2 text-[10px] text-fg-muted font-light max-w-[260px] mx-auto">
                {error}
              </p>
            </>
          ) : (
            <p className="label-kr">콘텐츠가 없어요</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 압축 glow — 카드가 작아지는 동안 그 중심에서 빛이 한 점으로 응축되는 효과.
 * 별의 중력 붕괴 직전: 외부로 폭발하지 않고, 안쪽으로 빛이 모임.
 *
 * 시퀀스 (총 0.85s, 카드 압축과 동시 진행):
 *   0~30%   거의 안 보임 (응축 시작)
 *   30~60%  점점 밝아짐, 살짝 작아짐 (집중)
 *   60~82%  최대 밝기, 완전한 작은 점이 됨
 *   82~100% 빠르게 옅어짐 — 곧 ShootingStar로 바통 터치
 */
function CompressionGlow({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="compress-glow"
          className="absolute z-30 pointer-events-none rounded-full"
          style={{
            top: "50%",
            left: "50%",
            translate: "-50% -50%",
            width: 110,
            height: 110,
            background:
              "radial-gradient(circle, rgba(255,250,225,1) 0%, rgba(255,220,170,0.55) 16%, rgba(255,195,135,0.18) 45%, transparent 100%)",
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0.25, 0.65, 1, 0],
            scale: [0.4, 0.55, 0.75, 0.55, 0.35],
          }}
          transition={{
            duration: 0.85,
            times: [0, 0.3, 0.6, 0.82, 1],
            ease: [0.42, 0, 0.95, 0.8],
          }}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * 카드가 한 점으로 압축된 자리에 별이 모습을 드러내고,
 * 천천히 숨을 한 번 쉬고 → 부드럽게 위로 떠올라 빠져나감.
 *
 * 시퀀스 (총 1.7s):
 *   0~10%   별이 0 → 0.5 사이즈로 등장 (응집된 빛)
 *   10~22%  살짝 부풀어 1.4까지 (별이 깨어나는 한 호흡)
 *   22~32%  본래 크기 1.0으로 정착
 *   32~75%  서서히 위로 (y 0 → -350), 천천히 옅어짐
 *   75~100% 위로 더 멀어지며 사라짐 (y -350 → -780, opacity 0)
 */
function ShootingStar({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="shootstar"
          className="absolute z-40 pointer-events-none"
          style={{ top: "50%", left: "50%", width: 0, height: 0 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            // 등장 → 한 호흡 → 좌우로 흔들리며 천천히 위로 떠오름
            opacity: [0, 1, 1, 1, 1, 1, 1, 0.85, 0.5, 0],
            scale: [0, 0.55, 1.4, 1, 1, 1, 1, 1, 0.85, 0.6],
            y: [0, 0, 0, 0, -40, -130, -260, -430, -620, -820],
            x: [0, 0, 0, 0, 14, -16, 13, -11, 7, 0],
          }}
          transition={{
            duration: 1.7,
            times: [0, 0.08, 0.2, 0.32, 0.42, 0.55, 0.7, 0.83, 0.93, 1],
            ease: "easeInOut",
          }}
        >
          {/* 빛나는 별 — wrapper 정중앙 */}
          <div
            className="absolute"
            style={{
              top: -5,
              left: -5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "rgb(255, 250, 230)",
              boxShadow:
                "0 0 18px rgba(255,240,200,1), 0 0 42px rgba(255,210,150,0.72), 0 0 88px rgba(245,180,100,0.42), 0 0 160px rgba(245,180,100,0.18)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 사용법 hint — 한 줄 글래스 chip으로 또렷하게.
 * 위치: 화면 상단 헤더 바로 아래 가운데 — 콘텐츠(영상·하단 메타) 안 가림.
 * 1.2s 후 등장 → 5s 노출 → 부드럽게 페이드 아웃.
 * 첫 사용자 상호작용(swipe/tap/longpress) 시 즉시 dismiss + 세션 동안 다시 안 보임.
 */
function FirstHintToast({ isMyStar }: { isMyStar: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const key = "byeolzari.cardhint.shown";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const showTimer = window.setTimeout(() => setVisible(true), 1200);
    const hideTimer = window.setTimeout(() => setVisible(false), 6200);

    const dismiss = () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      setVisible(false);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("touchstart", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
    window.addEventListener("pointerdown", dismiss, { once: true });
    window.addEventListener("touchstart", dismiss, { once: true });
    window.addEventListener("keydown", dismiss, { once: true });

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("touchstart", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="absolute top-16 left-0 right-0 z-20 flex justify-center pointer-events-none px-6"
        >
          <div
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full"
            style={{
              background: "rgba(15, 12, 25, 0.65)",
              backdropFilter: "blur(18px) saturate(140%)",
              WebkitBackdropFilter: "blur(18px) saturate(140%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <HintItem icon="↑" label="다음" />
            <HintDot />
            <HintItem icon="←→" label="다른 별" />
            <HintDot />
            <HintItem
              icon="꾹"
              label={isMyStar ? "흘려보내기" : "추가"}
              accent
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HintItem({
  icon,
  label,
  accent = false,
}: {
  icon: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        style={{
          fontSize: 11,
          color: accent
            ? "rgba(245, 231, 196, 0.95)"
            : "rgba(255, 255, 255, 0.85)",
          fontWeight: 300,
          letterSpacing: "-0.01em",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 10,
          color: accent
            ? "rgba(245, 231, 196, 0.85)"
            : "rgba(255, 255, 255, 0.7)",
          fontWeight: 300,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
    </span>
  );
}

function HintDot() {
  return (
    <span
      style={{
        width: 2,
        height: 2,
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.25)",
      }}
    />
  );
}

/**
 * 별자리 추가 피드백 토스트.
 * 글래스 카드 + 별 아이콘 + 별 이름 + 카운트.
 * 화면 하단 위쪽에 떠올랐다가 페이드 아웃.
 */
function ConstellationToast({
  toast,
}: {
  toast: { title: string; count: number } | null;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={`toast-${toast.title}-${toast.count}`}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
          className="absolute bottom-24 left-0 right-0 flex justify-center z-50 pointer-events-none px-6"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: "rgba(15, 12, 25, 0.78)",
              backdropFilter: "blur(20px) saturate(140%)",
              WebkitBackdropFilter: "blur(20px) saturate(140%)",
              border: "1px solid rgba(245, 231, 196, 0.18)",
              boxShadow:
                "0 0 28px rgba(245, 231, 196, 0.18), 0 4px 18px rgba(0, 0, 0, 0.4)",
            }}
          >
            <motion.span
              className="relative inline-block"
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1], delay: 0.05 }}
              aria-hidden
            >
              <span
                className="block rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: "rgb(248, 246, 232)",
                  boxShadow:
                    "0 0 10px rgba(255, 235, 180, 0.95), 0 0 22px rgba(255, 200, 130, 0.55), 0 0 40px rgba(245, 180, 100, 0.3)",
                }}
              />
            </motion.span>
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 300,
                  color: "rgba(243, 240, 234, 0.96)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                }}
              >
                {toast.title}
              </p>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 300,
                  color: "rgba(243, 240, 234, 0.55)",
                  letterSpacing: "0.04em",
                  marginTop: 3,
                }}
              >
                별자리에 들어왔어요 · {toast.count} / 7
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
