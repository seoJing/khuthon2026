function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashIds(ids: string[]): number {
  let h = 2166136261;
  for (const id of ids) {
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return Math.abs(h | 0) || 1;
}

export interface PlacedStar {
  starId: string;
  x: number;
  y: number;
  magnitude: number;
}

/**
 * Poisson-disc 기반 무작위 자연 배치.
 * 같은 starIds 입력 → 같은 결과 (deterministic).
 * margin: 화면 가장자리 여백
 * 별 개수에 따라 minDist 자동 조정
 */
export function placeConstellation(starIds: string[]): PlacedStar[] {
  const n = starIds.length;
  if (n === 0) return [];

  const seed = hashIds(starIds);
  const rng = mulberry32(seed);

  // 단일 별: 정중앙
  if (n === 1) {
    return [{ starId: starIds[0], x: 0.5, y: 0.5, magnitude: 1.1 }];
  }

  const margin = 0.16;
  const minDist =
    n <= 2 ? 0.42 : n <= 3 ? 0.32 : n <= 4 ? 0.27 : n <= 5 ? 0.22 : n <= 6 ? 0.19 : 0.17;

  const points: { x: number; y: number }[] = [];
  let attempts = 0;
  const maxAttempts = 5000;

  while (points.length < n && attempts < maxAttempts) {
    attempts++;
    const x = margin + rng() * (1 - margin * 2);
    const y = margin + rng() * (1 - margin * 2);
    let ok = true;
    for (const p of points) {
      if (Math.hypot(p.x - x, p.y - y) < minDist) {
        ok = false;
        break;
      }
    }
    if (ok) points.push({ x, y });
  }

  // 부족분은 완화된 거리로 채움
  let relaxed = minDist * 0.7;
  while (points.length < n) {
    const x = margin + rng() * (1 - margin * 2);
    const y = margin + rng() * (1 - margin * 2);
    let ok = true;
    for (const p of points) {
      if (Math.hypot(p.x - x, p.y - y) < relaxed) {
        ok = false;
        break;
      }
    }
    if (ok) points.push({ x, y });
    else relaxed *= 0.95;
    if (relaxed < 0.05) {
      points.push({ x, y });
    }
  }

  return starIds.map((id, i) => ({
    starId: id,
    x: points[i].x,
    y: points[i].y,
    // 밝기 가변 — 0.7 ~ 1.3, 한두 개는 더 밝게
    magnitude: 0.75 + rng() * 0.55,
  }));
}

/**
 * 최소 신장 트리 (Prim) — 가까운 별끼리만 연결.
 * 별자리는 모든 별을 잇지 않고, 자연스러운 가지 형태가 됨.
 */
export function mstEdges(points: { x: number; y: number }[]): [number, number][] {
  const n = points.length;
  if (n <= 1) return [];

  const inTree: boolean[] = new Array(n).fill(false);
  const minEdge: number[] = new Array(n).fill(Infinity);
  const fromIdx: number[] = new Array(n).fill(-1);
  minEdge[0] = 0;

  const edges: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    let u = -1;
    for (let v = 0; v < n; v++) {
      if (!inTree[v] && (u === -1 || minEdge[v] < minEdge[u])) u = v;
    }
    if (u === -1) break;
    inTree[u] = true;
    if (fromIdx[u] !== -1) edges.push([fromIdx[u], u]);
    for (let v = 0; v < n; v++) {
      if (!inTree[v]) {
        const d = Math.hypot(points[u].x - points[v].x, points[u].y - points[v].y);
        if (d < minEdge[v]) {
          minEdge[v] = d;
          fromIdx[v] = u;
        }
      }
    }
  }
  return edges;
}
