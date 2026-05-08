export type StarScope = "global" | "country" | "city" | "neighborhood";

export type ContentType = "shortform" | "cardnews";

export interface Category {
  id: number;
  name: string;
  emoji: string;
  displayOrder: number;
}

export interface Star {
  id: string;
  tag: string;
  title: string;
  description: string;
  categoryId: number;
  scope: StarScope;
  regionLabel: string | null;
  isUserCreated?: boolean;
}

export interface Content {
  id: string;
  starId: string;
  type: ContentType;
  title: string;
  body: string;
  bgGradient: string;
  durationSec?: number;
}

export interface ConstellationStar {
  starId: string;
  addedAt: number;
}

export type SwipeContext = "mine" | "their" | "pool";
