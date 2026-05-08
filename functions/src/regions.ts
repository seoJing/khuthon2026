/**
 * 시연용 단순화된 region 매핑.
 * 위경도 박스 → country/city/neighborhood. 실제로는 reverse geocoding API 사용.
 */

export interface RegionInfo {
  country: string;
  city: string | null;
  neighborhood: string | null;
}

const NEIGHBORHOODS: Array<{
  name: string; // "KR/Seoul/성수동"
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}> = [
  // 성수동
  {
    name: "KR/Seoul/성수동",
    swLat: 37.535,
    swLng: 127.045,
    neLat: 37.555,
    neLng: 127.07,
  },
  // 홍대
  {
    name: "KR/Seoul/홍대",
    swLat: 37.545,
    swLng: 126.918,
    neLat: 37.563,
    neLng: 126.94,
  },
  // 을지로
  {
    name: "KR/Seoul/을지로",
    swLat: 37.563,
    swLng: 126.985,
    neLat: 37.572,
    neLng: 127.0,
  },
  // 회기동 (경희대 서울캠퍼스 일대)
  {
    name: "KR/Seoul/회기동",
    swLat: 37.589,
    swLng: 127.043,
    neLat: 37.606,
    neLng: 127.062,
  },
  // 영통 (경희대 국제캠퍼스 일대 — 수원시 영통구)
  {
    name: "KR/Suwon/영통",
    swLat: 37.230,
    swLng: 127.062,
    neLat: 37.255,
    neLng: 127.092,
  },
];

const SEOUL_BOX = {
  swLat: 37.42,
  swLng: 126.76,
  neLat: 37.7,
  neLng: 127.18,
};

const KOREA_BOX = {
  swLat: 33,
  swLng: 124,
  neLat: 39,
  neLng: 132,
};

function inBox(
  lat: number,
  lng: number,
  box: { swLat: number; swLng: number; neLat: number; neLng: number },
): boolean {
  return lat >= box.swLat && lat <= box.neLat && lng >= box.swLng && lng <= box.neLng;
}

export function regionFor(lat: number, lng: number): RegionInfo {
  for (const n of NEIGHBORHOODS) {
    if (inBox(lat, lng, n)) {
      const parts = n.name.split("/");
      return {
        country: parts[0],
        city: parts[1] || null,
        neighborhood: parts[2] || null,
      };
    }
  }
  if (inBox(lat, lng, SEOUL_BOX)) {
    return { country: "KR", city: "대한민국", neighborhood: null };
  }
  if (inBox(lat, lng, KOREA_BOX)) {
    return { country: "KR", city: null, neighborhood: null };
  }
  return { country: "UNKNOWN", city: null, neighborhood: null };
}

export function regionMatches(
  starScope: "global" | "country" | "city" | "neighborhood",
  starRegionCode: string | null,
  encounter: RegionInfo,
): boolean {
  if (starScope === "global") return true;
  if (!starRegionCode) return false;
  const { country, city, neighborhood } = encounter;
  if (starScope === "country") return starRegionCode === country;
  if (starScope === "city") return starRegionCode === `${country}/${city}`;
  if (starScope === "neighborhood")
    return starRegionCode === `${country}/${city}/${neighborhood}`;
  return false;
}

export function regionLabelFor(
  starScope: "global" | "country" | "city" | "neighborhood",
  encounter: RegionInfo,
): string | null {
  if (starScope === "global") return null;
  if (starScope === "country") return encounter.country;
  if (starScope === "city") return encounter.city;
  if (starScope === "neighborhood") return encounter.neighborhood;
  return null;
}
