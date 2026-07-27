import { projectMetaSchema, type ProjectMeta } from "@/content/schema";

// 목록 순서 = 메인 `$ ls projects/`의 행 순서이자 상세 페이지 이전/다음 순환 순서다.
const rawProjects = [
  {
    slug: "modu-campus",
    order: 1,
    title: "모두의 캠퍼스",
    summary: "배리어프리 캠퍼스 웹 지도 · 고려대 체인지메이커스 선정",
    stackLine: "next.js · supabase",
    badge: { label: "WIP", tone: "accent" },
    preview: "/screenshots/modu-map.png",
  },
  {
    slug: "ankang-sumgim",
    order: 2,
    title: "안강 섬김 복지센터",
    summary: "실고객 홈페이지·CMS · 얼굴 자동 블러",
    stackLine: "next.js · sharp",
    badge: { label: "LIVE", tone: "muted" },
    preview: "/screenshots/sumgim-home.png",
  },
  {
    slug: "ycc-website",
    order: 3,
    title: "영천중앙교회",
    summary: "교회 홈페이지·CMS · 설교 자동화 · AI 요약",
    stackLine: "next.js · qstash",
    badge: { label: "LIVE", tone: "muted" },
    preview: "/screenshots/ycc-home.png",
  },
  {
    slug: "worldengco",
    order: 4,
    title: "월드ENC.CO",
    summary: "반려견 목욕차 회사 홈페이지 · Wix → 자체 서비스 이관",
    stackLine: "next.js · cloudflare",
    badge: { label: "WIP", tone: "accent" },
    preview: "/screenshots/worldeng-home.png",
  },
  {
    slug: "hmsu",
    order: 5,
    title: "한약안전사용 플랫폼",
    summary: "복지부 과제 · 공공데이터 3만건+ 통합",
    stackLine: "java · mysql",
    badge: { label: "1인 PM", tone: "muted" },
    preview: "/screenshots/hmsu-home.png",
  },
];

// 빌드타임 검증 — 형식이 틀리면 여기서 빌드가 깨진다.
export const projects: ProjectMeta[] = rawProjects.map((project) =>
  projectMetaSchema.parse(project),
);
