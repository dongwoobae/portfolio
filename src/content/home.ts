// 메인 랜딩의 카피. 디자인 핸드오프(design/Portfolio.dc.html)의 문안을 그대로 옮겼다.

export const heroIntro =
  "기획부터 배포·운영까지 책임집니다. 실서비스 2건 운영 중 — 얼굴 자동 블러, WebSub 이벤트 파이프라인, 서버리스 메시지 큐 같은 문제를 코드로 풉니다.";

export const stackLines = [
  { label: "Backend", value: "Java · Spring Boot · NestJS" },
  { label: "Frontend", value: "TypeScript · Next.js · React" },
  { label: "Data", value: "MySQL · Supabase · Neon" },
  { label: "Infra", value: "Cloudflare · Vercel · GH Actions" },
] as const;

export const career = [
  {
    period: "2024.11 —",
    current: true,
    title: "웹 개발자 재직",
    description:
      "· 한약안전사용플랫폼 1인 PM·개발 → Spring Boot·NestJS·Next.js 실무",
  },
  {
    period: "2024.03–09",
    current: false,
    title: "네이버클라우드 데브옵스 과정",
    description: "· 클라우드 기반 웹 개발자 과정 수료 · NCA·NCP 자격 취득",
  },
  {
    period: "— 2024",
    current: false,
    title: "고려대학교 졸업",
    description: "· 지구환경과학과",
  },
] as const;

// 상단 2장은 강조 스타일(보더 line-accent + 그라데이션). slug는 상세 페이지 링크용.
export const highlights = [
  {
    slug: "ycc-church",
    kicker: "websub → qstash → gemini",
    title: "폴링 없는 설교 자동화 파이프라인",
    description:
      "YouTube WebSub 푸시 수신(HMAC 서명 검증) → QStash 잡 체이닝으로 자막 수집·AI 구조화 요약. 서버리스 환경에서 지수 백오프를 지연 발행으로 구현.",
    accent: true,
  },
  {
    slug: "ankang-welfare",
    kicker: "face-api.js + sharp",
    title: "게시 사진 얼굴 자동 블러",
    description:
      "클라이언트 감지·서버 블러 분리, EXIF 회전 좌표 보정, 원본/블러 이중 저장 + 수동 편집 fallback으로 개인정보 보호를 자동화.",
    accent: true,
  },
  {
    slug: "ku-barrier-free-map",
    kicker: "overpass 3-server fallback",
    title: "경사도 오버레이 + 법정 기준 시각화",
    description:
      "경로 구간별 경사도를 색상 표시, 휠체어 접근 법정 기준 1/12 범례 명시. OSM 동기화는 3-서버 순차 폴백으로 장애 대응.",
    accent: false,
  },
  {
    slug: "vehicle-manufacturer",
    kicker: "wix → d1 · dry-run/apply",
    title: "Wix 사이트 데이터 자체 서비스 이관",
    description:
      "기존 Wix 사이트의 게시물을 이관 스크립트로 자동 임포트. dry-run으로 검증한 뒤 apply하는 2단계 설계로 운영 데이터를 안전하게 이전.",
    accent: false,
  },
] as const;

export const team = [
  {
    name: "조선팔도",
    meta: "7인 팀 · 2024",
    description: "조선 8도 테마 온라인 멀티플레이 보드게임.",
    role: "담당: 로그인(OAuth2·JWT) / 백엔드",
    stack: "spring security · websocket · stomp",
  },
  {
    name: "낭만닥터",
    meta: "6인 팀 · 2024",
    description: "성형외과 통합 예약·진료 플랫폼.",
    role: "담당: 처방전 / 리뷰게시판 / 결제",
    stack: "spring boot · thymeleaf · jenkins",
  },
] as const;
