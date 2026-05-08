"use client";

import { AnimatePresence, motion } from "framer-motion";
import { resolveStar } from "@/lib/store";
import { CosmicBackdrop } from "./Cosmos";

interface Props {
  open: boolean;
  starId: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DropConfirm({ open, starId, onConfirm, onCancel }: Props) {
  const star = starId ? resolveStar(starId) : null;
  return (
    <AnimatePresence>
      {open && star && (
        <motion.div
          className="absolute inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <CosmicBackdrop density={0.5} variant="soft" />
          <div className="absolute inset-0 flex flex-col items-center justify-center safe-top safe-bottom px-7 text-center">
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="relative"
          >
            <p className="label-kr">별 흘려보내기</p>
            <p className="display-light text-[28px] mt-7">{star.title}</p>
            <p className="text-[14px] text-fg-dim font-light mt-3 tracking-tight">
              을(를) 흘려보낼까요?
            </p>
            <p className="label-kr-fine mt-9">7일 동안 다시 만날 수 없어요</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="relative w-full mt-12 space-y-3"
          >
            <button
              onClick={onConfirm}
              className="w-full bg-fg text-bg rounded-full py-4 text-[14px] font-medium tracking-tight active:scale-[0.98]"
            >
              흘려보내기
            </button>
            <button
              onClick={onCancel}
              className="w-full label-kr-bright py-2 active:text-fg transition"
            >
              돌아가기
            </button>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
