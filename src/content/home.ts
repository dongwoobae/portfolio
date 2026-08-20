// 메인 랜딩의 카피. 디자인 핸드오프(design/Portfolio.dc.html)의 문안을 그대로 옮겼다.

import { careerItemSchema, type CareerItem } from "@/content/schema";

/**
 * 첫 화면에서 제일 먼저 읽히는 한 문장. 스크롤을 내릴지 말지가 여기서 갈리므로
 * 기술 나열보다 앞에 둔다. 줄바꿈은 자동에 맡기지 않고 여기서 끊는다 —
 * 한 줄이 한 호흡이어야 짧게 읽힌다(좁은 화면에서는 자연스럽게 더 접힌다).
 */
export const heroHook: { text: string; accent?: boolean }[][] = [
  [{ text: "도메인을 먼저", accent: true }, { text: " 보고" }],
  [{ text: "기능을 설계합니다." }],
];

/** 후킹 문장 아래 받쳐 주는 설명. 마찬가지로 줄 단위로 끊어 둔다. */
export const heroIntro = [
  "백엔드를 중심으로 서비스의 데이터와 업무 흐름을 설계합니다.",
  "필요하면 프론트엔드와 인프라까지 연결해 실제 운영 가능한 형태로 만듭니다",
  "— 얼굴 자동 블러, 설교 영상 수집·요약, 이중예약을 막는 예약 시스템까지",
  "사용자와 운영자가 실제로 겪는 문제를 코드로 풉니다.",
];

export const stackLines = [
  { label: "Backend", value: "Java · Spring Boot · NestJS" },
  { label: "Frontend", value: "TypeScript · Next.js · React · JSP" },
  { label: "Data", value: "MariaDB · MySQL · Redis · Supabase · Neon" },
  { label: "Infra", value: "Cloudflare · Vercel · GH Actions" },
] as const;

const rawCareer = [
  {
    period: "2026.04 —",
    kind: "job",
    current: true,
    title: "모바일이앤엠애드",
    description:
      "· 모바일 쿠폰 B2B 수작업을 온라인화하는 오픈몰 백엔드 · AWS 인프라 설계·기안",
  },
  {
    period: "2024.11–2025.07",
    kind: "job",
    current: false,
    title: "메디케이시스템",
    description:
      "· 한약안전사용플랫폼(국가 R&D 과제) 기획·데이터·개발 · 외부 기관 데이터 협의",
  },
  {
    period: "2024.03–09",
    kind: "education",
    current: false,
    title: "네이버클라우드 데브옵스 과정",
    description: "· 클라우드 기반 웹 개발자 과정 수료 · NCA·NCP 자격 취득",
  },
  {
    period: "— 2022.08",
    kind: "education",
    current: false,
    title: "고려대학교 졸업",
    description: "· 지구환경과학과",
  },
];

// 빌드타임 검증 — 형식이 틀리면 여기서 빌드가 깨진다.
export const career: CareerItem[] = rawCareer.map((item) =>
  careerItemSchema.parse(item),
);

// 상단 2장은 강조 스타일(보더 line-accent + 그라데이션).
// slug는 상세 페이지 링크용 — meta.ts의 slug와 같아야 리다이렉트를 거치지 않는다.
export const highlights = [
  {
    slug: "worldengco",
    kicker: "partial unique index",
    title: "동시 요청이 같은 예약 슬롯을 통과하지 못하게",
    description:
      "앱 레벨 check-then-insert가 원자적이지 않은 D1에서, 확정 예약에만 걸리는 부분 유니크 인덱스로 이중예약을 DB가 최종 차단. 가용 판정은 화면과 서버가 같은 함수를 쓴다.",
    accent: true,
  },
  {
    slug: "ycc-website",
    kicker: "websub → qstash → gemini",
    title: "폴링 없는 설교 자동화 파이프라인",
    description:
      "YouTube WebSub 푸시 수신(HMAC 서명 검증) → QStash 잡 체이닝으로 자막 수집·AI 구조화 요약. 서버리스 환경에서 지수 백오프를 지연 발행으로 구현.",
    accent: true,
  },
  {
    slug: "ankang-sumgim",
    kicker: "face-api.js + sharp",
    title: "게시 사진 얼굴 자동 블러",
    description:
      "클라이언트 감지·서버 블러 분리, EXIF 회전 좌표 보정, 원본/블러 이중 저장 + 수동 편집 fallback으로 개인정보 보호를 자동화.",
    accent: false,
  },
  {
    slug: "coupon-b2b-mall",
    kicker: "redis queue · 발송 결과 정합화",
    title: "발송사 제한 아래에서 대량 발송을 흘려보내기",
    description:
      "수신자 한 명을 작업 한 건으로 쪼개 소비 속도를 제한 아래로 묶고, 실패는 재시도 가능과 영구로 나눠 한 명의 실패가 배치 전체를 되돌리지 않게 설계.",
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
