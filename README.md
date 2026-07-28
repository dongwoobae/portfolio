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
- 서버 라우트는 `POST /api/resume-contact` 하나뿐입니다. 이력서의 전화번호를 비밀번호 뒤에 두려면 서버 검증이 필요해서 둔 예외이고, 상태를 갖지 않습니다. 전화번호와 비밀번호는 저장소에 없고 Workers secret(`RESUME_PHONE`, `RESUME_PASSWORD`)으로만 존재합니다. 로컬 개발은 `.dev.vars`로 주입합니다. `wrangler types` 생성물(`cloudflare-env.d.ts`)은 gitignore 대상이고, 코드가 실제로 쓰는 바인딩은 `src/cloudflare-env.d.ts`에 손으로 선언합니다.
- `/resume`는 `noindex`이고 sitemap에서 빠집니다. 다만 이는 검색 노출 방지일 뿐 접근 통제가 아니라, 본문은 공개 전제로 씁니다.
- 사이트 URL은 `NEXT_PUBLIC_SITE_URL` 하나만 봅니다. `src/lib/site.ts`의 `site.url`이 유일한 소비 지점이고 sitemap·robots·JSON-LD·OG가 모두 이를 경유합니다. 컴포넌트에 절대 URL을 직접 쓰지 않습니다.
- 옛 URL(`/projects`, `/about`, 구 slug)은 `next.config.ts`의 `redirects()`가 새 위치로 넘깁니다.
- 방문 집계는 Cloudflare Web Analytics의 자동 설정이 담당합니다. 프록시가 비콘을 응답에 주입하므로 저장소에는 계측 코드가 사실상 없습니다. `layout.tsx`에 수동 주입 경로가 남아 있지만 `NEXT_PUBLIC_CF_BEACON_TOKEN`을 채우면 비콘이 두 번 발사돼 중복 집계되므로, 자동 설정을 끄지 않는 한 이 값은 비워 둡니다.

클라이언트 상태는 다섯입니다 — 히어로 타이핑 진행도, 스크롤 스파이 활성 섹션, 목록 hover 미리보기, 이메일 복사 피드백, 이력서 연락처 잠금 해제. 나머지는 전부 서버 컴포넌트입니다.

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

## 이력서

`/resume`는 별도 PDF 파일이 아니라 `src/content/resume.ts` + `home.ts`를 조립한 페이지이고, 인쇄하면 흰 배경·파란 포인트의 A4 이력서로 나옵니다. 인쇄 규격은 `src/app/globals.css`의 `@media print` 블록에 있습니다. 내용을 고칠 때는 `resume.ts`만 보면 되고, 경력·스택·대표 프로젝트는 `home.ts`를 재사용하므로 두 번 쓰지 않습니다.

전화번호는 화면에 없습니다. 우측 상단 `↓ 이력서 다운로드` → 비밀번호 모달 → 통과하면 인쇄 다이얼로그가 열리고, 번호는 인쇄 결과물에만 찍힙니다. 해제한 뒤에도 화면에는 나타나지 않습니다.

## 프로젝트 스크린샷

`public/screenshots/`에 넣습니다. 목록은 [`public/screenshots/README.md`](public/screenshots/README.md)를 참고하세요. 경로가 실제 파일과 어긋나면 `npm test`가 깨집니다.
