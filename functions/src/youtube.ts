import { defineSecret } from "firebase-functions/params";

export const YOUTUBE_API_KEY = defineSecret("YOUTUBE_API_KEY");

export interface YTVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbUrl: string;
  publishedAt: string;
}

export interface YTSearchResult {
  videos: YTVideo[];
  nextPageToken: string | null;
}

interface SearchItem {
  id: { kind: string; videoId?: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
}

interface SearchResponse {
  items: SearchItem[];
  nextPageToken?: string;
}

interface VideoItem {
  id: string;
  snippet: SearchItem["snippet"];
  status?: {
    uploadStatus?: string;
    privacyStatus?: string;
    embeddable?: boolean;
    madeForKids?: boolean;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
  };
  contentDetails?: {
    duration?: string;
    regionRestriction?: {
      allowed?: string[];
      blocked?: string[];
    };
  };
}

interface VideosResponse {
  items: VideoItem[];
}

const MIN_VIEW_COUNT = 100;
const MAX_DURATION_SEC = 90; // Shorts 70초 정책 + 약간 여유
const REGION = "KR";

function parseISODurationSeconds(s: string | undefined): number {
  if (!s) return 0;
  const m = s.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? "0", 10);
  const min = parseInt(m[2] ?? "0", 10);
  const sec = parseInt(m[3] ?? "0", 10);
  return h * 3600 + min * 60 + sec;
}

/**
 * 카테고리별 검색어 후미 — 문화 관련성 강화.
 * "재즈 shorts" 보다 "재즈 음악 shorts" 가 더 정확.
 */
const CATEGORY_HINT: Record<number, string> = {
  1: "음악", // 음악
  2: "작품", // 시각예술
  3: "만들기", // 공예
  4: "공연", // 공연
  5: "운동", // 운동
  6: "레시피", // 요리
  7: "낭독", // 문학
  8: "게임", // 게임
  9: "자연", // 자연
  10: "영화", // 영상
  11: "명상", // 사색·명상
  12: "디지털", // 디지털
  13: "전통", // 전통
  14: "패션", // 패션
  15: "뷰티", // 뷰티
  16: "", // 기타
};

export interface SearchInput {
  title: string;
  tag?: string;
  categoryId?: number;
  pageToken?: string;
}

/**
 * search.list 로 후보 → videos.list 로 status·stat·duration 확인 → 필터.
 *
 * 필터:
 *  - status.embeddable === true (사용자가 embed 막은 영상 제외)
 *  - status.privacyStatus === "public"
 *  - status.uploadStatus === "processed"
 *  - statistics.viewCount >= 100 (너무 마이너 제외)
 *  - duration <= 90s (Shorts 만)
 *  - regionRestriction.blocked 에 KR 없음
 *  - madeForKids === false 옵션 (선택)
 *
 * 쿼터: search 100u + videos 1u = 101u/req. 일 10000u → 99 req/day. 캐시 필수.
 */
export async function searchYouTubeShorts(
  input: SearchInput,
): Promise<YTSearchResult> {
  const hint = input.categoryId ? CATEGORY_HINT[input.categoryId] ?? "" : "";
  const queryParts = [input.title, hint, "shorts"].filter(Boolean);
  const query = queryParts.join(" ");

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoDuration", "short");
  searchUrl.searchParams.set("maxResults", "20");
  searchUrl.searchParams.set("safeSearch", "moderate");
  searchUrl.searchParams.set("relevanceLanguage", "ko");
  searchUrl.searchParams.set("regionCode", REGION);
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("key", YOUTUBE_API_KEY.value());
  if (input.pageToken) searchUrl.searchParams.set("pageToken", input.pageToken);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    const t = await searchRes.text();
    throw new Error(`YouTube search ${searchRes.status}: ${t.slice(0, 200)}`);
  }
  const searchData = (await searchRes.json()) as SearchResponse;
  const candidateIds = searchData.items
    .filter((it) => it.id?.videoId)
    .map((it) => it.id.videoId as string);

  if (candidateIds.length === 0) {
    return { videos: [], nextPageToken: searchData.nextPageToken ?? null };
  }

  // 2단계: videos.list 로 정확한 status·통계 확인
  const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailUrl.searchParams.set("part", "snippet,status,statistics,contentDetails");
  detailUrl.searchParams.set("id", candidateIds.join(","));
  detailUrl.searchParams.set("key", YOUTUBE_API_KEY.value());

  const detailRes = await fetch(detailUrl.toString());
  if (!detailRes.ok) {
    // 실패 시 검색 결과만으로 fallback (status 검사 X)
    const fallback = searchData.items
      .filter((it) => it.id?.videoId)
      .map((it) => {
        const t = it.snippet.thumbnails;
        return {
          id: it.id.videoId as string,
          title: it.snippet.title,
          channelTitle: it.snippet.channelTitle,
          thumbUrl: (t.high ?? t.medium ?? t.default)?.url ?? "",
          publishedAt: it.snippet.publishedAt,
        };
      });
    return { videos: fallback, nextPageToken: searchData.nextPageToken ?? null };
  }
  const detailData = (await detailRes.json()) as VideosResponse;

  const videos: YTVideo[] = [];
  for (const v of detailData.items) {
    if (v.status?.embeddable !== true) continue;
    if (v.status?.privacyStatus !== "public") continue;
    if (v.status?.uploadStatus && v.status.uploadStatus !== "processed") continue;
    const blocked = v.contentDetails?.regionRestriction?.blocked ?? [];
    if (blocked.includes(REGION)) continue;
    const allowed = v.contentDetails?.regionRestriction?.allowed;
    if (allowed && !allowed.includes(REGION)) continue;
    const views = parseInt(v.statistics?.viewCount ?? "0", 10);
    if (views < MIN_VIEW_COUNT) continue;
    const durSec = parseISODurationSeconds(v.contentDetails?.duration);
    if (durSec === 0 || durSec > MAX_DURATION_SEC) continue;

    const t = v.snippet.thumbnails;
    videos.push({
      id: v.id,
      title: v.snippet.title,
      channelTitle: v.snippet.channelTitle,
      thumbUrl: (t.high ?? t.medium ?? t.default)?.url ?? "",
      publishedAt: v.snippet.publishedAt,
    });
  }

  return { videos, nextPageToken: searchData.nextPageToken ?? null };
}
