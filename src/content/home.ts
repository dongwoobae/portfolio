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
  "기획부터 배포·운영까지 책임집니다.",
  "실서비스 2건 운영 중이고 첫 홈페이지를 본 곳들의 소개로 의뢰가 이어졌습니다",
  "— 얼굴 자동 블러, 설교 영상 수집·요약, 이중예약을 막는 예약 시스템까지",
  "현장에 필요했던 기능을 코드로 만듭니다.",
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
    description: "· 이팝콘 다이렉트(오픈몰) 백엔드 · AWS 서버 설계·배포",
  },
  {
    period: "2024.11–2025.07",
    kind: "job",
    current: false,
    title: "메디케이시스템",
    description: "· 한약안전사용플랫폼 1인 담당 — 기획·데이터 수집·개발",
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
    accent: true,
  },
  {
    slug: "modu-campus",
    kicker: "overpass 3-server fallback",
    title: "경사도 오버레이 + 법정 기준 시각화",
    description:
      "경로 구간별 경사도를 색상 표시, 휠체어 접근 법정 기준 1/12 범례 명시. OSM 동기화는 3-서버 순차 폴백으로 장애 대응.",
    accent: false,
  },
  {
    slug: "worldengco",
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
