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
  // 음악 (15)
  s("jazz", "jazz", "재즈", "20세기 초 미국에서 태어난 즉흥의 음악", 1),
  s("classical", "classical", "클래식", "수백 년을 살아남은 멜로디들", 1),
  s("rock", "rock", "록", "기타 셋의 폭발", 1),
  s("hiphop", "hiphop", "힙합", "비트 위에 얹는 라임", 1),
  s("rnb", "rnb", "R&B", "끈적한 리듬 위의 보컬", 1),
  s("electronic", "electronic", "일렉트로니카", "기계가 만든 박자", 1),
  s("ambient", "ambient", "앰비언트", "공기처럼 떠 있는 소리", 1),
  s("bossanova", "bossa_nova", "보사노바", "리우의 해변에서 시작된 부드러움", 1),
  s("blues", "blues", "블루스", "12마디의 슬픔", 1),
  s("folk", "folk", "포크", "한 사람과 한 기타", 1),
  s("kindie", "k_indie", "K-인디씬", "한국 인디 음악의 작은 우주", 1, "country", "대한민국"),
  s("hongdaeindie", "hongdae_indie", "홍대 인디씬", "홍대 거리의 라이브 클럽 문화", 1, "neighborhood", "홍대"),
  s("kpop", "kpop", "K-팝", "한국에서 세계로", 1, "country", "대한민국"),
  s("trot", "trot", "트로트", "한국 가요의 기둥", 1, "country", "대한민국"),
  s("vinyl", "vinyl_record", "바이닐", "회전하는 검은 원판의 따뜻한 잡음", 1),

  // 시각예술 (15)
  s("calligraphy", "calligraphy", "캘리그라피", "글자에 깃든 마음의 결", 2),
  s("oilpainting", "oil_painting", "유화", "층층이 쌓이는 색의 시간", 2),
  s("watercolor", "watercolor", "수채화", "물이 종이 위에서 번지는 순간", 2),
  s("koreanpainting", "korean_painting", "한국화", "여백의 미", 2, "country", "대한민국"),
  s("sumie", "sumi_e", "수묵화", "검은 먹의 농담", 2),
  s("photography", "photography", "사진", "찰나를 멈추는 일", 2),
  s("illustration", "illustration", "일러스트", "그림으로 하는 이야기", 2),
  s("graphicdesign", "graphic_design", "그래픽디자인", "정보를 보기 좋게", 2),
  s("typography", "typography", "타이포그래피", "글자를 디자인하는 일", 2),
  s("collage", "collage", "콜라주", "조각을 모아 새로 만드는 그림", 2),
  s("sculpture", "sculpture", "조각", "공간을 채우는 형태", 2),
  s("printmaking", "printmaking", "판화", "찍어내는 예술", 2),
  s("streetart", "street_art", "스트리트아트", "도시의 벽을 캔버스로", 2),
  s("abstract", "abstract", "추상화", "형상 없는 표현", 2),
  s("pixelart", "pixel_art", "픽셀아트", "정사각형 점으로 그린 세계", 2),

  // 공예 (15)
  s("pottery", "pottery", "도예", "흙이 손끝에서 모양을 찾아가는 시간", 3),
  s("matgyup", "knot_craft", "매듭공예", "한 가닥 실로 그려내는 정중한 무늬", 3, "country", "대한민국"),
  s("seongsushoes", "seongsu_handmade_shoes", "성수동 수제화", "성수동 골목의 가죽 냄새와 미싱 소리", 3, "neighborhood", "성수동"),
  s("eulpapers", "eulji_print", "을지로 인쇄소", "잉크 냄새가 배어든 을지로의 골목", 3, "neighborhood", "을지로"),
  s("leather", "leather_craft", "가죽공예", "가죽이 손에 길드는 시간", 3),
  s("woodworking", "woodworking", "목공", "나무의 결을 따라 깎기", 3),
  s("metalcraft", "metal_craft", "금속공예", "두드림이 모양을 만든다", 3),
  s("glasscraft", "glass_craft", "유리공예", "1300도에서 손이 빚는 형태", 3),
  s("embroidery", "embroidery", "자수", "한 땀씩 채우는 그림", 3),
  s("jewelry", "jewelry", "보석세공", "작은 빛의 결정", 3),
  s("candlemaking", "candle_making", "양초 만들기", "왁스 한 그릇의 잔잔한 시간", 3),
  s("soapmaking", "soap_making", "비누 만들기", "오일이 굳어가는 일주일", 3),
  s("hanji", "hanji", "한지공예", "닥나무로 만든 한국 종이", 3, "country", "대한민국"),
  s("origami", "origami", "종이접기", "한 장의 종이가 형태로", 3),
  s("najeon", "najeon", "자개공예", "조개껍질의 무지개", 3, "country", "대한민국"),

  // 공연 (15)
  s("butoh", "butoh", "부토 무용", "일본에서 시작된 어둠의 신체 표현", 4),
  s("ballet", "ballet", "발레", "공간을 가로지르는 우아", 4),
  s("moderndance", "modern_dance", "현대무용", "규칙 너머의 몸짓", 4),
  s("theater", "theater", "연극", "무대 위의 한 시간", 4),
  s("musical", "musical", "뮤지컬", "노래로 말하는 이야기", 4),
  s("magic", "magic", "마술", "눈이 속는 즐거움", 4),
  s("circus", "circus", "서커스", "중력과의 협상", 4),
  s("puppet", "puppet_show", "인형극", "실 한 줄로 살아나는 캐릭터", 4),
  s("mime", "mime", "마임", "말 없는 연기", 4),
  s("opera", "opera", "오페라", "성악으로 하는 드라마", 4),
  s("samulnori", "samulnori", "사물놀이", "꽹과리·징·장구·북의 합주", 4, "country", "대한민국"),
  s("standup", "standup", "스탠드업", "혼자 무대에서 마이크 들고", 4),
  s("breaking", "breaking", "비보잉", "땅을 밟는 새로운 방법", 4),
  s("salsa", "salsa", "살사", "쿠바의 사교 댄스", 4),
  s("tango", "tango", "탱고", "두 사람의 한 호흡", 4),

  // 운동 (15)
  s("hangang", "hangang_bike", "한강 자전거", "한강을 따라 흐르는 바람과 바퀴", 5, "city", "서울"),
  s("trail", "trail_running", "트레일러닝", "흙길과 산비탈을 달리는 호흡", 5),
  s("climbing", "climbing", "클라이밍", "벽 위의 퍼즐", 5),
  s("yoga", "yoga", "요가", "몸과 호흡의 정렬", 5),
  s("pilates", "pilates", "필라테스", "코어 깊은 곳을 깨우기", 5),
  s("swimming", "swimming", "수영", "물속의 자유", 5),
  s("golf", "golf", "골프", "고요한 기다림과 한 번의 휘두름", 5),
  s("tennis", "tennis", "테니스", "코트 위의 짧은 대화", 5),
  s("badminton", "badminton", "배드민턴", "공원 어디에나 가능한 라켓 스포츠", 5),
  s("basketball", "basketball", "농구", "다섯의 흐름", 5),
  s("soccer", "soccer", "축구", "지구가 사랑하는 공놀이", 5),
  s("baseball", "baseball", "야구", "9이닝의 시간", 5),
  s("marathon", "marathon", "마라톤", "42.195km의 명상", 5),
  s("crossfit", "crossfit", "크로스핏", "기능적 강도", 5),
  s("surfing", "surfing", "서핑", "파도와 한 몸이 되는 일", 5),

  // 요리 (15)
  s("sourdough", "sourdough", "사워도우", "야생 효모로 발효시킨 빵의 결", 6),
  s("noporo", "old_eatery", "노포", "오래된 가게의 시간이 빚은 맛", 6, "country", "대한민국"),
  s("pasta", "pasta", "파스타", "밀가루의 다양한 모양", 6),
  s("baking", "baking", "베이킹", "오븐 안의 마법", 6),
  s("cake", "cake", "케이크", "축하의 단맛", 6),
  s("latteart", "latte_art", "라떼아트", "우유 거품으로 그리는 그림", 6),
  s("coffee", "coffee", "스페셜티 커피", "원두 한 알의 여정", 6),
  s("wine", "wine", "와인", "포도와 시간의 조합", 6),
  s("whiskey", "whiskey", "위스키", "오크통의 세월", 6),
  s("cocktail", "cocktail", "칵테일", "한 잔의 작은 디자인", 6),
  s("vegan", "vegan_cooking", "비건 요리", "채소만으로 충분한 식탁", 6),
  s("hansik", "hansik", "한식", "밥과 국과 반찬", 6, "country", "대한민국"),
  s("kimchi", "kimchi", "김치", "발효의 한국식 미학", 6, "country", "대한민국"),
  s("tteok", "tteok", "떡", "쌀로 만드는 다양한 모양", 6, "country", "대한민국"),
  s("dessert", "dessert", "디저트", "끝에 오는 단맛", 6),

  // 문학 (15)
  s("haiku", "haiku", "하이쿠", "17음절에 담는 계절의 한 컷", 7),
  s("poetry", "poetry", "시", "압축된 언어", 7),
  s("novel", "novel", "장편소설", "긴 호흡의 이야기", 7),
  s("shortstory", "short_story", "단편소설", "한 자리에서 다 읽는 이야기", 7),
  s("essay", "essay", "에세이", "삶의 한 조각을 쓰는 일", 7),
  s("sijo", "sijo", "시조", "3장 6구의 한국 정형시", 7, "country", "대한민국"),
  s("autobiography", "autobiography", "자서전", "내가 쓴 나의 시간", 7),
  s("manga", "manga", "만화", "칸과 칸 사이의 시간", 7),
  s("graphicnovel", "graphic_novel", "그래픽노블", "긴 호흡의 만화", 7),
  s("audiobook", "audiobook", "오디오북", "읽지 않고 듣는 책", 7),
  s("sf", "sf_lit", "SF 소설", "있을지도 모르는 미래", 7),
  s("mystery", "mystery_lit", "추리소설", "단서를 따라가는 독서", 7),
  s("koreanlit", "korean_lit", "한국문학", "이상부터 김초엽까지", 7, "country", "대한민국"),
  s("japaneselit", "japanese_lit", "일본문학", "무라카미와 다자이 사이", 7),
  s("modernclassics", "modern_classics", "현대 고전", "최근 100년의 명작", 7),

  // 게임 (15)
  s("boardgame", "board_game", "보드게임", "테이블 위의 대결", 8),
  s("indiegame", "indie_game", "인디게임", "작은 팀이 만든 큰 세계", 8),
  s("arcade", "arcade", "아케이드", "오락실의 빨간 버튼", 8),
  s("cardgame", "card_game", "카드게임", "52장의 가능성", 8),
  s("chess", "chess", "체스", "8x8 위의 8시간 전쟁", 8),
  s("baduk", "baduk", "바둑", "흑백의 우주", 8, "country", "대한민국"),
  s("janggi", "janggi", "장기", "한국식 체스", 8, "country", "대한민국"),
  s("rpg", "rpg", "RPG", "캐릭터를 키우는 시간", 8),
  s("strategy", "strategy_game", "전략게임", "한 수씩 깊게", 8),
  s("puzzle", "puzzle_game", "퍼즐", "정답을 찾아가는 즐거움", 8),
  s("mobilegame", "mobile_game", "모바일게임", "주머니 속의 놀이공원", 8),
  s("retrogame", "retro_game", "레트로게임", "8비트의 향수", 8),
  s("mmorpg", "mmorpg", "MMORPG", "수천 명이 만드는 세계", 8),
  s("fps", "fps", "FPS", "1인칭의 시야", 8),
  s("simgame", "sim_game", "시뮬레이션", "다른 삶을 사는 일", 8),

  // 자연 (15)
  s("hiking", "hiking", "등산", "정상을 향한 호흡", 9),
  s("camping", "camping", "캠핑", "별 아래의 텐트", 9),
  s("backpacking", "backpacking", "백패킹", "짐과 함께 걷는 며칠", 9),
  s("stargazing", "stargazing", "별 관측", "밤하늘을 보는 일", 9),
  s("sunrise", "sunrise", "일출", "하루의 시작을 보는 시간", 9),
  s("sunset", "sunset", "노을", "하루가 끝나가는 색", 9),
  s("ocean", "ocean", "바다", "끝없는 수평선", 9),
  s("forest", "forest", "숲", "초록의 깊이", 9),
  s("waterfall", "waterfall", "폭포", "떨어지는 물의 소리", 9),
  s("birdwatching", "bird_watching", "새 관찰", "쌍안경 너머의 작은 생명", 9),
  s("wildflower", "wildflower", "야생화", "이름 모를 꽃들", 9),
  s("gardening", "gardening", "정원 가꾸기", "흙과 손의 시간", 9),
  s("vegetablepatch", "vegetable_patch", "텃밭", "식탁까지의 거리가 5m", 9),
  s("bonsai", "bonsai", "분재", "화분 안의 큰 나무", 9),
  s("succulent", "succulent", "다육이", "물 한 모금이면 충분한 식물", 9),

  // 영상 (15)
  s("filmcam", "film_camera", "필름카메라", "필름의 결과 기다림의 미학", 10),
  s("shortform", "shortform_film", "단편영화", "10분 안에 한 우주를 담는 일", 10),
  s("documentary", "documentary", "다큐멘터리", "있는 그대로의 이야기", 10),
  s("indiefilm", "indie_film", "독립영화", "작은 예산의 큰 마음", 10),
  s("animation", "animation", "애니메이션", "그림이 살아 움직이는 일", 10),
  s("shortanim", "short_anim", "단편 애니", "5분짜리 한 우주", 10),
  s("musicvideo", "music_video", "뮤직비디오", "곡에 입혀진 영상", 10),
  s("advertising", "advertising_film", "광고 영상", "30초의 설득", 10),
  s("filmfestival", "film_festival", "영화제", "1년에 한 번 모이는 영화들", 10),
  s("series", "tv_series", "시리즈물", "긴 호흡의 영상", 10),
  s("cult", "cult_film", "컬트영화", "이상한 만큼 사랑받는 영화", 10),
  s("bmovie", "b_movie", "B급 영화", "낮은 예산의 매력", 10),
  s("silentfilm", "silent_film", "무성영화", "100년 전의 화면", 10),
  s("koreanfilm", "korean_film", "한국영화", "봉준호부터 박찬욱까지", 10, "country", "대한민국"),
  s("jpfilm", "japanese_film", "일본영화", "오즈와 미야자키 사이", 10),

  // 사색·명상 (15)
  s("zen", "zen_meditation", "선 명상", "호흡 하나로 우주를 마주하는 일", 11),
  s("mindfulness", "mindfulness", "마음챙김", "지금 여기에 머무르기", 11),
  s("journaling", "journaling", "일기 쓰기", "하루 끝에 마음을 정리하는 일", 11),
  s("breathwork", "breathwork", "호흡 명상", "들숨 4 · 멈춤 4 · 날숨 6", 11),
  s("walking", "walking_meditation", "걷기 명상", "한 걸음마다 알아차림", 11),
  s("teameditation", "tea_meditation", "차 명상", "한 잔의 호흡", 11),
  s("digitaldetox", "digital_detox", "디지털 디톡스", "스크린 없는 하루", 11),
  s("minimalism", "minimalism", "미니멀리즘", "덜 가지는 삶", 11),
  s("stoicism", "stoicism", "스토아주의", "통제할 수 있는 것에 집중", 11),
  s("laotzu", "lao_tzu", "노자", "도덕경의 무위자연", 11),
  s("buddhism", "buddhism", "불교 사상", "사성제와 팔정도", 11),
  s("gratitude", "gratitude_journal", "감사 일기", "매일 세 가지 감사", 11),
  s("memento", "memento_mori", "메멘토 모리", "죽음을 기억하라", 11),
  s("silence", "silence", "침묵", "말 없이 머무는 시간", 11),
  s("selfreflection", "self_reflection", "자기 성찰", "내 마음을 들여다보기", 11),

  // 디지털 (15)
  s("coding", "coding", "코딩", "기계와 대화하는 언어", 12),
  s("webdesign", "web_design", "웹디자인", "스크린을 배치하는 일", 12),
  s("uiux", "ui_ux", "UI/UX", "사람이 쓰는 디자인", 12),
  s("datascience", "data_science", "데이터 과학", "숫자에서 이야기 찾기", 12),
  s("ai", "ai", "인공지능", "기계가 배우는 시대", 12),
  s("ml", "machine_learning", "머신러닝", "데이터로 학습", 12),
  s("cybersec", "cybersecurity", "사이버보안", "디지털의 방어선", 12),
  s("blockchain", "blockchain", "블록체인", "분산된 기록", 12),
  s("nft", "nft", "NFT", "디지털 소유의 새 형태", 12),
  s("vr", "vr", "VR", "다른 공간에 있는 듯", 12),
  s("ar", "ar", "AR", "현실 위에 덧입히기", 12),
  s("gamedev", "game_dev", "게임 개발", "노는 것을 만드는 일", 12),
  s("appdev", "app_dev", "앱 개발", "주머니 속 도구 만들기", 12),
  s("opensource", "open_source", "오픈소스", "함께 만드는 코드", 12),
  s("motiongraphics", "motion_graphics", "모션그래픽", "움직이는 그래픽 디자인", 12),

  // 전통 (15)
  s("janggu", "janggu", "장구", "한국 전통 타악기의 양면 가락", 13, "country", "대한민국"),
  s("teaceremony", "tea_ceremony", "전통차", "차 한 잔에 담긴 느림의 시간", 13, "country", "대한민국"),
  s("hanbok", "hanbok", "한복", "한국의 옷", 13, "country", "대한민국"),
  s("hanok", "hanok", "한옥", "한국의 집", 13, "country", "대한민국"),
  s("folkgames", "folk_games", "전통놀이", "윷놀이·연날리기·널뛰기", 13, "country", "대한민국"),
  s("pungmul", "pungmul", "풍물", "마을의 흥", 13, "country", "대한민국"),
  s("templefood", "temple_food", "사찰음식", "절에서 만드는 정갈한 음식", 13, "country", "대한민국"),
  s("dado", "dado", "다도", "차를 따르는 의식", 13, "country", "대한민국"),
  s("traditionalwedding", "traditional_wedding", "전통혼례", "한복 입고 절하는 결혼식", 13, "country", "대한민국"),
  s("gut", "gut", "굿", "무당의 의식", 13, "country", "대한민국"),
  s("fortune", "fortune_telling", "사주", "태어난 시간의 운명", 13, "country", "대한민국"),
  s("fengshui", "fengshui", "풍수", "땅의 기운을 읽는 일", 13),
  s("hanyak", "hanyak", "한약", "달이는 약", 13, "country", "대한민국"),
  s("acupuncture", "acupuncture", "침술", "혈자리에 놓는 침", 13, "country", "대한민국"),
  s("folktales", "folktales", "전래동화", "할머니가 들려주던 이야기", 13, "country", "대한민국"),

  // 패션 (15)
  s("vintage", "vintage_fashion", "빈티지", "지난 시대의 옷", 14),
  s("minimal_fashion", "minimal_fashion", "미니멀 패션", "비우는 옷장", 14),
  s("streetwear", "streetwear", "스트릿웨어", "거리에서 자란 스타일", 14),
  s("workwear", "workwear", "워크웨어", "일하는 옷의 멋", 14),
  s("mod", "mod_fashion", "모드", "60년대 영국의 단정함", 14),
  s("retro", "retro_fashion", "레트로", "80년대로 돌아가기", 14),
  s("punk_fashion", "punk_fashion", "펑크 패션", "찢어짐과 안전핀", 14),
  s("goth", "goth", "고스", "검은 옷의 우아함", 14),
  s("kidult", "kidult", "키덜트", "어른의 장난", 14),
  s("feminine", "feminine", "페미닌", "부드러운 라인", 14),
  s("bohemian", "bohemian", "보헤미안", "자유로운 옷차림", 14),
  s("unisex", "unisex", "유니섹스", "성별 없는 디자인", 14),
  s("preppy", "preppy", "프레피", "동부 명문의 단정함", 14),
  s("oversized", "oversized", "오버사이즈", "한 치수 큰 멋", 14),
  s("ecofashion", "eco_fashion", "친환경 패션", "지구를 생각하는 옷", 14),

  // 뷰티 (15)
  s("skincare", "skincare", "스킨케어", "한 단계 한 단계 쌓는 루틴", 15),
  s("kbeauty", "kbeauty", "K-뷰티", "10단계 스킨케어의 나라", 15, "country", "대한민국"),
  s("makeup", "makeup", "메이크업", "얼굴 위의 디자인", 15),
  s("perfume", "perfume", "향수", "기억을 부르는 향", 15),
  s("haircolor", "hair_color", "헤어컬러", "머리카락의 캔버스", 15),
  s("hairstyle", "hairstyle", "헤어스타일", "한 번의 결정", 15),
  s("nailart", "nail_art", "네일아트", "손끝의 작은 그림", 15),
  s("contour", "contour", "컨투어링", "음영으로 만드는 입체", 15),
  s("nomakeup", "no_makeup", "노메이크업", "있는 그대로의 얼굴", 15),
  s("nicheperfume", "niche_perfume", "니치향수", "흔하지 않은 향", 15),
  s("cleanbeauty", "clean_beauty", "클린뷰티", "성분을 따져 보는 화장품", 15),
  s("veganbeauty", "vegan_beauty", "비건 뷰티", "동물성분 없는 화장품", 15),
  s("spa", "spa", "스파", "물과 향의 휴식", 15),
  s("massage", "massage", "마사지", "근육이 풀어지는 시간", 15),
  s("glow", "glow_makeup", "글로우 메이크업", "빛나는 피부 표현", 15),

  // 기타 (15)
  s("astrology", "astrology", "점성술", "별의 자리로 읽는 운명", 16),
  s("tarot", "tarot", "타로", "78장의 카드", 16),
  s("indiebookstore", "indie_bookstore", "독립서점", "주인이 고른 책들", 16),
  s("cafehopping", "cafe_hopping", "카페 투어", "도시의 작은 휴식처", 16),
  s("smallgallery", "small_gallery", "작은 미술관", "큰 전시 너머의 발견", 16),
  s("museum", "museum", "박물관", "유물 사이의 산책", 16),
  s("countryside", "countryside_life", "시골 생활", "도시 너머의 느림", 16),
  s("urbanlife", "urban_life", "도시 생활", "도시의 리듬", 16),
  s("vintageshop", "vintage_shop", "빈티지샵", "다른 사람의 시간을 가져오는 일", 16),
  s("flea", "flea_market", "벼룩시장", "주말의 보물찾기", 16),
  s("pet", "pet_life", "반려동물", "가족이 된 동물", 16),
  s("cat", "cat", "고양이", "독립적인 동거", 16),
  s("dog", "dog", "강아지", "꼬리로 표현하는 사랑", 16),
  s("plant", "plant_parent", "식물 집사", "초록을 키우는 일", 16),
  s("collecting", "collecting", "수집", "한 가지를 모아가는 시간", 16),

  // 영통 / 경희대 국제캠퍼스
  s("kyunghee_campus", "kyunghee_intl_campus", "경희대 국제캠퍼스", "수원 영통의 넓은 산책로와 호수", 9, "neighborhood", "영통"),
  s("hoegidong_noporo", "yeongtong_old_eatery", "영통 노포", "학생들이 자취하며 드나드는 오래된 가게", 6, "neighborhood", "영통"),
  s("hoegidong_alleys", "yeongtong_alleys", "영통 골목", "캠퍼스 너머의 자취 거리", 16, "neighborhood", "영통"),
  s("kyunghee_pungmul", "kyunghee_pungmul", "경희대 풍물패", "캠퍼스에 울리는 꽹과리·장구 가락", 13, "neighborhood", "영통"),
  s("hoegi_cafe_st", "yeongtong_cafe_street", "영통 카페 거리", "스터디카페부터 작은 로스터리까지", 16, "neighborhood", "영통"),
  s("kyunghee_festival", "kyunghee_festival", "경희대 축제", "5월의 가요제와 동아리 무대", 4, "neighborhood", "영통"),
  s("kyunghee_film", "kyunghee_film", "경희대 영화학과", "캠퍼스에서 만들어지는 단편영화", 10, "neighborhood", "영통"),
  s("kyunghee_orchestra", "kyunghee_orchestra", "경희 오케스트라", "필하모닉의 정기 연주회", 1, "neighborhood", "영통"),
];

// 일부 별만 큐레이션 카드뉴스. YouTube Shorts 가 메인 콘텐츠라 카드뉴스는 보조용.
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
  c("butoh_1", "butoh", "cardnews", "어둠의 춤", "1959년 일본. 히지카타 타츠미가 시작한 신체의 반란.", G.slate),
  c("seongsushoes_1", "seongsushoes", "cardnews", "성수동 골목", "1960년대부터 시작된 수제화 장인들의 거리.", G.amber),
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
