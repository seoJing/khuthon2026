"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { getContentsByStar } from "@/lib/seed";
import { resolveStar, useApp } from "@/lib/store";
import { PongMoment } from "@/components/PongMoment";
import { ReplaceModal } from "@/components/ReplaceModal";
import { DropConfirm } from "@/components/DropConfirm";
import { CosmosLite } from "@/components/Cosmos";
import { StarPoint } from "@/components/StarPoint";
import type { Content, SwipeContext } from "@/lib/types";

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 400;
const LONG_PRESS_MS = 600;

const SCENE_BG: Record<string, string> = {
  "from-amber-900 via-orange-800 to-rose-900":
    "radial-gradient(60% 80% at 30% 20%, rgba(180, 70, 50, 0.55), transparent 60%), radial-gradient(70% 60% at 80% 80%, rgba(140, 50, 90, 0.5), transparent 70%), linear-gradient(180deg, #2a0e10 0%, #110308 100%)",
  "from-indigo-900 via-purple-900 to-fuchsia-900":
    "radial-gradient(55% 70% at 25% 25%, rgba(80, 40, 160, 0.55), transparent 60%), radial-gradient(70% 60% at 80% 80%, rgba(140, 40, 130, 0.4), transparent 70%), linear-gradient(180deg, #150a30 0%, #07041a 100%)",
  "from-emerald-900 via-teal-900 to-cyan-900":
    "radial-gradient(60% 70% at 30% 30%, rgba(20, 100, 110, 0.55), transparent 60%), radial-gradient(70% 60% at 80% 80%, rgba(20, 70, 130, 0.5), transparent 70%), linear-gradient(180deg, #03222a 0%, #050a16 100%)",
  "from-slate-900 via-zinc-900 to-neutral-900":
    "radial-gradient(60% 70% at 30% 30%, rgba(70, 70, 90, 0.4), transparent 60%), radial-gradient(70% 60% at 80% 80%, rgba(50, 60, 90, 0.35), transparent 70%), linear-gradient(180deg, #0d0f18 0%, #04050a 100%)",
  "from-rose-900 via-pink-900 to-purple-900":
    "radial-gradient(60% 70% at 30% 30%, rgba(170, 50, 90, 0.55), transparent 60%), radial-gradient(70% 60% at 80% 80%, rgba(110, 50, 130, 0.45), transparent 70%), linear-gradient(180deg, #240614 0%, #0a0414 100%)",
  "from-blue-900 via-indigo-900 to-violet-900":
    "radial-gradient(60% 70% at 30% 30%, rgba(40, 70, 160, 0.55), transparent 60%), radial-gradient(70% 60% at 80% 80%, rgba(80, 50, 160, 0.45), transparent 70%), linear-gradient(180deg, #060e2a 0%, #04061a 100%)",
};

function backgroundFor(content: Content) {
  return SCENE_BG[content.bgGradient] ?? SCENE_BG["from-slate-900 via-zinc-900 to-neutral-900"];
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
  const contents: Content[] = useMemo(
    () => getContentsByStar(currentStarId),
    [currentStarId],
  );
  const content = contents[contentIndex] ?? contents[0];

  const isMyStar = myStars.some((s) => s.starId === currentStarId);

  const [pong, setPong] = useState(false);
  const [compress, setCompress] = useState(false);
  const [replaceModal, setReplaceModal] = useState(false);
  const [dropConfirm, setDropConfirm] = useState(false);
  const [pendingNewStar, setPendingNewStar] = useState<string | null>(null);
  const [transition, setTransition] = useState<{
    dx: number;
    dy: number;
    key: string;
  }>({ dx: 0, dy: 0, key: `${currentStarId}-${contentIndex}` });

  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    setContentIndex(0);
  }, [currentStarId]);

  const goNextContent = () => {
    if (contents.length === 0) return;
    setTransition({
      dx: 0,
      dy: -1,
      key: `${currentStarId}-${(contentIndex + 1) % contents.length}`,
    });
    setContentIndex((i) => (i + 1) % contents.length);
  };
  const goPrevContent = () => {
    if (contents.length === 0) return;
    setTransition({
      dx: 0,
      dy: 1,
      key: `${currentStarId}-${(contentIndex - 1 + contents.length) % contents.length}`,
    });
    setContentIndex((i) => (i - 1 + contents.length) % contents.length);
  };
  const goNextStar = () => {
    if (starOrder.length <= 1) return;
    setTransition({ dx: -1, dy: 0, key: `${starOrder[(starIndex + 1) % starOrder.length]}` });
    setStarIndex((i) => (i + 1) % starOrder.length);
  };
  const goPrevStar = () => {
    if (starOrder.length <= 1) return;
    setTransition({
      dx: 1,
      dy: 0,
      key: `${starOrder[(starIndex - 1 + starOrder.length) % starOrder.length]}`,
    });
    setStarIndex((i) => (i - 1 + starOrder.length) % starOrder.length);
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
    longPressFired.current = false;
    cancelLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      triggerLongPress();
    }, LONG_PRESS_MS);
  };

  const triggerLongPress = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(200);
    }
    if (isMyStar) {
      setDropConfirm(true);
    } else {
      const result = addStar(currentStarId);
      if (!result.ok && result.reason === "full") {
        setPendingNewStar(currentStarId);
        setReplaceModal(true);
      } else {
        playPong();
      }
    }
  };

  const playPong = () => {
    setCompress(true);
    setPong(true);
    window.setTimeout(() => {
      setCompress(false);
      setPong(false);
      // 별 추가 후엔 같은 별이 아니라 다음 별로 이동 (자연스러운 흐름).
      // 단, 컨텍스트에 별이 1개뿐이면 같은 별 다음 콘텐츠로.
      if (starOrder.length > 1) {
        goNextStar();
      } else {
        goNextContent();
      }
    }, 500);
  };

  if (!star || !content) {
    return (
      <div className="absolute inset-0 flex items-center justify-center label-kr">
        콘텐츠를 불러올 수 없어요
      </div>
    );
  }

  const warm = star.scope !== "global";
  const bg = backgroundFor(content);

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
            x: transition.dx * 80,
            y: transition.dy * 80,
            scale: 0.97,
          }}
          animate={{
            opacity: compress ? 0.3 : 1,
            x: 0,
            y: 0,
            scale: compress ? 0.05 : 1,
          }}
          exit={{
            opacity: 0,
            x: -transition.dx * 80,
            y: -transition.dy * 80,
            scale: 0.97,
          }}
          transition={{
            duration: compress ? 0.2 : 0.45,
            ease: compress ? "easeIn" : [0.19, 1, 0.22, 1],
          }}
          className="absolute inset-0 flex flex-col safe-top safe-bottom touch-none"
          style={{ background: bg }}
        >
          <CosmosLite density={0.45} />
          <div aria-hidden className="absolute inset-0 grain pointer-events-none" />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
            style={{
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)",
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
              className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-95 transition text-white/85 text-[14px]"
              aria-label="닫기"
            >
              ✕
            </button>
          </header>

          <div className="relative flex-1 flex flex-col justify-end px-7 pb-14 z-10">
            <p
              className="text-[10px] font-light tracking-[0.05em] mb-3"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {content.type === "shortform" ? "숏폼 · 30초" : "카드뉴스"}
            </p>
            <h3 className="display-medium text-white text-[26px]">
              {content.title}
            </h3>
            <p className="mt-4 text-[14px] text-white/85 body-soft">
              {content.body}
            </p>

            <div className="mt-7 flex items-center gap-2">
              {contents.map((_, i) => (
                <span
                  key={i}
                  className="block h-[2px] rounded-full transition-all"
                  style={{
                    width: i === contentIndex ? 24 : 12,
                    background:
                      i === contentIndex
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.22)",
                  }}
                />
              ))}
            </div>
          </div>

          <FirstHintToast isMyStar={isMyStar} />
        </motion.div>
      </AnimatePresence>

      <PongMoment active={pong} />

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
            window.alert("당신의 우주에 마지막 별이에요. 새 별을 먼저 추가해주세요.");
          }
        }}
      />
    </div>
  );
}

function FirstHintToast({ isMyStar }: { isMyStar: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const key = "byeolzari.cardhint.shown";
    if (sessionStorage.getItem(key)) return;
    setVisible(true);
    sessionStorage.setItem(key, "1");
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-light tracking-wide z-10"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          꾹 눌러 {isMyStar ? "흘려보내기" : "별 추가하기"}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

