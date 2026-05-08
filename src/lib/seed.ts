import type { Category, Content, Star } from "./types";

export const CATEGORIES: Category[] = [
  { id: 1, name: "음악", emoji: "🎵", displayOrder: 1 },
  { id: 2, name: "시각예술", emoji: "🎨", displayOrder: 2 },
  { id: 3, name: "공예", emoji: "🪡", displayOrder: 3 },
  { id: 4, name: "공연", emoji: "🎭", displayOrder: 4 },
  { id: 5, name: "운동", emoji: "🏃", displayOrder: 5 },
  { id: 6, name: "요리", emoji: "🍳", displayOrder: 6 },
  { id: 7, name: "문학", emoji: "📚", displayOrder: 7 },
  { id: 8, name: "게임", emoji: "🎮", displayOrder: 8 },
  { id: 9, name: "자연", emoji: "🌿", displayOrder: 9 },
  { id: 10, name: "영상", emoji: "🎬", displayOrder: 10 },
  { id: 11, name: "사색·명상", emoji: "🧘", displayOrder: 11 },
  { id: 12, name: "디지털", emoji: "💻", displayOrder: 12 },
  { id: 13, name: "전통", emoji: "🏮", displayOrder: 13 },
  { id: 14, name: "패션", emoji: "👗", displayOrder: 14 },
  { id: 15, name: "뷰티", emoji: "💄", displayOrder: 15 },
  { id: 16, name: "기타", emoji: "✨", displayOrder: 16 },
];

const s = (
  id: string,
  tag: string,
  title: string,
  description: string,
  categoryId: number,
  scope: Star["scope"] = "global",
  regionLabel: string | null = null,
): Star => ({ id, tag, title, description, categoryId, scope, regionLabel });

export const STARS: Star[] = [
  s("jazz", "jazz", "재즈", "20세기 초 미국에서 태어난 즉흥의 음악", 1),
  s("kindie", "k_indie", "K-인디씬", "한국 인디 음악의 작은 우주", 1, "country", "대한민국"),
  s("butoh", "butoh", "부토 무용", "일본에서 시작된 어둠의 신체 표현", 4),
  s("sourdough", "sourdough", "사워도우", "야생 효모로 발효시킨 빵의 결", 6),
  s("filmcam", "film_camera", "필름카메라", "필름의 결과 기다림의 미학", 10),
  s("seongsushoes", "seongsu_handmade_shoes", "성수동 수제화", "성수동 골목의 가죽 냄새와 미싱 소리", 3, "neighborhood", "성수동"),
  s("hangang", "hangang_bike", "한강 자전거", "한강을 따라 흐르는 바람과 바퀴", 5, "city", "서울"),
  s("janggu", "janggu", "장구", "한국 전통 타악기의 양면 가락", 13, "country", "대한민국"),
  s("noporo", "old_eatery", "노포", "오래된 가게의 시간이 빚은 맛", 6, "country", "대한민국"),
  s("hongdaeindie", "hongdae_indie", "홍대 인디씬", "홍대 거리의 라이브 클럽 문화", 1, "neighborhood", "홍대"),
  s("eulpapers", "eulji_print", "을지로 인쇄소", "잉크 냄새가 배어든 을지로의 골목", 3, "neighborhood", "을지로"),
  s("teaceremony", "tea_ceremony", "전통차", "차 한 잔에 담긴 느림의 시간", 13, "country", "대한민국"),
  s("matgyup", "knot_craft", "매듭공예", "한 가닥 실로 그려내는 정중한 무늬", 3, "country", "대한민국"),
  s("zen", "zen_meditation", "선 명상", "호흡 하나로 우주를 마주하는 일", 11),
  s("calligraphy", "calligraphy", "캘리그라피", "글자에 깃든 마음의 결", 2),
  s("vinyl", "vinyl_record", "바이닐", "회전하는 검은 원판의 따뜻한 잡음", 1),
  s("pottery", "pottery", "도예", "흙이 손끝에서 모양을 찾아가는 시간", 3),
  s("trail", "trail_running", "트레일러닝", "흙길과 산비탈을 달리는 호흡", 5),
  s("shortform", "shortform_film", "단편영화", "10분 안에 한 우주를 담는 일", 10),
  s("haiku", "haiku", "하이쿠", "17음절에 담는 계절의 한 컷", 7),
];

const c = (
  id: string,
  starId: string,
  type: Content["type"],
  title: string,
  body: string,
  bgGradient: string,
  durationSec?: number,
): Content => ({ id, starId, type, title, body, bgGradient, durationSec });

const G = {
  amber: "from-amber-900 via-orange-800 to-rose-900",
  indigo: "from-indigo-900 via-purple-900 to-fuchsia-900",
  emerald: "from-emerald-900 via-teal-900 to-cyan-900",
  slate: "from-slate-900 via-zinc-900 to-neutral-900",
  rose: "from-rose-900 via-pink-900 to-purple-900",
  blue: "from-blue-900 via-indigo-900 to-violet-900",
};

export const CONTENTS: Content[] = [
  c("jazz_1", "jazz", "shortform", "Kind of Blue", "마일스 데이비스의 1959년. 그 5중주가 모달 재즈의 문을 열었다.", G.indigo, 28),
  c("jazz_2", "jazz", "cardnews", "재즈의 즉흥", "악보 없이 호흡으로 대화하는 음악. 같은 곡이 매번 다른 모양으로 태어난다.", G.amber),
  c("jazz_3", "jazz", "shortform", "스탠다드 재즈", "한 세기 동안 수만 번 다시 연주된 곡들이 있다.", G.slate, 32),

  c("butoh_1", "butoh", "cardnews", "어둠의 춤", "1959년 일본. 히지카타 타츠미가 시작한 신체의 반란.", G.slate),
  c("butoh_2", "butoh", "shortform", "흰 분장", "온몸을 흰 분으로 덮고, 천천히 무너져 내린다.", G.indigo, 35),
  c("butoh_3", "butoh", "cardnews", "느린 시간", "1분에 걸쳐 손가락 하나를 펴는 일. 그것이 전부일 수 있다.", G.rose),

  c("sourdough_1", "sourdough", "cardnews", "야생 효모", "공기 중의 효모가 밀가루 반죽 속에서 깨어난다. 시간만이 그 결을 만든다.", G.amber),
  c("sourdough_2", "sourdough", "shortform", "발효 24시간", "느린 발효가 만든 산미와 구멍.", G.amber, 22),
  c("sourdough_3", "sourdough", "cardnews", "스타터 키우기", "내 부엌에 사는 작은 생태계. 매일 먹이를 준다.", G.emerald),

  c("seongsushoes_1", "seongsushoes", "cardnews", "성수동 골목", "1960년대부터 시작된 수제화 장인들의 거리.", G.amber),
  c("seongsushoes_2", "seongsushoes", "shortform", "한 켤레의 시간", "평균 40시간이 걸린다. 가죽을 자르고, 박고, 광을 낸다.", G.slate, 30),
  c("seongsushoes_3", "seongsushoes", "cardnews", "장인의 손", "70년대부터 이 거리에서 신발을 만든 분들이 아직 있다.", G.rose),

  c("hangang_1", "hangang", "shortform", "노을의 한강", "여의도에서 잠실까지, 41km의 자전거 도로.", G.blue, 26),
  c("hangang_2", "hangang", "cardnews", "따릉이", "서울 어디서든 빌리고 어디서든 반납. 도시의 공유 자전거.", G.emerald),
  c("hangang_3", "hangang", "cardnews", "다리 위", "한강 다리 23개. 자전거로 건너볼 수 있는 다리는 그중 12개.", G.indigo),

  c("janggu_1", "janggu", "cardnews", "양면의 가락", "왼쪽은 낮고 둔하게, 오른쪽은 맑고 높게. 대화 같은 리듬.", G.amber),
  c("janggu_2", "janggu", "shortform", "사물놀이", "꽹과리·징·장구·북. 1978년에 태어난 새로운 전통.", G.rose, 33),
  c("janggu_3", "janggu", "cardnews", "굿거리장단", "9박 한 장단. 한국 음악의 가장 보편적인 호흡.", G.slate),

  c("filmcam_1", "filmcam", "cardnews", "36장의 제약", "한 롤에 36장. 모든 셔터가 가볍지 않다.", G.slate),
  c("filmcam_2", "filmcam", "shortform", "현상의 기다림", "찍고 일주일을 기다린다. 그것이 필름의 시간.", G.indigo, 24),
  c("filmcam_3", "filmcam", "cardnews", "그레인", "디지털이 흉내내지 못하는 입자의 결.", G.rose),

  c("kindie_1", "kindie", "shortform", "홍대의 밤", "검정치마, 새소년, 잔나비... 한국 인디의 작은 우주.", G.indigo, 29),
  c("kindie_2", "kindie", "cardnews", "라이브 클럽", "홍대 일대의 50여 개 라이브 클럽. 매일 다른 밴드가 선다.", G.rose),
  c("kindie_3", "kindie", "cardnews", "EP의 시대", "정규 앨범보다 작은, 4~6곡짜리 우주.", G.amber),

  c("noporo_1", "noporo", "cardnews", "30년 노포", "한 자리에서 30년 이상 영업한 가게. 서울에 약 200곳.", G.amber),
  c("noporo_2", "noporo", "shortform", "을지면옥", "1965년부터, 변하지 않는 평양냉면.", G.slate, 28),
  c("noporo_3", "noporo", "cardnews", "주인의 손맛", "메뉴가 단순할수록, 시간이 깊어질수록.", G.emerald),

  c("zen_1", "zen", "cardnews", "10분의 호흡", "들숨 4초, 멈춤 4초, 날숨 6초. 그 한 사이클.", G.indigo),
  c("zen_2", "zen", "shortform", "묵조선", "그저 앉아 있을 뿐. 그것이 전부인 명상.", G.slate, 36),
  c("zen_3", "zen", "cardnews", "백지", "마음을 비우는 일은, 마음에 무엇이 있는지 보는 일에서 시작된다.", G.blue),
];

export function getStar(id: string): Star | undefined {
  return STARS.find((s) => s.id === id);
}

export function getContentsByStar(starId: string): Content[] {
  return CONTENTS.filter((c) => c.starId === starId);
}

export function getStarsByCategory(categoryId: number): Star[] {
  return STARS.filter((s) => s.categoryId === categoryId);
}

export function searchStars(query: string): Star[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return STARS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.tag.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
}
