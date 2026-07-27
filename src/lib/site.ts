export const site = {
  name: "배동우",
  role: "백엔드 중심 풀스택 개발자",
  tagline:
    "실사용자가 있는 서비스를 수주부터 설계·개발·운영까지 혼자 책임집니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dwoobae.com",
  email: "dw5817@naver.com",
  phone: "010-5586-5817",
  github: "https://github.com/dongwoobae",
  githubLabel: "github.com/dongwoobae",
  repoUrl: "https://github.com/dongwoobae/portfolio",
} as const;

// 레일 네비 = 메인의 스크롤 스파이 대상. id는 각 섹션의 DOM id와 같아야 한다.
export const sections = [
  { id: "career", label: "career" },
  { id: "highlights", label: "highlights" },
  { id: "projects", label: "projects" },
  { id: "team", label: "team" },
] as const;
