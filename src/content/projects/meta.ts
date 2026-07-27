import { projectMetaSchema, type ProjectMeta } from "@/content/schema";

// 착수 순. 성장 서사가 이 순서를 근거로 삼는다.
// 기간·커밋 수는 각 저장소의 git 이력에서 산출한 값이다 (2026-07-27 기준).
const rawProjects = [
  {
    slug: "ku-barrier-free-map",
    order: 1,
    title: "모두의 캠퍼스 — 고려대 배리어프리 지도",
    summary:
      "캠퍼스 접근성 시설을 통합 제공하는 인터랙티브 지도. 접근성 서비스인 만큼 UI 자체의 접근성도 전수 감사했다.",
    periodStart: "2026.04",
    status: "in-progress",
    role: "1인 개발 (기획·설계·개발·운영)",
    stack: ["Next.js", "TypeScript", "Leaflet", "Supabase", "Cloudflare R2"],
    repoUrl: "https://github.com/dongwoobae/korea-univ-project",
    commits: 188,
    featured: false,
    hasCaseStudy: false,
  },
  {
    slug: "ankang-welfare",
    order: 2,
    title: "안강 섬김 노인복지센터 홈페이지",
    summary:
      "복지센터 공식 홈페이지와 운영자 CMS. 게시 사진의 얼굴을 자동 감지·블러 처리해 이용자 초상권을 보호한다.",
    periodStart: "2026.05",
    periodEnd: "2026.06",
    periodNote: "이후 유지보수",
    status: "operating",
    role: "1인 개발 (기획·설계·개발·운영)",
    stack: [
      "Next.js",
      "TypeScript",
      "Supabase",
      "Cloudflare R2",
      "Sharp",
      "face-api.js",
    ],
    liveUrl: "https://sumgim-welfare.com",
    repoUrl: "https://github.com/dongwoobae/ankang-sumgim",
    commits: 121,
    featured: true,
    hasCaseStudy: true,
  },
  {
    slug: "ycc-church",
    order: 3,
    title: "영천중앙교회 홈페이지",
    summary:
      "설교·주보·소식·갤러리 공개 페이지와 CMS. 유튜브에 영상이 올라오면 자막 수집부터 AI 요약까지 자동으로 채워진다.",
    periodStart: "2026.06",
    periodEnd: "2026.07",
    periodNote: "이후 유지보수",
    status: "operating",
    role: "1인 개발 (기획·설계·개발·운영)",
    stack: [
      "Next.js",
      "TypeScript",
      "Neon",
      "Drizzle",
      "Better Auth",
      "QStash",
      "Gemini",
    ],
    liveUrl: "https://www.ycjc.kr",
    repoUrl: "https://github.com/dongwoobae/ycc-website",
    commits: 377,
    featured: true,
    hasCaseStudy: true,
  },
  {
    slug: "vehicle-manufacturer",
    order: 4,
    title: "특장차 제작업체 홈페이지",
    summary:
      "기존 Wix 사이트를 Next.js로 전면 리모델링. Cloudflare Workers 엣지 스택으로 구축하고 첫날부터 CI/CD를 세웠다.",
    periodStart: "2026.07",
    periodNote: "부품관리 확장은 고객 자료 대기",
    status: "in-progress",
    role: "1인 개발 (기획·설계·개발·운영)",
    stack: [
      "Next.js",
      "TypeScript",
      "Cloudflare Workers",
      "D1",
      "R2",
      "Drizzle",
    ],
    liveUrl: "https://worldengco-website.dongwoobae.workers.dev",
    commits: 64,
    featured: false,
    hasCaseStudy: false,
  },
  {
    slug: "herbal-medicine-platform",
    order: 5,
    title: "한약안전사용 플랫폼",
    summary:
      "보건복지부 한의디지털융합사업 과제. 한의 정보 3만 건과 공공데이터 API를 통합했고 1인 PM 겸 개발자로 수행했다.",
    periodStart: "2025.01",
    periodEnd: "2025.07",
    status: "completed",
    role: "1인 PM · 개발",
    stack: ["Java", "JSP", "Servlet", "Tomcat", "MySQL"],
    featured: false,
    hasCaseStudy: false,
  },
];

// 빌드타임 검증 — 형식이 틀리면 여기서 빌드가 깨진다.
export const projects: ProjectMeta[] = rawProjects.map((project) =>
  projectMetaSchema.parse(project),
);
