# dwoobae.com

> 개인 포트폴리오 웹사이트

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

## 구조

메인 랜딩 한 장(좌측 레일 + 섹션들)과 프로젝트 상세 5장이 전부입니다. 다크 터미널 테마이고, 디자인 토큰은 `src/app/globals.css`의 `@theme`에 모여 있습니다.

- 콘텐츠는 DB 없이 파일 기반입니다. 목록 행에 그려지는 값은 `src/content/projects/meta.ts`에서 zod로 빌드타임 검증하고, 상세 페이지 본문은 `src/content/projects/case-studies.ts`가 slug로 물고 있습니다. 랜딩 카피는 `src/content/home.ts`입니다.
- 상세는 `generateStaticParams` + `dynamicParams = false`로 정적 생성합니다.
- 관리자 페이지·인증·DB가 없습니다. 콘텐츠는 git push로 관리합니다.
- 사이트 URL은 `NEXT_PUBLIC_SITE_URL` 하나만 봅니다. `src/lib/site.ts`의 `site.url`이 유일한 소비 지점이고 sitemap·robots·JSON-LD·OG가 모두 이를 경유합니다. 컴포넌트에 절대 URL을 직접 쓰지 않습니다.
- 옛 URL(`/projects`, `/about`, 구 slug)은 `next.config.ts`의 `redirects()`가 새 위치로 넘깁니다.

클라이언트 상태는 셋뿐입니다 — 히어로 타이핑 진행도, 스크롤 스파이 활성 섹션, 목록 hover 미리보기. 나머지는 전부 서버 컴포넌트입니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 품질 검사

```bash
npm run lint          # ESLint
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit
npm test              # Vitest
npm run e2e           # Playwright
```

## 배포

`main`에 push하면 GitHub Actions가 lint·format·typecheck·test·e2e를 모두 통과한 뒤 Cloudflare Workers에 배포합니다. 파이프라인은 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)에 있습니다.

로컬에서 Workers 런타임으로 미리 확인하려면:

```bash
npm run preview
```

> `npm run dev`는 Turbopack, 배포 빌드는 webpack(`next build --webpack`)을 씁니다. E2E는 dev 서버를 대상으로 하므로, 배포 산출물까지 확인하려면 `npm run preview`로 한 번 더 봅니다.

## 프로젝트 스크린샷

`public/screenshots/`에 넣습니다. 목록은 [`public/screenshots/README.md`](public/screenshots/README.md)를 참고하세요. 경로가 실제 파일과 어긋나면 `npm test`가 깨집니다.
