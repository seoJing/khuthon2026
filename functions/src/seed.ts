/**
 * 카탈로그 시드 데이터 — Firestore에 한 번 주입.
 * 클라 src/lib/seed.ts 와 형식 일치 (string id, scope, regionLabel).
 * regionCode는 매칭 파이프라인용 정규화된 값.
 */

export interface CategoryDoc {
  id: number;
  name: string;
  emoji: string;
  displayOrder: number;
}

export interface StarDoc {
  id: string;
  tag: string;
  title: string;
  description: string;
  categoryId: number;
  scope: "global" | "country" | "city" | "neighborhood";
  regionCode: string | null;
  regionLabel: string | null;
  isUserCreated: boolean;
  createdBy: string | null;
}

export interface ContentDoc {
  id: string;
  starId: string;
  type: "shortform" | "cardnews";
  title: string;
  body: string;
  bgGradient: string;
  durationSec?: number;
  displayOrder: number;
}

export const CATEGORIES: CategoryDoc[] = [
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

const star = (
  id: string,
  tag: string,
  title: string,
  description: string,
  categoryId: number,
  scope: StarDoc["scope"] = "global",
  regionCode: string | null = null,
  regionLabel: string | null = null,
): StarDoc => ({
  id,
  tag,
  title,
  description,
  categoryId,
  scope,
  regionCode,
  regionLabel,
  isUserCreated: false,
  createdBy: null,
});

export const STARS: StarDoc[] = [
  star("jazz", "jazz", "재즈", "20세기 초 미국에서 태어난 즉흥의 음악", 1),
  star(
    "kindie",
    "k_indie",
    "K-인디씬",
    "한국 인디 음악의 작은 우주",
    1,
    "country",
    "KR",
    "대한민국",
  ),
  star("butoh", "butoh", "부토 무용", "일본에서 시작된 어둠의 신체 표현", 4),
  star("sourdough", "sourdough", "사워도우", "야생 효모로 발효시킨 빵의 결", 6),
  star("filmcam", "film_camera", "필름카메라", "필름의 결과 기다림의 미학", 10),
  star(
    "seongsushoes",
    "seongsu_handmade_shoes",
    "성수동 수제화",
    "성수동 골목의 가죽 냄새와 미싱 소리",
    3,
    "neighborhood",
    "KR/Seoul/성수동",
    "성수동",
  ),
  star(
    "hangang",
    "hangang_bike",
    "한강 자전거",
    "한강을 따라 흐르는 바람과 바퀴",
    5,
    "city",
    "KR/Seoul",
    "서울",
  ),
  star(
    "janggu",
    "janggu",
    "장구",
    "한국 전통 타악기의 양면 가락",
    13,
    "country",
    "KR",
    "대한민국",
  ),
  star(
    "noporo",
    "old_eatery",
    "노포",
    "오래된 가게의 시간이 빚은 맛",
    6,
    "country",
    "KR",
    "대한민국",
  ),
  star(
    "hongdaeindie",
    "hongdae_indie",
    "홍대 인디씬",
    "홍대 거리의 라이브 클럽 문화",
    1,
    "neighborhood",
    "KR/Seoul/홍대",
    "홍대",
  ),
  star(
    "eulpapers",
    "eulji_print",
    "을지로 인쇄소",
    "잉크 냄새가 배어든 을지로의 골목",
    3,
    "neighborhood",
    "KR/Seoul/을지로",
    "을지로",
  ),
  star(
    "teaceremony",
    "tea_ceremony",
    "전통차",
    "차 한 잔에 담긴 느림의 시간",
    13,
    "country",
    "KR",
    "대한민국",
  ),
  star(
    "matgyup",
    "knot_craft",
    "매듭공예",
    "한 가닥 실로 그려내는 정중한 무늬",
    3,
    "country",
    "KR",
    "대한민국",
  ),
  star("zen", "zen_meditation", "선 명상", "호흡 하나로 우주를 마주하는 일", 11),
  star("calligraphy", "calligraphy", "캘리그라피", "글자에 깃든 마음의 결", 2),
  star("vinyl", "vinyl_record", "바이닐", "회전하는 검은 원판의 따뜻한 잡음", 1),
  star("pottery", "pottery", "도예", "흙이 손끝에서 모양을 찾아가는 시간", 3),
  star("trail", "trail_running", "트레일러닝", "흙길과 산비탈을 달리는 호흡", 5),
  star("shortform", "shortform_film", "단편영화", "10분 안에 한 우주를 담는 일", 10),
  star("haiku", "haiku", "하이쿠", "17음절에 담는 계절의 한 컷", 7),
];

const c = (
  id: string,
  starId: string,
  type: ContentDoc["type"],
  title: string,
  body: string,
  bgGradient: string,
  displayOrder: number,
  durationSec?: number,
): ContentDoc => ({
  id,
  starId,
  type,
  title,
  body,
  bgGradient,
  displayOrder,
  durationSec,
});

const G = {
  amber: "from-amber-900 via-orange-800 to-rose-900",
  indigo: "from-indigo-900 via-purple-900 to-fuchsia-900",
  emerald: "from-emerald-900 via-teal-900 to-cyan-900",
  slate: "from-slate-900 via-zinc-900 to-neutral-900",
  rose: "from-rose-900 via-pink-900 to-purple-900",
  blue: "from-blue-900 via-indigo-900 to-violet-900",
};

export const CONTENTS: ContentDoc[] = [
  c("jazz_1", "jazz", "shortform", "Kind of Blue", "마일스 데이비스의 1959년. 그 5중주가 모달 재즈의 문을 열었다.", G.indigo, 1, 28),
  c("jazz_2", "jazz", "cardnews", "재즈의 즉흥", "악보 없이 호흡으로 대화하는 음악. 같은 곡이 매번 다른 모양으로 태어난다.", G.amber, 2),
  c("jazz_3", "jazz", "shortform", "스탠다드 재즈", "한 세기 동안 수만 번 다시 연주된 곡들이 있다.", G.slate, 3, 32),

  c("butoh_1", "butoh", "cardnews", "어둠의 춤", "1959년 일본. 히지카타 타츠미가 시작한 신체의 반란.", G.slate, 1),
  c("butoh_2", "butoh", "shortform", "흰 분장", "온몸을 흰 분으로 덮고, 천천히 무너져 내린다.", G.indigo, 2, 35),
  c("butoh_3", "butoh", "cardnews", "느린 시간", "1분에 걸쳐 손가락 하나를 펴는 일. 그것이 전부일 수 있다.", G.rose, 3),

  c("sourdough_1", "sourdough", "cardnews", "야생 효모", "공기 중의 효모가 밀가루 반죽 속에서 깨어난다. 시간만이 그 결을 만든다.", G.amber, 1),
  c("sourdough_2", "sourdough", "shortform", "발효 24시간", "느린 발효가 만든 산미와 구멍.", G.amber, 2, 22),
  c("sourdough_3", "sourdough", "cardnews", "스타터 키우기", "내 부엌에 사는 작은 생태계. 매일 먹이를 준다.", G.emerald, 3),

  c("seongsushoes_1", "seongsushoes", "cardnews", "성수동 골목", "1960년대부터 시작된 수제화 장인들의 거리.", G.amber, 1),
  c("seongsushoes_2", "seongsushoes", "shortform", "한 켤레의 시간", "평균 40시간이 걸린다. 가죽을 자르고, 박고, 광을 낸다.", G.slate, 2, 30),
  c("seongsushoes_3", "seongsushoes", "cardnews", "장인의 손", "70년대부터 이 거리에서 신발을 만든 분들이 아직 있다.", G.rose, 3),

  c("hangang_1", "hangang", "shortform", "노을의 한강", "여의도에서 잠실까지, 41km의 자전거 도로.", G.blue, 1, 26),
  c("hangang_2", "hangang", "cardnews", "따릉이", "서울 어디서든 빌리고 어디서든 반납. 도시의 공유 자전거.", G.emerald, 2),
  c("hangang_3", "hangang", "cardnews", "다리 위", "한강 다리 23개. 자전거로 건너볼 수 있는 다리는 그중 12개.", G.indigo, 3),

  c("janggu_1", "janggu", "cardnews", "양면의 가락", "왼쪽은 낮고 둔하게, 오른쪽은 맑고 높게. 대화 같은 리듬.", G.amber, 1),
  c("janggu_2", "janggu", "shortform", "사물놀이", "꽹과리·징·장구·북. 1978년에 태어난 새로운 전통.", G.rose, 2, 33),
  c("janggu_3", "janggu", "cardnews", "굿거리장단", "9박 한 장단. 한국 음악의 가장 보편적인 호흡.", G.slate, 3),

  c("filmcam_1", "filmcam", "cardnews", "36장의 제약", "한 롤에 36장. 모든 셔터가 가볍지 않다.", G.slate, 1),
  c("filmcam_2", "filmcam", "shortform", "현상의 기다림", "찍고 일주일을 기다린다. 그것이 필름의 시간.", G.indigo, 2, 24),
  c("filmcam_3", "filmcam", "cardnews", "그레인", "디지털이 흉내내지 못하는 입자의 결.", G.rose, 3),

  c("kindie_1", "kindie", "shortform", "홍대의 밤", "검정치마, 새소년, 잔나비... 한국 인디의 작은 우주.", G.indigo, 1, 29),
  c("kindie_2", "kindie", "cardnews", "라이브 클럽", "홍대 일대의 50여 개 라이브 클럽. 매일 다른 밴드가 선다.", G.rose, 2),
  c("kindie_3", "kindie", "cardnews", "EP의 시대", "정규 앨범보다 작은, 4~6곡짜리 우주.", G.amber, 3),

  c("noporo_1", "noporo", "cardnews", "30년 노포", "한 자리에서 30년 이상 영업한 가게. 서울에 약 200곳.", G.amber, 1),
  c("noporo_2", "noporo", "shortform", "을지면옥", "1965년부터, 변하지 않는 평양냉면.", G.slate, 2, 28),
  c("noporo_3", "noporo", "cardnews", "주인의 손맛", "메뉴가 단순할수록, 시간이 깊어질수록.", G.emerald, 3),

  c("zen_1", "zen", "cardnews", "10분의 호흡", "들숨 4초, 멈춤 4초, 날숨 6초. 그 한 사이클.", G.indigo, 1),
  c("zen_2", "zen", "shortform", "묵조선", "그저 앉아 있을 뿐. 그것이 전부인 명상.", G.slate, 2, 36),
  c("zen_3", "zen", "cardnews", "백지", "마음을 비우는 일은, 마음에 무엇이 있는지 보는 일에서 시작된다.", G.blue, 3),

  c("hongdaeindie_1", "hongdaeindie", "shortform", "홍대 클럽 거리", "FF·롤링홀·V홀·살롱 바다비. 작은 무대들의 거리.", G.indigo, 1, 30),
  c("hongdaeindie_2", "hongdaeindie", "cardnews", "출연료 제로", "초창기 인디 밴드는 입장료를 4명이 나눠 가졌다. 그게 전부였다.", G.rose, 2),
  c("hongdaeindie_3", "hongdaeindie", "cardnews", "잔디 위 콘서트", "토요일의 홍대 놀이터. 모르는 밴드가 갑자기 시작한다.", G.emerald, 3),

  c("eulpapers_1", "eulpapers", "cardnews", "잉크 냄새의 골목", "을지로 3가, 4가. 좁은 골목마다 인쇄소.", G.slate, 1),
  c("eulpapers_2", "eulpapers", "shortform", "활판인쇄", "납활자를 한 자씩 짜 넣어 찍는다. 50년 전 방식.", G.amber, 2, 27),
  c("eulpapers_3", "eulpapers", "cardnews", "70년 인쇄기", "여전히 돌아가는 1960년대 평판인쇄기.", G.indigo, 3),

  c("teaceremony_1", "teaceremony", "cardnews", "차 한 잔의 시간", "물 끓이고, 우리고, 따르고, 마시는. 15분의 의식.", G.emerald, 1),
  c("teaceremony_2", "teaceremony", "shortform", "다도", "차를 우리는 손동작 하나하나가 정해져 있다.", G.amber, 2, 32),
  c("teaceremony_3", "teaceremony", "cardnews", "녹차의 계절", "4월 곡우 전후. 그해 첫 잎을 따는 일주일.", G.blue, 3),

  c("matgyup_1", "matgyup", "cardnews", "한 가닥 실", "한국 매듭은 양 끝이 똑같이 시작하고 끝난다.", G.amber, 1),
  c("matgyup_2", "matgyup", "shortform", "노리개", "조선시대 여인의 손에서 옷고름까지.", G.rose, 2, 25),
  c("matgyup_3", "matgyup", "cardnews", "가락지매듭", "가장 기본이 되는 매듭. 모든 매듭의 시작.", G.slate, 3),

  c("calligraphy_1", "calligraphy", "cardnews", "글자에 깃든 마음", "필체는 그 사람의 호흡이다.", G.indigo, 1),
  c("calligraphy_2", "calligraphy", "shortform", "붓의 호흡", "획을 그을 때 숨을 멈춘다. 그것이 캘리의 본질.", G.slate, 2, 28),
  c("calligraphy_3", "calligraphy", "cardnews", "한글 캘리", "한글의 곡선은 다른 언어가 흉내낼 수 없는 흐름.", G.amber, 3),

  c("vinyl_1", "vinyl", "cardnews", "회전하는 검은 원판", "33⅓ rpm. 분당 33과 ⅓ 바퀴. 그 정확한 속도가 음악을 만든다.", G.slate, 1),
  c("vinyl_2", "vinyl", "shortform", "Crackle", "처음 5초의 잡음. 그것이 LP의 인사다.", G.indigo, 2, 22),
  c("vinyl_3", "vinyl", "cardnews", "A면과 B면", "20분짜리 두 면. 뒤집는 행위가 음악을 끊고 또 잇는다.", G.rose, 3),

  c("pottery_1", "pottery", "cardnews", "흙이 모양을 찾는다", "도예가는 흙을 만드는 게 아니라, 흙이 되고 싶은 모양을 듣는다.", G.amber, 1),
  c("pottery_2", "pottery", "shortform", "물레", "회전하는 흙을 손으로 잡는 그 순간이 모든 시작.", G.emerald, 2, 30),
  c("pottery_3", "pottery", "cardnews", "유약 한 겹", "가마에서 나오기 전엔 색을 알 수 없다.", G.rose, 3),

  c("trail_1", "trail", "shortform", "흙길의 호흡", "도시 너머의 산비탈. 자갈과 뿌리 사이로.", G.emerald, 1, 26),
  c("trail_2", "trail", "cardnews", "100마일러", "100마일을 한 번에 달리는 사람들. 24시간이 넘게 걸린다.", G.slate, 2),
  c("trail_3", "trail", "cardnews", "가벼운 짐", "긴 거리를 달리는 비결은 들고 가는 것을 줄이는 일.", G.blue, 3),

  c("shortform_1", "shortform", "cardnews", "10분의 우주", "단편의 강제력. 한 컷도 버릴 수 없다.", G.indigo, 1),
  c("shortform_2", "shortform", "shortform", "황금종려상 단편", "칸 영화제 단편 부문. 1994년 한국 단편이 받았다.", G.amber, 2, 33),
  c("shortform_3", "shortform", "cardnews", "감독의 첫 입", "많은 거장이 단편으로 세상에 입을 열었다.", G.slate, 3),

  c("haiku_1", "haiku", "cardnews", "5/7/5", "17음절. 한 호흡에 들어갈 만큼의 시.", G.slate, 1),
  c("haiku_2", "haiku", "cardnews", "마쓰오 바쇼", "옛 연못에 / 개구리 뛰어드는 / 물소리.", G.blue, 2),
  c("haiku_3", "haiku", "shortform", "키고", "계절을 가리키는 단어. 모든 하이쿠는 한 계절을 머금는다.", G.emerald, 3, 24),
];
