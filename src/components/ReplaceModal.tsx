"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { resolveStar, useApp } from "@/lib/store";
import { CosmicBackdrop } from "./Cosmos";
import { StarPoint } from "./StarPoint";

interface Props {
  open: boolean;
  newStarId: string | null;
  onCancel: () => void;
  onDone: () => void;
}

export function ReplaceModal({ open, newStarId, onCancel, onDone }: Props) {
  const myStars = useApp((s) => s.myStars);
  const forceAddStar = useApp((s) => s.forceAddStar);
  const [pendingDropId, setPendingDropId] = useState<string | null>(null);

  const newStar = newStarId ? resolveStar(newStarId) : null;
  const dropStar = pendingDropId ? resolveStar(pendingDropId) : null;

  return (
    <AnimatePresence>
      {open && newStar && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col safe-top safe-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <CosmicBackdrop density={0.4} variant="soft" />

          {!pendingDropId ? (
            <div className="relative flex-1 flex flex-col px-6 py-7">
              <p className="label-kr">별자리가 가득 찼어요</p>
              <h3 className="display-medium text-[20px] mt-4">
                어떤 별을 흘려보낼까요?
              </h3>
              <p className="text-[12px] text-fg-dim mt-3 font-light tracking-tight">
                새 별 · <span className="text-accent">{newStar.title}</span>
              </p>
              <div className="flex-1 mt-7 grid grid-cols-2 gap-2.5 overflow-y-auto no-scrollbar">
                {myStars.map((cs) => {
                  const meta = resolveStar(cs.starId);
                  if (!meta) return null;
                  const warm = meta.scope !== "global";
                  return (
                    <button
                      key={cs.starId}
                      onClick={() => setPendingDropId(cs.starId)}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-left active:scale-[0.97] transition"
                    >
                      <div className="flex items-center gap-2">
                        <StarPoint size={5} warm={warm} intensity="soft" />
                        <span className="text-[13px] font-light tracking-tight truncate">
                          {meta.title}
                        </span>
                      </div>
                      {meta.regionLabel && (
                        <p className="text-[10px] text-fg-muted mt-2 font-light tracking-wide">
                          {meta.regionLabel}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onCancel}
                className="mt-5 label-kr-bright py-3 active:text-fg transition"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="relative flex-1 flex flex-col items-center justify-center px-7 text-center">
              <p className="label-kr">별 흘려보내기</p>
              <p className="display-light text-[28px] mt-7">{dropStar?.title}</p>
              <p className="text-[14px] text-fg-dim font-light mt-3 tracking-tight">
                을(를) 흘려보낼까요?
              </p>
              <p className="label-kr-fine mt-9">7일 동안 다시 만날 수 없어요</p>
              <div className="w-full mt-12 space-y-3">
                <button
                  onClick={() => {
                    if (newStarId && pendingDropId) {
                      forceAddStar(newStarId, pendingDropId);
                    }
                    onDone();
                  }}
                  className="w-full bg-fg text-bg rounded-full py-4 text-[14px] font-medium tracking-tight active:scale-[0.98]"
                >
                  흘려보내기
                </button>
                <button
                  onClick={() => setPendingDropId(null)}
                  className="w-full label-kr-bright py-2 active:text-fg transition"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
