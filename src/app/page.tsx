"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { CosmicBackdrop } from "@/components/Cosmos";
import { StarPoint } from "@/components/StarPoint";

export default function SplashPage() {
  const router = useRouter();
  const onboarded = useApp((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      router.replace(onboarded ? "/home" : "/onboarding");
    }, 1900);
    return () => clearTimeout(t);
  }, [hydrated, onboarded, router]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <CosmicBackdrop density={1.2} variant="deep" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
        className="relative text-center"
      >
        <div className="flex justify-center mb-9">
          <StarPoint size={9} intensity="bright" twinkle />
        </div>
        <h1 className="display-light text-[36px]">별자리</h1>
        <p className="mt-9 text-[12px] text-fg-dim font-light leading-[2] max-w-[260px] mx-auto tracking-tight">
          스쳐가는 사람의,
          <br />
          모르는 문화를 만나다
        </p>
      </motion.div>
    </div>
  );
}
