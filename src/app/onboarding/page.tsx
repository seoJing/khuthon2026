"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, STARS, getStarsByCategory, searchStars } from "@/lib/seed";
import type { Star } from "@/lib/types";
import { useApp } from "@/lib/store";
import { CosmicBackdrop } from "@/components/Cosmos";
import { StarPoint } from "@/components/StarPoint";
import { WarpOverlay } from "@/components/WarpOverlay";
import { createCustomStarRemote } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useApp((s) => s.completeOnboarding);

  const [step, setStep] = useState<"intro" | "pick" | "permission">("intro");
  const [selected, setSelected] = useState<string[]>([]);
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [warping, setWarping] = useState(false);

  // 우주 진입 — 워프 트랜지션 후 /home
  const enterUniverse = () => {
    if (warping) return;
    setWarping(true);
    window.setTimeout(() => router.replace("/home"), 750);
  };

  const searchResults = useMemo(() => searchStars(query), [query]);

  const toggleStar = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 7) return prev;
      return [...prev, id];
    });
  };

  const onComplete = () => {
    if (selected.length < 1) return;
    completeOnboarding(selected);
    setStep("permission");
  };

  if (step === "intro") {
    return (
      <>
        <IntroStep onNext={() => setStep("pick")} />
        <WarpOverlay active={warping} mode="in" />
      </>
    );
  }
  if (step === "permission") {
    return (
      <>
        <PermissionStep onDone={enterUniverse} />
        <WarpOverlay active={warping} mode="in" />
      </>
    );
  }

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop density={0.7} variant="soft" />
      <div className="absolute inset-0 flex flex-col safe-top safe-bottom">
      <header className="relative px-6 pt-2 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label-kr">별 고르기</p>
          <p className="label-kr-bright">
            <span className="text-fg font-normal">{selected.length}</span>{" "}
            <span className="text-fg-muted">/ 7</span>
          </p>
        </div>
        <p className="text-[13px] text-fg-dim body-soft">
          1개부터 7개까지, 당신을 보여줄 별을 골라주세요
        </p>
      </header>

      <div className="relative px-6 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색 — 재즈, 부토, 노포…"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[14px] placeholder:text-fg-muted focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition font-light tracking-tight"
        />
      </div>

      <main className="relative flex-1 overflow-y-auto no-scrollbar px-5 pb-36">
        {query.trim() ? (
          <SearchResults
            results={searchResults}
            selected={selected}
            onToggle={toggleStar}
            query={query}
            onCustomCreated={(starId) => {
              setSelected((prev) =>
                prev.includes(starId) || prev.length >= 7
                  ? prev
                  : [...prev, starId],
              );
              setQuery("");
            }}
          />
        ) : (
          <CategoryGrid
            openId={openCategoryId}
            onOpen={setOpenCategoryId}
            selected={selected}
            onToggle={toggleStar}
          />
        )}
      </main>

      <SelectedTray
        selected={selected}
        onRemove={(id) => setSelected((prev) => prev.filter((x) => x !== id))}
        onComplete={onComplete}
      />
      </div>
      <WarpOverlay active={warping} mode="in" />
    </div>
  );
}

function PermissionStep({ onDone }: { onDone: () => void }) {
  const [requesting, setRequesting] = useState(false);

  const requestAndRegisterPush = async () => {
    try {
      const { requestPushPermission } = await import("@/lib/messaging");
      const { ensureMe } = await import("@/lib/api");
      const token = await requestPushPermission();
      if (token) {
        await ensureMe({ fcmToken: token });
      }
    } catch (err) {
      console.warn("[push] register failed", err);
    }
  };

  const request = () => {
    if (requesting) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onDone();
      return;
    }
    setRequesting(true);
    // 위치 권한 → 즉시 푸시 권한 묶음 요청 (BR-19)
    navigator.geolocation.getCurrentPosition(
      async () => {
        await requestAndRegisterPush();
        onDone();
      },
      async () => {
        await requestAndRegisterPush();
        onDone();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop density={1.05} variant="deep" />
      <div className="absolute inset-0 flex flex-col items-center justify-between safe-top safe-bottom px-7">
      <div className="relative flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        >
          <div className="flex justify-center mb-7">
            <StarPoint size={6} intensity="medium" twinkle />
          </div>
          <p className="label-kr">스쳐가는 사람을 만나려면</p>
          <h1 className="display-light text-[26px] mt-5 leading-[1.45]">
            위치가 필요해요
          </h1>
          <div className="mt-7 mx-auto w-10 h-px bg-white/15" />
          <p className="mt-7 text-[13px] text-fg-dim body-soft max-w-[280px]">
            반경 100m 안으로 누군가 스쳐갔을 때만
            <br />
            서로의 별자리에서 모르는 별 하나가
            <br />
            다른 우주에 떨어져요.
          </p>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative w-full max-w-sm space-y-3 mb-2"
      >
        <button
          onClick={request}
          disabled={requesting}
          className="w-full bg-fg text-bg rounded-full py-4 text-[14px] font-medium tracking-tight active:scale-[0.98] disabled:opacity-50 transition"
        >
          {requesting ? "확인 중…" : "허용"}
        </button>
        <button
          onClick={onDone}
          className="w-full label-kr-bright py-2 active:text-fg transition"
        >
          나중에
        </button>
      </motion.div>
      </div>
    </div>
  );
}

function IntroStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="absolute inset-0">
      <CosmicBackdrop density={1.1} variant="deep" />
      <div className="absolute inset-0 flex flex-col items-center justify-between safe-top safe-bottom px-7">
      <div className="relative flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        >
          <div className="flex justify-center mb-7">
            <StarPoint size={6} intensity="medium" twinkle />
          </div>
          <h1 className="display-light text-[28px] leading-[1.45]">
            당신의 별자리를
            <br />
            만들어주세요
          </h1>
          <div className="mt-7 mx-auto w-10 h-px bg-white/15" />
          <p className="mt-7 text-[13px] text-fg-dim body-soft max-w-[260px]">
            최대 7개의 별로 시작합니다.
            <br />
            별 하나는 당신이 좋아하는
            <br />한 가지 문화예요.
          </p>
        </motion.div>
      </div>
      <motion.button
        onClick={onNext}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="relative w-full max-w-sm bg-fg text-bg rounded-full py-4 text-[14px] font-medium tracking-tight active:scale-[0.98] transition"
      >
        시작하기
      </motion.button>
      </div>
    </div>
  );
}

function CategoryGrid({
  openId,
  onOpen,
  selected,
  onToggle,
}: {
  openId: number | null;
  onOpen: (id: number | null) => void;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {CATEGORIES.map((cat) => {
        const stars = getStarsByCategory(cat.id);
        const isOpen = openId === cat.id;
        const selectedInCat = stars.filter((s) => selected.includes(s.id)).length;
        const empty = stars.length === 0;
        return (
          <div
            key={cat.id}
            className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-sm"
          >
            <button
              onClick={() => !empty && onOpen(isOpen ? null : cat.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 transition ${
                empty ? "opacity-40" : "active:bg-white/[0.04]"
              }`}
              disabled={empty}
            >
              <div className="flex items-center gap-3">
                <span className="text-[16px]">{cat.emoji}</span>
                <span className="text-[14px] font-light tracking-tight">
                  {cat.name}
                </span>
                {selectedInCat > 0 && (
                  <span className="label-kr text-accent ml-1">
                    +{selectedInCat}
                  </span>
                )}
              </div>
              <span className="label-kr">
                {empty ? "준비 중" : `${stars.length}개`}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && stars.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                    {stars.map((s) => (
                      <StarChip
                        key={s.id}
                        star={s}
                        active={selected.includes(s.id)}
                        onClick={() => onToggle(s.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function SearchResults({
  results,
  selected,
  onToggle,
  query,
  onCustomCreated,
}: {
  results: Star[];
  selected: string[];
  onToggle: (id: string) => void;
  query: string;
  onCustomCreated: (starId: string) => void;
}) {
  if (results.length === 0) {
    return (
      <CreateCustomStar query={query} onCreated={onCustomCreated} />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      {results.map((s) => (
        <StarChip
          key={s.id}
          star={s}
          active={selected.includes(s.id)}
          onClick={() => onToggle(s.id)}
        />
      ))}
    </div>
  );
}

function CreateCustomStar({
  query,
  onCreated,
}: {
  query: string;
  onCreated: (starId: string) => void;
}) {
  const addCustomStar = useApp((s) => s.addCustomStar);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(query);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    const t = title.trim();
    if (!t) {
      setError("제목을 입력해주세요");
      return;
    }
    if (!categoryId) {
      setError("카테고리를 골라주세요");
      return;
    }
    setSubmitting(true);
    try {
      const r = await createCustomStarRemote({ title: t, categoryId });
      // 클라 store 에도 추가 (resolveStar 가 lookup 가능)
      addCustomStar({
        id: r.starId,
        tag: t,
        title: t,
        description: "",
        categoryId,
        scope: "global",
        regionLabel: null,
        isUserCreated: true,
      });
      onCreated(r.starId);
      setOpen(false);
      setTitle("");
      setCategoryId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 text-center">
      <p className="label-kr">찾는 별이 없어요</p>
      <p className="mt-3 text-[13px] text-fg-dim font-light tracking-tight">
        {`"${query}"`} 가 없으면 직접 만들어요
      </p>

      {!open ? (
        <button
          onClick={() => {
            setTitle(query);
            setOpen(true);
          }}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-fg text-bg text-[13px] font-medium tracking-tight active:scale-[0.97] transition"
        >
          내 별 직접 만들기
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : (
        <div className="mt-6 mx-auto max-w-sm space-y-3 text-left">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="별 이름 (예: 사이클 트레이닝)"
            maxLength={40}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[14px] placeholder:text-fg-muted focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition font-light tracking-tight"
          />
          <div>
            <p className="label-kr-fine mb-2 px-1">카테고리</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`text-[12px] font-light tracking-tight px-2.5 py-1 rounded-full transition ${
                    categoryId === c.id
                      ? "bg-fg text-bg"
                      : "bg-white/[0.05] text-fg/85 active:bg-white/[0.08]"
                  }`}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-[11px] text-rose-300/85 font-light px-1">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 bg-fg text-bg rounded-full py-3 text-[13px] font-medium tracking-tight active:scale-[0.98] disabled:opacity-50 transition"
            >
              {submitting ? "만드는 중…" : "별 만들기"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="label-kr-bright px-3 py-3"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StarChip({
  star,
  active,
  onClick,
}: {
  star: Star;
  active: boolean;
  onClick: () => void;
}) {
  const warm = star.scope !== "global";
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl px-3.5 py-3 border transition ${
        active
          ? "bg-fg text-bg border-fg shadow-[0_0_24px_rgba(245,231,196,0.25)]"
          : "bg-white/[0.03] border-white/[0.07] text-fg active:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center gap-2">
        {active ? (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-bg" />
        ) : (
          <StarPoint size={5} warm={warm} intensity="soft" />
        )}
        <span
          className={`text-[13px] font-light truncate tracking-tight ${
            active ? "text-bg" : ""
          }`}
        >
          {star.title}
        </span>
      </div>
      {star.regionLabel && (
        <div
          className={`mt-1.5 text-[10px] font-light tracking-wide ${
            active ? "text-bg/60" : "text-fg-muted"
          }`}
        >
          {star.regionLabel}
        </div>
      )}
    </button>
  );
}

function SelectedTray({
  selected,
  onRemove,
  onComplete,
}: {
  selected: string[];
  onRemove: (id: string) => void;
  onComplete: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 safe-bottom px-5 pt-4 bg-gradient-to-t from-bg via-bg/96 to-transparent">
      {selected.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {selected.map((id) => {
            const star = STARS.find((s) => s.id === id);
            if (!star) return null;
            return (
              <button
                key={id}
                onClick={() => onRemove(id)}
                className="flex-shrink-0 bg-fg text-bg text-[12px] px-3 py-1.5 rounded-full font-light tracking-tight"
              >
                {star.title} <span className="opacity-50 ml-0.5">×</span>
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={onComplete}
        disabled={selected.length < 1}
        className={`w-full rounded-full py-4 text-[14px] font-medium tracking-tight transition ${
          selected.length < 1
            ? "bg-white/[0.06] text-white/35"
            : "bg-fg text-bg active:scale-[0.98] shadow-[0_0_32px_rgba(245,231,196,0.18)]"
        }`}
      >
        {selected.length < 1
          ? "최소 1개의 별을 골라주세요"
          : `${selected.length}개의 별로 시작하기`}
      </button>
    </div>
  );
}
