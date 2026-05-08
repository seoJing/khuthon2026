"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { CosmicBackdrop } from "@/components/Cosmos";
import { seedCatalogRemote } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const resetAll = useApp((s) => s.resetAll);

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

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

      <main className="relative flex-1 mt-8 space-y-2.5 overflow-y-auto no-scrollbar">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="label-kr mb-2.5">버전</p>
          <p className="text-[14px] font-light tracking-tight">v0.1 · 프론트 + Firebase</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <p className="label-kr mb-2.5">관리자</p>
          <p className="text-[12px] text-fg-dim mb-3 body-soft">
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
