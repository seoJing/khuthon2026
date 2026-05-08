"use client";

import { Suspense } from "react";
import CardClient from "./CardClient";

export default function CardPage() {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-bg" />}>
      <CardClient />
    </Suspense>
  );
}
