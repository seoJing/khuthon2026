/**
 * 사용자 로컬 timezone 기준 yyyymmdd 정수 (BR-03 자정 초기화의 핵심).
 */
export function dayKeyFor(timezone: string, ts: Date): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return parseInt(fmt.format(ts).replaceAll("-", ""), 10);
}
