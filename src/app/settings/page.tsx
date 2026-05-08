"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { CosmicBackdrop } from "@/components/Cosmos";

export default function SettingsPage() {
  const router = useRouter();
  const resetAll = useApp((s) => s.resetAll);

  return (
    <div className="absolute inset-0 safe-top safe-bottom px-6 flex flex-col">
      <CosmicBackdrop density={0.5} variant="soft" />

      <header className="relative flex items-center justify-between py-3">
        <p className="label-kr">설정</p>
        <button
          onClick={() => router.back()}
          className="label-kr-bright active:text-fg transition"
        >
          닫기
        </button>
      </header>

      <main className="relative flex-1 mt-8 space-y-2.5">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="label-kr mb-2.5">버전</p>
          <p className="text-[14px] font-light tracking-tight">v0.1 · 프론트 데모</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="label-kr mb-1.5">데모</p>
          <p className="text-[12px] text-fg-dim mt-2 mb-5 body-soft">
            온보딩부터 다시 시작하고 싶을 때
          </p>
          <button
            onClick={() => {
              if (confirm("정말 모든 별자리를 초기화할까요?")) {
                resetAll();
                router.replace("/");
              }
            }}
            className="text-[13px] text-rose-300/90 active:scale-[0.98] font-light tracking-tight"
          >
            초기화
          </button>
        </div>
      </main>
    </div>
  );
}
