export const site = {
  name: "배동우",
  role: "백엔드 중심 풀스택 개발자",
  tagline:
    "실사용자가 있는 서비스를 수주부터 설계·개발·운영까지 혼자 책임집니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dwoobae.com",
  email: "dw5817@gmail.com",
  github: "https://github.com/dongwoobae",
  repoUrl: "https://github.com/dongwoobae/portfolio",
} as const;

export const navItems = [
  { href: "/projects", label: "프로젝트" },
  { href: "/about", label: "소개" },
] as const;
