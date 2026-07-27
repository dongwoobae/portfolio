# 포트폴리오 웹사이트 1차 릴리스 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dwoobae.com에 홈·프로젝트 목록·케이스 스터디 2편·About을 배포하고, 첫 커밋부터 CI/CD와 품질 게이트가 동작하는 상태를 만든다.

**Architecture:** Next.js 16 App Router를 OpenNext로 번들해 Cloudflare Workers에 배포한다. 콘텐츠는 DB 없이 파일 기반 — 프로젝트 메타데이터는 zod로 검증하는 TypeScript 모듈(`src/content/projects/meta.ts`), 본문은 같은 디렉터리의 MDX. 목록 페이지는 메타만 읽고, 상세 페이지는 `generateStaticParams` + `dynamicParams = false`로 정적 생성하며 slug에 해당하는 MDX를 동적 import한다. 관리자·인증·DB 없음.

**Tech Stack:** Next.js 16.2.10 · React 19 · TypeScript(strict) · Tailwind CSS v4 · @next/mdx · zod · Vitest · Playwright · @opennextjs/cloudflare · wrangler · GitHub Actions

**작업 순서 원칙:** 인프라를 먼저 끝까지 관통시킨다. 빈 페이지 하나로 로컬 → Workers → 커스텀 도메인 → CI 자동배포를 뚫어 놓고, 그다음에 콘텐츠를 얹는다. 4번 프로젝트에서 Turbopack ↔ OpenNext 비호환이 **배포 후에야** 드러났던 경험을 반영한 순서다.

---

## 사전 조건 (사용자 직접 수행)

이 계획은 아래가 준비된 상태를 전제한다. 에이전트가 대신할 수 없다.

- [x] **도메인** — `dwoobae.com` (Cloudflare Registrar, 2026-07 등록). Cloudflare 대시보드에 zone이 활성 상태여야 한다.
- [ ] **Cloudflare API 토큰 발급** — 대시보드 → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" 템플릿. 생성된 토큰을 GitHub 저장소 `dongwoobae/portfolio` → Settings → Secrets and variables → Actions → New repository secret에 **`CLOUDFLARE_API_TOKEN`** 이름으로 등록.
- [ ] **Next.js 스캐폴드 생성** — Task 1에 명령과 절차가 있다. 대화형 프롬프트가 있어 사용자가 직접 실행한다.
- [ ] Node.js 24 이상, npm 설치 확인 (`node -v`)

Account ID는 `1dafd4cb9889ab12c13852360fadf60f`를 사용한다 (대시보드 URL에 노출되는 공개값이라 저장소에 평문으로 둔다 — CI가 필요한 시크릿은 API 토큰 하나뿐).

**도메인 주의:** `dongwoobae.com`을 사려다 `dwoobae.com`을 등록했고 환불이 안 된다. 2027-07에 이전할 예정이므로 **사이트 URL을 코드에 하드코딩하지 않는다.** `NEXT_PUBLIC_SITE_URL`을 단일 출처로 쓰고, 도메인 교체가 환경변수와 `wrangler.jsonc` routes 수정만으로 끝나게 한다.

---

## 파일 구조

작업이 끝났을 때의 저장소 구조. 각 파일의 책임을 한 줄로 정의한다.

```text
portfolio/
  package.json                       # 의존성·스크립트
  tsconfig.json                      # TypeScript strict + @/* alias
  next.config.ts                     # standalone 출력, MDX, 보안 헤더, OpenNext dev 바인딩
  open-next.config.ts                # OpenNext Cloudflare 어댑터 설정
  wrangler.jsonc                     # Worker 이름·호환성 날짜·assets·커스텀 도메인 라우트
  postcss.config.mjs                 # Tailwind v4 PostCSS 플러그인
  eslint.config.mjs                  # ESLint flat config + 빌드 산출물 ignore
  .prettierrc                        # Prettier + tailwind 클래스 정렬
  vitest.config.ts                   # 단위 테스트 (node 환경, src/**/*.test.ts)
  playwright.config.ts               # E2E (chromium, dev 서버 자동 기동)
  mdx-components.tsx                 # MDX 전역 컴포넌트 매핑 (필수 파일)
  .gitignore
  .github/workflows/ci.yml           # lint → format → typecheck → test → e2e → build → deploy

  src/
    app/
      layout.tsx                     # 루트 레이아웃 — 폰트, 메타데이터, 헤더/푸터
      globals.css                    # Tailwind import + @theme 디자인 토큰
      page.tsx                       # 홈
      not-found.tsx                  # 404
      about/page.tsx                 # About — 타임라인 + 개발 철학
      projects/
        page.tsx                     # 프로젝트 목록 (착수 순)
        [slug]/page.tsx              # 케이스 스터디 상세 (정적 생성)
      sitemap.ts                     # 동적 sitemap
      robots.ts                      # robots.txt

    components/
      layout/
        SiteHeader.tsx               # 상단 내비게이션
        SiteFooter.tsx               # 푸터 (연락처 + CI/CD 어필 링크)
      project/
        ProjectCard.tsx              # 목록용 카드 (상태 배지 + 라이브/저장소 버튼)
        ProjectMetaBar.tsx           # 상세 상단 메타 + 링크 버튼
        StatusBadge.tsx              # 운영 중/진행 중/완료 배지
        Screenshot.tsx               # 케이스 스터디 본문용 캡처 + 캡션
      home/
        Hero.tsx                     # 포지셔닝 히어로 + 운영 중 서비스 라이브 링크
        DevMethod.tsx                # AI 활용 × 테스트·E2E 고정
        StackSummary.tsx             # 기술 스택 요약 (분야별 + 어디에 썼는지)
        GrowthNarrative.tsx          # 성장 서사 (CI 도입 시점 표)

    content/
      schema.ts                      # zod 스키마 + 타입 (ProjectMeta)
      projects/
        meta.ts                      # 전 프로젝트 메타 배열 (빌드타임 zod 검증)
        meta.test.ts                 # 스키마·정렬·slug 유일성 단위 테스트
        ycc-church.mdx               # 케이스 스터디 본문 — 영천중앙교회
        ankang-welfare.mdx           # 케이스 스터디 본문 — 안강 섬김

    lib/
      site.ts                        # 사이트 상수 (이름, URL, 연락처)
      projects.ts                    # 메타 조회 헬퍼 (정렬·featured·slug 조회)
      projects.test.ts               # 헬퍼 단위 테스트
      format.ts                      # 기간·상태 라벨 포맷터
      format.test.ts                 # 포맷터 단위 테스트

    types/
      mdx.d.ts                       # *.mdx 모듈 선언

  e2e/
    smoke.spec.ts                    # 전 페이지 렌더 + 링크 + 404 스모크

  public/
    screenshots/                     # 케이스 스터디용 서비스 캡처 (WebP)
```

**경계 설명:** `content/`는 "무엇을 보여줄 것인가"(데이터), `lib/`은 "어떻게 고를 것인가"(순수 함수), `components/`는 "어떻게 보일 것인가"(표현), `app/`은 조립만 담당한다. 메타데이터를 MDX frontmatter가 아니라 별도 TS 모듈에 두는 이유는 두 가지다 — (1) `@next/mdx`는 YAML frontmatter를 기본 지원하지 않고 ESM export로 대체해야 하는데, `*.mdx` 모듈 선언에 named export를 추가하면 `@types/mdx`의 선언과 충돌할 위험이 있다. (2) 목록 페이지가 MDX 컴파일 결과 전체를 import하지 않아도 된다.

---

# Phase 0 — 인프라 관통

## Task 1 (사용자): create-next-app 실행 — ✅ 완료 (2026-07-27)

- [x] **Step 1: 스캐폴드 생성** — 사용자가 `create-next-app`으로 생성했다 (next 16.2.12).
- [x] **Step 2: 구조 정리** — 스캐폴드가 `portfolio/portfolio/` 중첩 경로에 생성됐고 `--src-dir` 없이 만들어져, 저장소 루트로 승격하고 `app/` → `src/app/`으로 옮긴 뒤 `tsconfig.json`의 `paths`를 `"@/*": ["./src/*"]`로 바꿨다. 기본 SVG 자산도 제거했다. (커밋 `eaff5a3`)
- [x] **Step 3: 검증** — `npx tsc --noEmit`, `npm run lint` 통과.

**현재 상태:** 루트에 `.gitignore` `README.md` `eslint.config.mjs` `next.config.ts` `package.json` `postcss.config.mjs` `tsconfig.json` `public/` `src/app/{layout.tsx,page.tsx,globals.css,favicon.ico}` `docs/`. 의존성은 create-next-app 기본값(next·react·tailwind·eslint·typescript)만 설치돼 있다.

> **Task 2 실행자 주의:** 위 상태를 전제로 진행한다. `next.config.ts`는 아직 빈 설정이고, `package.json` scripts에는 `dev`/`build`/`start`/`lint`만 있다. next 버전이 계획에 적힌 16.2.10이 아니라 **16.2.12**이므로, 추가 의존성 설치 시 `@next/mdx`와 `eslint-config-next`도 **16.2.12에 맞춘다**.

---

## Task 2: 스캐폴드 정비 (의존성·설정·디자인 토큰)

create-next-app 결과물을 이 프로젝트의 요구에 맞게 조정한다. 버전은 4번 프로젝트에서 검증된 조합을 쓴다.

**Files:**
- Modify: `package.json`, `eslint.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `.prettierrc`
- Modify: `.gitignore`

- [ ] **Step 1: 현재 스캐폴드 상태 확인**

```bash
cat package.json
ls -a
```

create-next-app 버전에 따라 파일 구성이 다를 수 있다. 아래 스텝은 **이미 있는 것은 건너뛰고 없는 것만** 반영한다.

- [ ] **Step 2: 추가 의존성 설치**

`@next/mdx`는 설치된 next와 **같은 버전**으로 맞춘다 (현재 16.2.12).

```bash
npm install @mdx-js/loader @mdx-js/react @next/mdx@16.2.12 @opennextjs/cloudflare zod
npm install -D @cloudflare/workers-types @playwright/test @types/mdx prettier prettier-plugin-tailwindcss vitest wrangler
```

- [ ] **Step 3: package.json scripts 교체**

`scripts` 블록 전체를 아래로 바꾼다. create-next-app이 넣은 `dev`/`build`/`start`/`lint`는 유지하고 나머지를 추가하는 형태다.

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "build:worker": "next build --webpack && opennextjs-cloudflare build --skipNextBuild",
    "preview": "npm run build:worker && opennextjs-cloudflare preview",
    "deploy": "npm run build:worker && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  },
```

- [ ] **Step 4: Prettier 설정 생성**

`.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 5: ESLint에 빌드 산출물 ignore 추가**

`eslint.config.mjs`의 `globalIgnores` 목록(없으면 아래 형태로 새로 작성)에 OpenNext 산출물을 넣는다. 생성 코드라 린트 대상이 아니다.

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // OpenNext/Cloudflare 빌드 산출물 (생성 코드 — 린트 대상 아님)
    ".open-next/**",
    ".wrangler/**",
    "cloudflare-env.d.ts",
  ]),
]);

export default eslintConfig;
```

- [ ] **Step 6: .gitignore에 항목 추가**

기존 내용 끝에 아래를 덧붙인다 (중복은 무시해도 무방하다).

```gitignore
.next-e2e
.open-next
.wrangler
.dev.vars
cloudflare-env.d.ts
test-results
playwright-report
```

- [ ] **Step 7: 디자인 토큰과 전역 스타일 교체**

`src/app/globals.css` **전체를 아래로 교체**한다 (create-next-app이 넣은 기본 변수·다크모드 블록은 지운다). stone 계열 뉴트럴 + 인디고 액센트로, 다른 4개 프로젝트(네이비/블루/웜그린)와 겹치지 않게 고른 팔레트다. 다크 모드는 1차 범위 외.

```css
@import "tailwindcss";

@theme {
  --color-page: #fafaf9;
  --color-surface: #ffffff;
  --color-ink: #1c1917;
  --color-muted: #57534e;
  --color-faint: #a8a29e;
  --color-line: #e7e5e4;
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-accent-soft: #eef2ff;
  --color-live: #16a34a;
  --color-warn: #d97706;
}

@theme inline {
  --font-sans: var(--font-noto-sans-kr);
  --font-mono: var(--font-jetbrains-mono);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-page);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
}

/* 와이드 콘텐츠(표·코드·다이어그램)는 자체 스크롤 컨테이너를 갖는다.
   페이지 본문이 가로로 스크롤되면 안 된다. */
.prose-scroll {
  overflow-x: auto;
}
```

- [ ] **Step 8: 루트 레이아웃과 임시 홈 교체**

`src/app/layout.tsx` **전체 교체** (create-next-app의 Geist 폰트 설정을 대체한다):

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "배동우 | 백엔드 중심 풀스택 개발자",
  description:
    "실사용자가 있는 서비스를 수주부터 설계·개발·운영까지 혼자 책임지는 백엔드 중심 풀스택 개발자입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} ${jetbrainsMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
```

`src/app/page.tsx` **전체 교체** — 파이프라인 관통 확인용 임시 페이지다. Task 14에서 진짜 홈으로 바꾼다.

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold">배동우</h1>
      <p className="mt-4 text-muted">백엔드 중심 풀스택 개발자</p>
    </main>
  );
}
```

create-next-app이 만든 `public/*.svg`(next.svg, vercel.svg 등)는 쓰지 않으므로 삭제한다.

```bash
rm -f public/*.svg
```

- [ ] **Step 9: 개발 서버로 확인**

```bash
npm run dev
```

기대: `http://localhost:3000`에서 "배동우"가 보이고, 배경이 아이보리(`#fafaf9`)다. 확인 후 종료.

- [ ] **Step 10: 커밋**

```bash
npm run format
git add -A
git commit -m "chore: 의존성·설정 정비 및 디자인 토큰 적용"
```

---

## Task 3: OpenNext + Workers 설정

**Files:**
- Create: `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`

- [ ] **Step 1: next.config.ts 생성**

`output: "standalone"`과 `outputFileTracingRoot`는 OpenNext가 요구한다. 주석의 이유를 지우지 말 것 — 4번 프로젝트에서 실제로 겪은 함정이다.

```ts
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // MDX를 페이지·import 대상으로 인식시킨다.
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // OpenNext는 standalone 출력을 번들한다. 어댑터 자체 빌드를 쓰면 자동 주입되지만,
  // 우리는 `next build --webpack`으로 직접 빌드하고 `--skipNextBuild`로 번들하므로
  // standalone을 명시해야 한다.
  output: "standalone",
  // 워크스페이스 루트를 이 프로젝트로 고정한다. 그러지 않으면 Next가 상위 디렉터리의
  // lockfile을 보고 루트를 추론해, standalone 출력이 하위 경로로 밀려나 OpenNext가 찾지 못한다.
  outputFileTracingRoot: import.meta.dirname,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

// remark/rehype 플러그인은 추가하지 않는다. Turbopack(dev)은 함수형 플러그인 옵션을
// 직렬화하지 못해 dev/prod 동작이 갈린다. 메타데이터는 MDX frontmatter 대신
// src/content/projects/meta.ts에서 관리한다.
const withMDX = createMDX({});

export default withMDX(nextConfig);

// `next dev`에서 Cloudflare 바인딩을 사용할 수 있게 한다. 모듈 스코프에서 호출해야 한다.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

- [ ] **Step 2: open-next.config.ts 생성**

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 정적 콘텐츠만 서빙하므로 증분 캐시 오버라이드가 필요 없다.
// 온디맨드 재검증이 필요해지면 r2IncrementalCache를 추가하고 wrangler에 버킷을 연결한다.
export default defineCloudflareConfig({});
```

- [ ] **Step 3: wrangler.jsonc 생성**

커스텀 도메인 라우트는 zone이 활성화된 뒤에 넣는다. 지금은 주석으로 두고 Task 6에서 해제한다.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "dongwoobae-portfolio",
  // Account ID는 비밀이 아니다(대시보드 URL에 노출). 여기 두면 CI는
  // CLOUDFLARE_API_TOKEN 하나만 시크릿으로 필요하다.
  "account_id": "1dafd4cb9889ab12c13852360fadf60f",
  // @cloudflare/workers-types 4.20260702와 정합. 날짜를 올릴 때는 배포 전 preview로 회귀 확인.
  "compatibility_date": "2026-07-02",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS",
  },
  // next/image 최적화를 Workers에서 처리하려면 필요하다 (케이스 스터디 스크린샷에 사용).
  "images": {
    "binding": "IMAGES",
  },
  // 도메인 zone 활성화 후 주석 해제 (Task 5)
  // "routes": [
  //   { "pattern": "dwoobae.com", "custom_domain": true },
  //   { "pattern": "www.dwoobae.com", "custom_domain": true },
  // ],
}
```

- [ ] **Step 4: Workers 런타임에서 실제로 뜨는지 로컬 확인**

```bash
npm run preview
```

기대: 빌드가 끝나고 `http://localhost:8788`(또는 wrangler가 안내하는 포트)에서 홈이 렌더된다. **여기서 500이 나면 Turbopack 산출물 문제일 가능성이 높다** — `build:worker` 스크립트에 `--webpack`이 있는지 확인한다. 확인 후 종료한다.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: OpenNext + Cloudflare Workers 배포 설정"
```

---

## Task 4: 수동 배포로 파이프라인 관통

CI를 붙이기 전에 손으로 한 번 배포해 본다. 실패 지점을 CI 로그가 아니라 로컬 터미널에서 보기 위해서다.

**Files:** 없음 (배포 실행만)

- [ ] **Step 1: wrangler 로그인**

```bash
npx wrangler login
```

브라우저가 열리면 승인한다. 이미 로그인돼 있으면 그대로 진행한다.

- [ ] **Step 2: 배포**

```bash
npm run deploy
```

기대: `https://dongwoobae-portfolio.<계정서브도메인>.workers.dev` 형태의 URL이 출력된다.

- [ ] **Step 3: 배포된 사이트 확인**

출력된 URL을 열어 "배동우"가 보이는지 확인한다. 이 URL을 다음 단계에서 쓰므로 기록해 둔다.

- [ ] **Step 4: 커밋 (변경이 있으면)**

```bash
git status
# 변경 파일이 있으면
git add -A
git commit -m "chore: 첫 Workers 배포 확인"
```

---

## Task 5: GitHub Actions CI/CD

품질 게이트(test·e2e)는 아직 없으므로 이 단계에서는 lint·format·typecheck·build·deploy만 넣고, Task 7·8에서 test와 e2e 스텝을 추가한다.

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: 워크플로 작성**

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# 같은 ref에서 새 실행이 오면 진행 중이던 것 취소 (최신 커밋만)
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint · Typecheck · Build · Deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      # Next.js 증분 빌드 캐시(webpack) 재사용 → 반복 빌드 가속.
      - name: Cache Next.js build
        uses: actions/cache@v5
        with:
          path: .next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('src/**/*.{ts,tsx,mdx}') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-

      - name: Lint
        run: npm run lint

      - name: Format check (Prettier)
        run: npm run format:check

      - name: Typecheck
        run: npm run typecheck

      - name: Build worker (next build --webpack → OpenNext bundle)
        run: npm run build:worker

      # main push일 때만 배포. GitHub 러너가 빌드한 .open-next를 업로드만 한다.
      - name: Deploy to Cloudflare
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: npx opennextjs-cloudflare deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

- [ ] **Step 2: 로컬에서 CI 스텝을 미리 통과시킨다**

```bash
npm run lint
npm run format:check
npm run typecheck
```

기대: 모두 통과. `format:check`가 실패하면 `npm run format`으로 정리한 뒤 다시 실행한다.

- [ ] **Step 3: 커밋 & 푸시로 CI 동작 확인**

```bash
git add -A
git commit -m "ci: GitHub Actions로 Cloudflare Workers 자동 배포"
git push
```

- [ ] **Step 4: 워크플로 결과 확인**

```bash
gh run watch
```

기대: 전 스텝 통과 후 Deploy까지 성공. 실패하면 `gh run view --log-failed`로 원인을 확인하고 고친 뒤 다시 푸시한다.

---

## Task 6: 커스텀 도메인 연결

**사전 조건:** Cloudflare 대시보드에 `dwoobae.com` zone이 활성 상태여야 한다.

**Files:**
- Modify: `wrangler.jsonc` (routes 주석 해제)
- Create: `.env.example`

- [ ] **Step 1: wrangler.jsonc의 routes 주석 해제**

```jsonc
  "images": {
    "binding": "IMAGES",
  },
  "routes": [
    { "pattern": "dwoobae.com", "custom_domain": true },
    { "pattern": "www.dwoobae.com", "custom_domain": true },
  ],
}
```

- [ ] **Step 2: 사이트 URL 환경변수 예시 파일 생성**

`.env.example`:

```env
# 절대 URL 생성 기준 (sitemap, OG 이미지, JSON-LD)
NEXT_PUBLIC_SITE_URL=https://dwoobae.com
```

- [ ] **Step 3: 로컬 .env.local 생성**

```bash
cp .env.example .env.local
```

- [ ] **Step 4: 배포하고 도메인 확인**

```bash
npm run deploy
```

기대: `https://dwoobae.com`에서 홈이 보인다. DNS 전파에 몇 분 걸릴 수 있다. 502/525가 나면 대시보드 → Workers & Pages → 해당 Worker → Settings → Domains & Routes에서 도메인이 등록됐는지 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: dwoobae.com 커스텀 도메인 연결"
git push
```

---

# Phase 1 — 품질 게이트 선설치

콘텐츠가 0줄인 지금 테스트 인프라를 붙인다. 이 순서 자체가 포트폴리오의 주장("시작하는 날 검증 체계부터")을 `git log`로 증명한다.

## Task 7: Vitest + 첫 단위 테스트

포맷터를 TDD로 만들면서 테스트 인프라를 검증한다.

**Files:**
- Create: `vitest.config.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: vitest.config.ts 생성**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatPeriod, statusLabel } from "@/lib/format";

describe("formatPeriod", () => {
  it("종료일이 없으면 진행 중 표기로 연다", () => {
    expect(formatPeriod({ start: "2026.04" })).toBe("2026.04 ~ 진행 중");
  });

  it("종료일이 있으면 구간으로 표기한다", () => {
    expect(formatPeriod({ start: "2026.06", end: "2026.07" })).toBe("2026.06 ~ 2026.07");
  });

  it("비고가 있으면 괄호로 덧붙인다", () => {
    expect(
      formatPeriod({ start: "2026.06", end: "2026.07", note: "이후 유지보수" }),
    ).toBe("2026.06 ~ 2026.07 (이후 유지보수)");
  });

  it("종료일 없이 비고만 있어도 붙는다", () => {
    expect(formatPeriod({ start: "2026.07", note: "고객 자료 대기" })).toBe(
      "2026.07 ~ 진행 중 (고객 자료 대기)",
    );
  });
});

describe("statusLabel", () => {
  it("상태 코드를 한국어 라벨로 바꾼다", () => {
    expect(statusLabel("operating")).toBe("운영 중");
    expect(statusLabel("in-progress")).toBe("진행 중");
    expect(statusLabel("completed")).toBe("완료");
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

```bash
npm test
```

기대: FAIL — `Cannot find module '@/lib/format'`

- [ ] **Step 4: 스키마 타입 정의 (format.ts가 참조한다)**

`src/content/schema.ts`:

```ts
import { z } from "zod";

export const projectStatusSchema = z.enum(["operating", "in-progress", "completed"]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectMetaSchema = z.object({
  // URL slug — 같은 이름의 MDX 파일이 src/content/projects/에 있어야 한다.
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug는 소문자·숫자·하이픈만 사용한다"),
  // 착수 순서. 성장 서사가 이 순서에 의존하므로 중복되면 빌드를 깬다.
  order: z.number().int().positive(),
  title: z.string().min(1),
  // 목록 카드 한 줄 요약
  summary: z.string().min(1),
  periodStart: z.string().regex(/^\d{4}\.\d{2}$/, "YYYY.MM 형식"),
  periodEnd: z
    .string()
    .regex(/^\d{4}\.\d{2}$/, "YYYY.MM 형식")
    .optional(),
  periodNote: z.string().optional(),
  status: projectStatusSchema,
  role: z.string().min(1),
  stack: z.array(z.string()).min(1),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  commits: z.number().int().nonnegative().optional(),
  // 홈에 노출할 대표 케이스 스터디 여부
  featured: z.boolean(),
  // 케이스 스터디 본문이 준비된 프로젝트만 상세 페이지를 생성한다.
  hasCaseStudy: z.boolean(),
});

export type ProjectMeta = z.infer<typeof projectMetaSchema>;
```

- [ ] **Step 5: 최소 구현 작성**

`src/lib/format.ts`:

```ts
import type { ProjectStatus } from "@/content/schema";

export type PeriodInput = {
  start: string;
  end?: string;
  note?: string;
};

export function formatPeriod({ start, end, note }: PeriodInput): string {
  const base = `${start} ~ ${end ?? "진행 중"}`;
  return note ? `${base} (${note})` : base;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  operating: "운영 중",
  "in-progress": "진행 중",
  completed: "완료",
};

export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status];
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
npm test
```

기대: PASS (6 tests)

- [ ] **Step 7: CI에 테스트 스텝 추가**

`.github/workflows/ci.yml`의 Typecheck 스텝 **뒤에** 삽입:

```yaml
      - name: Test (vitest)
        run: npm test
```

- [ ] **Step 8: 커밋**

```bash
npm run format
git add -A
git commit -m "test: Vitest 도입 + 기간·상태 포맷터 (TDD)"
```

---

## Task 8: Playwright 스모크 E2E

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`
- Modify: `.github/workflows/ci.yml`, `.gitignore`

- [ ] **Step 1: Playwright 브라우저 설치**

```bash
npx playwright install --with-deps chromium
```

- [ ] **Step 2: playwright.config.ts 생성**

E2E 전용 dist 디렉터리를 써서 개발 중인 `next dev`와 빌드 산출물이 충돌하지 않게 한다.

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_DIST_DIR: ".next-e2e" },
  },
});
```

- [ ] **Step 3: next.config.ts에 distDir 분기 추가**

`nextConfig` 객체의 `pageExtensions` 바로 아래에 추가:

```ts
  // E2E는 별도 dist를 써서 개발 중인 next dev와 빌드 산출물이 충돌하지 않게 한다.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
```

- [ ] **Step 4: 실패하는 스모크 테스트 작성**

`e2e/smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("홈에 이름과 포지셔닝이 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("배동우");
});

test("없는 경로는 404를 반환한다", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
});
```

- [ ] **Step 5: 테스트 실행 — 404 테스트가 실패하는지 확인**

```bash
npm run e2e
```

기대: 홈 테스트는 PASS, 404 테스트는 FAIL (기본 Next 404가 200을 주지는 않으므로 통과할 수도 있다. 통과하면 Step 6은 건너뛰고 Step 7로 간다).

- [ ] **Step 6: 커스텀 404 페이지 작성**

`src/app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6">
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="mt-2 text-3xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-4 text-muted">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <Link href="/" className="mt-8 text-accent hover:text-accent-hover">
        홈으로 돌아가기 →
      </Link>
    </main>
  );
}
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
npm run e2e
```

기대: PASS (2 tests)

- [ ] **Step 8: CI에 E2E 스텝 추가**

`.github/workflows/ci.yml`의 Test 스텝 **뒤에** 삽입:

```yaml
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E (playwright)
        run: npm run e2e

      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: test-results/
          retention-days: 7
```

- [ ] **Step 9: 커밋 & 푸시**

```bash
npm run format
git add -A
git commit -m "test: Playwright 스모크 E2E + 커스텀 404"
git push
```

- [ ] **Step 10: CI 통과 확인**

```bash
gh run watch
```

기대: lint·format·typecheck·test·e2e·build·deploy 전부 성공.

---

# Phase 2 — 콘텐츠 파이프라인

## Task 9: MDX 설정과 타입 선언

**Files:**
- Create: `mdx-components.tsx`, `src/types/mdx.d.ts`

- [ ] **Step 1: mdx-components.tsx 생성**

App Router에서 `@next/mdx`를 쓰려면 **프로젝트 루트에 반드시** 있어야 하는 파일이다. Next 16에서 `useMDXComponents`는 **인자를 받지 않는다**(구버전과 다름).

```tsx
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: (props) => (
    <h2 className="mt-12 border-t border-line pt-8 text-2xl font-bold" {...props} />
  ),
  h3: (props) => <h3 className="mt-8 text-lg font-bold" {...props} />,
  p: (props) => <p className="mt-4 leading-relaxed text-muted" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-2 pl-5 text-muted" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a className="text-accent underline underline-offset-2 hover:text-accent-hover" {...props} />
  ),
  strong: (props) => <strong className="font-bold text-ink" {...props} />,
  code: (props) => (
    <code className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[0.9em]" {...props} />
  ),
  pre: (props) => (
    <pre
      className="prose-scroll mt-6 rounded-lg bg-ink p-4 font-mono text-sm text-page"
      {...props}
    />
  ),
  table: (props) => (
    <div className="prose-scroll mt-6">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border-b border-line px-3 py-2 text-left font-bold" {...props} />
  ),
  td: (props) => <td className="border-b border-line px-3 py-2 text-muted" {...props} />,
  blockquote: (props) => (
    <blockquote className="mt-6 border-l-2 border-accent pl-4 text-muted italic" {...props} />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
```

- [ ] **Step 2: MDX 모듈 타입 선언**

`src/types/mdx.d.ts` — `@types/mdx`가 `*.mdx`의 default export를 선언하므로 여기서는 중복 선언하지 않는다. 이 파일은 향후 확장 지점으로 두되, 지금은 `mdx/types`가 프로젝트에 로드되도록 참조만 남긴다.

```ts
/// <reference types="mdx" />
```

- [ ] **Step 3: 타입체크 통과 확인**

```bash
npm run typecheck
```

기대: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: MDX 렌더링 설정 (@next/mdx + 컴포넌트 매핑)"
```

---

## Task 10: 프로젝트 메타 레지스트리 (TDD)

**Files:**
- Create: `src/content/projects/meta.ts`, `src/content/projects/meta.test.ts`
- Create: `src/lib/projects.ts`, `src/lib/projects.test.ts`

- [ ] **Step 1: 메타 검증 테스트 작성**

`src/content/projects/meta.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects/meta";

describe("프로젝트 메타", () => {
  it("5개 프로젝트가 등록되어 있다", () => {
    expect(projects).toHaveLength(5);
  });

  it("slug가 유일하다", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("착수 순서(order)가 유일하다", () => {
    const orders = projects.map((p) => p.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("케이스 스터디가 있는 프로젝트는 라이브 또는 저장소 링크를 갖는다", () => {
    for (const project of projects.filter((p) => p.hasCaseStudy)) {
      expect(project.liveUrl ?? project.repoUrl).toBeDefined();
    }
  });

  it("1차 릴리스에서는 케이스 스터디 2편만 공개한다", () => {
    expect(projects.filter((p) => p.hasCaseStudy)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

기대: FAIL — `Cannot find module '@/content/projects/meta'`

- [ ] **Step 3: 메타 레지스트리 작성**

`src/content/projects/meta.ts` — 모듈 로드 시점에 zod가 검증하므로, 형식이 틀리면 **빌드가 깨진다**. 그게 의도다.

```ts
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
    stack: ["Next.js", "TypeScript", "Supabase", "Cloudflare R2", "Sharp", "face-api.js"],
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
    stack: ["Next.js", "TypeScript", "Neon", "Drizzle", "Better Auth", "QStash", "Gemini"],
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
    stack: ["Next.js", "TypeScript", "Cloudflare Workers", "D1", "R2", "Drizzle"],
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

기대: PASS (11 tests — format 6 + meta 5)

- [ ] **Step 5: 조회 헬퍼 테스트 작성**

`src/lib/projects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getCaseStudyProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjectsInOrder,
} from "@/lib/projects";

describe("getProjectsInOrder", () => {
  it("착수 순으로 정렬한다", () => {
    const orders = getProjectsInOrder().map((p) => p.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("getFeaturedProjects", () => {
  it("홈에 노출할 대표 프로젝트만 반환한다", () => {
    const featured = getFeaturedProjects();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((p) => p.featured)).toBe(true);
  });
});

describe("getCaseStudyProjects", () => {
  it("본문이 준비된 프로젝트만 반환한다", () => {
    expect(getCaseStudyProjects().every((p) => p.hasCaseStudy)).toBe(true);
  });
});

describe("getProjectBySlug", () => {
  it("존재하는 slug를 찾는다", () => {
    expect(getProjectBySlug("ycc-church")?.title).toContain("영천중앙교회");
  });

  it("없는 slug는 undefined를 반환한다", () => {
    expect(getProjectBySlug("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
npm test
```

기대: FAIL — `Cannot find module '@/lib/projects'`

- [ ] **Step 7: 헬퍼 구현**

`src/lib/projects.ts`:

```ts
import { projects } from "@/content/projects/meta";
import type { ProjectMeta } from "@/content/schema";

export function getProjectsInOrder(): ProjectMeta[] {
  return [...projects].sort((a, b) => a.order - b.order);
}

export function getFeaturedProjects(): ProjectMeta[] {
  return getProjectsInOrder().filter((project) => project.featured);
}

export function getCaseStudyProjects(): ProjectMeta[] {
  return getProjectsInOrder().filter((project) => project.hasCaseStudy);
}

export function getProjectBySlug(slug: string): ProjectMeta | undefined {
  return projects.find((project) => project.slug === slug);
}
```

- [ ] **Step 8: 테스트 통과 확인**

```bash
npm test
```

기대: PASS (16 tests)

- [ ] **Step 9: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: 프로젝트 메타 레지스트리 + zod 빌드타임 검증 (TDD)"
```

---

# Phase 3 — 페이지

## Task 11: 레이아웃 (헤더·푸터)

**Files:**
- Create: `src/lib/site.ts`, `src/components/layout/SiteHeader.tsx`, `src/components/layout/SiteFooter.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 사이트 상수 정의**

`src/lib/site.ts`:

```ts
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
```

- [ ] **Step 2: 헤더 작성**

`src/components/layout/SiteHeader.tsx`:

```tsx
import Link from "next/link";
import { navItems, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link href="/" className="font-bold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="주요 메뉴">
          <ul className="flex gap-6 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: 푸터 작성**

이 사이트의 CI/CD 워크플로를 직접 링크해 "이 사이트도 같은 방식으로 배포됩니다"를 증거로 보여준다.

```tsx
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-muted">
        <p className="font-bold text-ink">{site.name}</p>
        <p className="mt-2">{site.role}</p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href={`mailto:${site.email}`} className="hover:text-ink">
              {site.email}
            </a>
          </li>
          <li>
            <a href={site.github} className="hover:text-ink">
              GitHub
            </a>
          </li>
        </ul>
        <p className="mt-8 text-xs text-faint">
          이 사이트는 Next.js를 OpenNext로 번들해 Cloudflare Workers에 배포합니다.{" "}
          <a
            href={`${site.repoUrl}/blob/main/.github/workflows/ci.yml`}
            className="underline underline-offset-2 hover:text-muted"
          >
            배포 파이프라인 보기
          </a>
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: 루트 레이아웃에 조립**

`src/app/layout.tsx`의 `<body>` 내용을 교체:

```tsx
      <body className={`${notoSansKr.variable} ${jetbrainsMono.variable} font-sans`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-page"
        >
          본문 바로가기
        </a>
        <SiteHeader />
        <div id="main">{children}</div>
        <SiteFooter />
      </body>
```

파일 상단에 import 추가:

```tsx
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
```

- [ ] **Step 5: 확인**

```bash
npm run dev
```

기대: 헤더·푸터가 보이고 Tab 키를 누르면 "본문 바로가기"가 나타난다. 확인 후 종료.

- [ ] **Step 6: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: 사이트 레이아웃 (헤더·푸터·본문 바로가기)"
```

---

## Task 12: 프로젝트 목록 페이지

**Files:**
- Create: `src/components/project/StatusBadge.tsx`, `src/components/project/ProjectCard.tsx`, `src/app/projects/page.tsx`
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: 상태 배지 컴포넌트**

`src/components/project/StatusBadge.tsx`:

```tsx
import type { ProjectStatus } from "@/content/schema";
import { statusLabel } from "@/lib/format";

const STYLES: Record<ProjectStatus, string> = {
  operating: "bg-live/10 text-live",
  "in-progress": "bg-warn/10 text-warn",
  completed: "bg-line text-muted",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
```

- [ ] **Step 2: 프로젝트 카드 컴포넌트**

라이브·저장소 링크 버튼을 카드에 고정한다 (스펙 §4의 요구사항).

`src/components/project/ProjectCard.tsx`:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/project/StatusBadge";
import type { ProjectMeta } from "@/content/schema";
import { formatPeriod } from "@/lib/format";

export function ProjectCard({ project }: { project: ProjectMeta }) {
  const period = formatPeriod({
    start: project.periodStart,
    end: project.periodEnd,
    note: project.periodNote,
  });

  return (
    <article className="rounded-lg border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={project.status} />
        <span className="font-mono text-xs text-faint">{period}</span>
      </div>

      <h2 className="mt-3 text-lg font-bold">
        {project.hasCaseStudy ? (
          <Link href={`/projects/${project.slug}`} className="hover:text-accent">
            {project.title}
          </Link>
        ) : (
          project.title
        )}
      </h2>

      <p className="mt-2 leading-relaxed text-muted">{project.summary}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        {project.hasCaseStudy && (
          <Link
            href={`/projects/${project.slug}`}
            className="font-bold text-accent hover:text-accent-hover"
          >
            케이스 스터디 →
          </Link>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            className="text-muted hover:text-ink"
            rel="noreferrer"
            target="_blank"
          >
            라이브 ↗
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            className="text-muted hover:text-ink"
            rel="noreferrer"
            target="_blank"
          >
            저장소 ↗
          </a>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: 목록 페이지 작성**

`src/app/projects/page.tsx`:

```tsx
import type { Metadata } from "next";
import { ProjectCard } from "@/components/project/ProjectCard";
import { getProjectsInOrder } from "@/lib/projects";

export const metadata: Metadata = {
  title: "프로젝트",
  description:
    "실제 의뢰를 받아 설계·개발·운영한 서비스들. 착수 순으로 정렬했습니다.",
};

export default function ProjectsPage() {
  const projects = getProjectsInOrder();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">프로젝트</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        실제 의뢰를 받아 설계·개발·운영한 서비스들입니다. 앞 프로젝트에서 부족했던 것을 다음
        프로젝트에서 고쳐온 순서라, 착수 순으로 정렬했습니다.
      </p>

      <div className="mt-12 space-y-6">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: E2E 테스트 추가**

`e2e/smoke.spec.ts` 끝에 추가:

```ts
test("프로젝트 목록에 5개 프로젝트가 착수 순으로 보인다", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("프로젝트");
  await expect(page.locator("article")).toHaveCount(5);
  await expect(page.locator("article").first()).toContainText("모두의 캠퍼스");
});
```

- [ ] **Step 5: 테스트 실행**

```bash
npm run e2e
```

기대: PASS (3 tests)

- [ ] **Step 6: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: 프로젝트 목록 페이지 (착수 순 정렬 + 라이브/저장소 링크)"
```

---

## Task 13: 케이스 스터디 상세 라우트

본문 MDX는 Task 15에서 쓴다. 여기서는 라우트와 메타 바만 만들고, 최소 MDX 2개로 동작을 확인한다.

**Files:**
- Create: `src/components/project/ProjectMetaBar.tsx`, `src/app/projects/[slug]/page.tsx`
- Create: `src/content/projects/ycc-church.mdx`, `src/content/projects/ankang-welfare.mdx`
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: 메타 바 컴포넌트**

`src/components/project/ProjectMetaBar.tsx`:

```tsx
import { StatusBadge } from "@/components/project/StatusBadge";
import type { ProjectMeta } from "@/content/schema";
import { formatPeriod } from "@/lib/format";

export function ProjectMetaBar({ project }: { project: ProjectMeta }) {
  const period = formatPeriod({
    start: project.periodStart,
    end: project.periodEnd,
    note: project.periodNote,
  });

  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-bold text-faint">기간</dt>
          <dd className="mt-1 font-mono text-sm">{period}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-faint">역할</dt>
          <dd className="mt-1 text-sm">{project.role}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-faint">커밋</dt>
          <dd className="mt-1 font-mono text-sm">
            {project.commits !== undefined ? `${project.commits}건` : "—"}
          </dd>
        </div>
      </dl>

      <ul className="mt-5 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            className="rounded bg-accent px-4 py-2 text-sm font-bold text-page hover:bg-accent-hover"
            rel="noreferrer"
            target="_blank"
          >
            라이브 사이트 보기 ↗
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            className="rounded border border-line px-4 py-2 text-sm font-bold hover:border-ink"
            rel="noreferrer"
            target="_blank"
          >
            저장소 ↗
          </a>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 최소 MDX 본문 2개 생성**

`src/content/projects/ycc-church.mdx`:

```mdx
## 배경

교회 홈페이지 제작 의뢰를 받았습니다. 본문은 Task 15에서 작성합니다.
```

`src/content/projects/ankang-welfare.mdx`:

```mdx
## 배경

노인복지센터 홈페이지 제작 의뢰를 받았습니다. 본문은 Task 15에서 작성합니다.
```

- [ ] **Step 3: 상세 라우트 작성**

`generateStaticParams` + `dynamicParams = false`로 정적 생성한다. Next 16에서 `params`는 **Promise**다.

`src/app/projects/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectMetaBar } from "@/components/project/ProjectMetaBar";
import { getCaseStudyProjects, getProjectBySlug } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCaseStudyProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !project.hasCaseStudy) notFound();

  const { default: Body } = await import(`@/content/projects/${slug}.mdx`);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-4 leading-relaxed text-muted">{project.summary}</p>

      <div className="mt-8">
        <ProjectMetaBar project={project} />
      </div>

      <article className="mt-12">
        <Body />
      </article>
    </main>
  );
}
```

- [ ] **Step 4: E2E 테스트 추가**

`e2e/smoke.spec.ts` 끝에 추가:

```ts
test("케이스 스터디 상세가 메타와 본문을 보여준다", async ({ page }) => {
  await page.goto("/projects/ycc-church");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("영천중앙교회");
  await expect(page.getByRole("link", { name: /라이브 사이트 보기/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "배경" })).toBeVisible();
});

test("케이스 스터디가 없는 프로젝트는 404다", async ({ page }) => {
  const response = await page.goto("/projects/herbal-medicine-platform");
  expect(response?.status()).toBe(404);
});
```

- [ ] **Step 5: 테스트 실행**

```bash
npm run e2e
```

기대: PASS (5 tests)

- [ ] **Step 6: 프로덕션 빌드로 MDX 동적 import 확인**

동적 import는 dev에서 통과해도 빌드에서 깨질 수 있다. 여기서 반드시 확인한다.

```bash
npm run build:worker
```

기대: 빌드 성공. `/projects/ycc-church`, `/projects/ankang-welfare`가 정적 생성 목록에 나온다.

- [ ] **Step 7: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: 케이스 스터디 상세 라우트 (정적 생성 + MDX 동적 import)"
```

---

## Task 14: 홈

**Files:**
- Create: `src/components/home/Hero.tsx`, `src/components/home/DevMethod.tsx`, `src/components/home/GrowthNarrative.tsx`
- Modify: `src/app/page.tsx`, `e2e/smoke.spec.ts`

- [ ] **Step 1: 히어로 작성**

`src/components/home/Hero.tsx`:

```tsx
import Link from "next/link";
import { getProjectsInOrder } from "@/lib/projects";
import { site } from "@/lib/site";

export function Hero() {
  const operating = getProjectsInOrder().filter((p) => p.status === "operating");

  return (
    <section className="border-b border-line py-20">
      <p className="font-mono text-sm text-accent">{site.role}</p>
      <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
        {site.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        {site.tagline} 기획부터 인프라 운영까지 혼자 맡았고, 프론트엔드도 직접 구현합니다.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {operating.map((project) => (
          <a
            key={project.slug}
            href={project.liveUrl}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-ink"
            rel="noreferrer"
            target="_blank"
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-live"
            />
            {project.title.replace(" 홈페이지", "")} 운영 중 ↗
          </a>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/projects" className="font-bold text-accent hover:text-accent-hover">
          프로젝트 전체 보기 →
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 개발 방식 섹션 작성**

`src/components/home/DevMethod.tsx`:

```tsx
export function DevMethod() {
  return (
    <section className="border-b border-line py-16">
      <h2 className="text-2xl font-bold">AI로 빠르게, 테스트로 확실하게</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Claude Code 같은 AI 도구를 적극적으로 씁니다. 코드가 빨리 나올수록 중요한 건 &ldquo;무엇을
        왜 만드는가&rdquo;와 &ldquo;원하는 동작이 유지되는가&rdquo;라고 생각합니다. 그래서 원하는
        동작을 단위 테스트와 E2E로 고정하고, CI 게이트를 통과해야만 배포되게 만듭니다.
      </p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-5">
          <dt className="text-sm font-bold">동작 고정</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            Vitest 단위 테스트와 PGlite 인프로세스 DB 통합 테스트로 파이프라인 로직을 검증합니다.
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <dt className="text-sm font-bold">회귀 방지</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            Playwright E2E로 관리자 업로드·인증 같은 핵심 흐름을 브라우저에서 반복 검증합니다.
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-surface p-5">
          <dt className="text-sm font-bold">배포 게이트</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            GitHub Actions가 lint·타입체크·테스트를 모두 통과해야 배포합니다. 이 사이트도
            같습니다.
          </dd>
        </div>
      </dl>
    </section>
  );
}
```

- [ ] **Step 3: 성장 서사 섹션 작성**

`src/components/home/GrowthNarrative.tsx`:

```tsx
const MILESTONES = [
  { project: "모두의 캠퍼스", start: "2026.04", daysToCi: 87 },
  { project: "안강 섬김", start: "2026.05", daysToCi: 73 },
  { project: "영천중앙교회", start: "2026.06", daysToCi: 16 },
  { project: "특장차 제작업체", start: "2026.07", daysToCi: 0 },
];

export function GrowthNarrative() {
  return (
    <section className="border-b border-line py-16">
      <h2 className="text-2xl font-bold">진행하면서 배운 것</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        처음부터 잘한 건 아닙니다. 첫 프로젝트는 CI를 붙이는 데 석 달이 걸렸고, 그동안 무엇이
        깨지는지 모른 채 고쳤습니다. 프로젝트를 거듭할수록 검증 체계를 먼저 세우게 됐고, 네 번째
        프로젝트는 <strong className="font-bold text-ink">시작하는 날 CI부터</strong> 만들었습니다.
      </p>

      <div className="prose-scroll mt-8">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">프로젝트별 CI 도입까지 걸린 기간</caption>
          <thead>
            <tr>
              <th className="border-b border-line px-3 py-2 text-left font-bold">프로젝트</th>
              <th className="border-b border-line px-3 py-2 text-left font-bold">착수</th>
              <th className="border-b border-line px-3 py-2 text-right font-bold">
                CI 구축까지
              </th>
            </tr>
          </thead>
          <tbody>
            {MILESTONES.map((milestone) => (
              <tr key={milestone.project}>
                <td className="border-b border-line px-3 py-2">{milestone.project}</td>
                <td className="border-b border-line px-3 py-2 font-mono text-muted">
                  {milestone.start}
                </td>
                <td className="border-b border-line px-3 py-2 text-right font-mono">
                  {milestone.daysToCi === 0 ? (
                    <strong className="font-bold text-accent">당일</strong>
                  ) : (
                    `${milestone.daysToCi}일`
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 기술 스택 요약 섹션 작성**

백엔드 포트폴리오는 기술 스택을 초반에 배치하는 것이 관례다. 나열에 그치지 않고 어디에 썼는지를 함께 적는다.

`src/components/home/StackSummary.tsx`:

```tsx
const STACK_GROUPS = [
  {
    label: "백엔드",
    items: "Java · Spring Boot · NestJS · Node.js · Next.js Server Actions",
    note: "인증·권한, 파이프라인, 동시성 제어를 주로 맡습니다.",
  },
  {
    label: "데이터",
    items: "PostgreSQL · MySQL · Neon · Supabase · Cloudflare D1 · Drizzle ORM",
    note: "BaaS 의존에서 스키마·마이그레이션 직접 관리로 옮겨왔습니다.",
  },
  {
    label: "프론트엔드",
    items: "TypeScript · React · Next.js App Router · Tailwind CSS",
    note: "운영 중인 서비스의 UI를 전부 직접 구현했습니다.",
  },
  {
    label: "인프라 · 운영",
    items: "Cloudflare Workers · R2 · Vercel · Docker · GitHub Actions",
    note: "배포 파이프라인과 크론·큐 운영까지 직접 맡습니다.",
  },
];

export function StackSummary() {
  return (
    <section className="border-b border-line py-16">
      <h2 className="text-2xl font-bold">기술 스택</h2>
      <dl className="mt-8 space-y-6">
        {STACK_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <dt className="text-sm font-bold sm:w-28 sm:shrink-0">{group.label}</dt>
            <dd>
              <p className="font-mono text-sm text-ink">{group.items}</p>
              <p className="mt-1 text-sm text-muted">{group.note}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 5: 홈 페이지 조립**

`src/app/page.tsx` 전체 교체:

```tsx
import { DevMethod } from "@/components/home/DevMethod";
import { GrowthNarrative } from "@/components/home/GrowthNarrative";
import { Hero } from "@/components/home/Hero";
import { StackSummary } from "@/components/home/StackSummary";
import { ProjectCard } from "@/components/project/ProjectCard";
import { getFeaturedProjects } from "@/lib/projects";

export default function HomePage() {
  const featured = getFeaturedProjects();

  return (
    <main className="mx-auto max-w-4xl px-6">
      <Hero />
      <DevMethod />
      <StackSummary />
      <GrowthNarrative />

      <section className="py-16">
        <h2 className="text-2xl font-bold">대표 케이스 스터디</h2>
        <div className="mt-8 space-y-6">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: E2E 테스트 갱신**

`e2e/smoke.spec.ts`의 첫 번째 테스트를 교체:

```ts
test("홈에 이름·개발 방식·기술 스택·성장 서사·대표 케이스가 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("배동우");
  await expect(page.getByRole("heading", { name: /AI로 빠르게/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "기술 스택" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "진행하면서 배운 것" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "대표 케이스 스터디" })).toBeVisible();
  await expect(page.getByRole("link", { name: /운영 중/ })).toHaveCount(2);
});
```

- [ ] **Step 7: 테스트 실행**

```bash
npm run e2e
```

기대: PASS (5 tests)

- [ ] **Step 8: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: 홈 (히어로·개발 방식·기술 스택·성장 서사·대표 케이스)"
```

---

## Task 15: 케이스 스터디 본문 2편

스펙 §4의 12단계 템플릿을 따른다. 소재는 각 저장소 README와 `git log --grep="^fix"`에서 가져온다.

**Files:**
- Modify: `src/content/projects/ycc-church.mdx`, `src/content/projects/ankang-welfare.mdx`
- Create: `public/screenshots/*.webp`, `src/components/project/Screenshot.tsx`

- [ ] **Step 1: 소재 수집**

아래를 모두 읽고 본문에 쓸 사실을 정리한다. **README와 커밋에 없는 내용은 쓰지 않는다.**

```bash
git -C ../ycc-website log --oneline --no-merges --grep="^fix" | head -30
git -C ../ankang-sumgim log --oneline --no-merges --grep="^fix" | head -30
```

- `../ycc-website/README.md` — "핵심 성과", "기술 하이라이트"(설교 자동 동기화 파이프라인 / AI 썸네일 / HWP 파싱), "테스트 범위"
- `../ankang-sumgim/README.md` — "핵심 성과", "Cloudflare R2 / 이미지 처리", "스팸·개인정보 보호", "테스트 범위"

- [ ] **Step 2: 스크린샷 컴포넌트 작성**

`src/components/project/Screenshot.tsx`:

```tsx
import Image from "next/image";

export function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="mt-8">
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={800}
        className="rounded-lg border border-line"
      />
      <figcaption className="mt-2 text-sm text-faint">{caption}</figcaption>
    </figure>
  );
}
```

MDX에서 쓸 수 있도록 `mdx-components.tsx`의 `components` 객체에 등록한다:

```tsx
import { Screenshot } from "@/components/project/Screenshot";

const components: MDXComponents = {
  Screenshot,
  // ...기존 매핑 유지
```

- [ ] **Step 3: 스크린샷 촬영**

각 라이브 사이트에서 핵심 화면 2~3장을 캡처해 `public/screenshots/`에 저장한다. 폭 1280px, WebP로 저장한다.

- `ycc-sermon-detail.webp` — 설교 상세 (AI 요약·챕터가 보이는 화면)
- `ycc-admin-thumbnail.webp` — 관리자 썸네일 생성 (SSE 진행 표시)
- `ankang-photo-board.webp` — 사진 게시판 (얼굴 블러 적용 결과)
- `ankang-admin-blur.webp` — 관리자 수동 블러 편집 화면

**주의:** 안강 사진 게시판 캡처는 실제 이용자 사진이므로 블러가 적용된 공개본만 쓰고, 얼굴이 식별되지 않는지 확인한다.

- [ ] **Step 4: 영천중앙교회 본문 작성**

`src/content/projects/ycc-church.mdx`. 아래 절 구성과 각 절에 반드시 포함할 사실을 지킨다.

| 절 (h2) | 반드시 포함할 사실 |
| --- | --- |
| 배경 | 영천중앙교회 공식 홈페이지 의뢰. 1인 전과정 수행 |
| 문제 | ① 새 설교 영상이 올라와도 운영자가 손으로 등록해야 했다 ② 주보가 HWP 첨부라 모바일에서 열어보기 어려웠다 ③ 유튜브 원본 썸네일이 목사님 정면 1프레임이라 목록이 구분되지 않았다 |
| 아키텍처 | README "설교 자동 동기화 & AI 요약 파이프라인"의 텍스트 다이어그램을 코드 블록으로 옮긴다 |
| 파이프라인 설계 | `ingest-video → fetch-transcript → summarize`를 독립 서버리스 함수로 분리하고 QStash 메시지로 연결한 이유. 전 엔드포인트가 QStash `Receiver` 서명 검증을 거친다는 점 |
| 설계 결정 | 세 개를 "선택지 → 선택 → 트레이드오프" 형식으로: ① 폴링 대신 WebSub 푸시(구독 lease 갱신 cron과 정합성 백필이 추가되지만 평소 쿼터·호출이 0) ② 프로세스 sleep 대신 QStash 지연 발행(`5 × 3ⁿ분`, `attempts < 3`) ③ Postgres CTE `UPDATE ... RETURNING`으로 원자적 claim(중복 요약 방지, pending 10분 초과 시 회수) |
| 실전 제약과 대응 | 유튜브 채널이 담당 권사님 **개인 Google 계정**이라 공유를 받을 수 없었다 → 공식 YouTube Data API(OAuth 소유자 인증 필요)를 쓸 수 없어 크롤링 기반 RapidAPI yt-api로 전환. 그 결과 쿼터·안정성 제약이 생겼고 정합성 cron으로 보완했다 |
| 트러블슈팅 기록 | 두 건을 "증상 → 원인 → 수정" 형식으로: ① HWP 인라인 컨트롤 ID가 본문에 섞여 나옴(`d8b4625`) ② 설교 등록이 채널 목록 조회에 의존해 실패 → `video/info` 단건 조회로 전환(`d7588c4`) |
| 프론트 구현 하이라이트 | ① 썸네일 생성·채널 동기화 진행 상황 SSE 실시간 스트리밍 UI ② 설교 요약 글자 크기 3단계 조절(고령 성도 가독성) |
| 실제 화면 | `<Screenshot />` 2장 (설교 상세, 관리자 썸네일 생성) |
| 운영에서 배운 것 | Vitest + PGlite 통합 테스트 + Playwright E2E를 착수 14~20일 만에 붙였다는 사실과, 그 경험이 다음 프로젝트에서 "첫날 CI"로 이어졌다는 연결 |

- [ ] **Step 5: 안강 섬김 본문 작성**

`src/content/projects/ankang-welfare.mdx`. 같은 절 구성을 지킨다.

| 절 (h2) | 반드시 포함할 사실 |
| --- | --- |
| 배경 | 안강 섬김 노인복지센터 공식 홈페이지 + 운영자 CMS 의뢰. 1인 전과정 |
| 문제 | ① 보호자·어르신이 장기요양 등급·본인부담금을 이해하기 어려웠다 ② 센터 활동 사진을 올리려면 이용자 얼굴 노출이 문제였다 |
| 아키텍처 | 사진 업로드 파이프라인: 브라우저 선압축 → face-api.js 얼굴 감지 → 서버 재검증 → Sharp 블러 → 원본·공개본 R2 분리 저장 |
| 파이프라인 설계 | 공개 게시판에는 블러본만 노출하고 원본은 별도 보관하는 이유. 자동 감지가 놓친 영역은 관리자가 드래그로 수동 지정해 재생성 |
| 설계 결정 | ① 얼굴 감지를 브라우저에서 수행(서버 비용·응답시간) 하되 좌표를 서버에서 재검증 ② MIME 선언을 신뢰하지 않고 매직바이트로 판별 ③ 관리자 쓰기를 RLS 정책 대신 service role 서버 액션으로 분리 |
| 실전 제약과 대응 | ① Vercel 요청 본문 4.5MB 한도 → 3.5MB 초과 이미지를 브라우저에서 최대 1920px로 선압축(`80f17f7`) ② sharp 프리빌드에 HEVC 디코더가 없어 아이폰 HEIC를 디코딩할 수 없었다 → 조용히 실패시키지 않고 변환 방법과 함께 명확히 거절(`d03cba3`) |
| 트러블슈팅 기록 | 블러 좌표 변환을 공통 모듈로 추출하고 가장자리 클램프·다중 얼굴 합성 버그를 수정(`0b41430`) — 증상·원인·수정 형식 |
| 프론트 구현 하이라이트 | ① 수동 블러 편집기(원본 위 드래그 지정) ② 본인부담금 계산기 |
| 실제 화면 | `<Screenshot />` 2장 (사진 게시판, 관리자 수동 블러) |
| 운영에서 배운 것 | 이 프로젝트에서 처음 단위 테스트를 도입했고(착수 39일), 대상이 "틀리면 사람이 다치는" 로직(얼굴 좌표 변환·파일 형식 검증)이었다는 점. 여기서 얻은 감각이 다음 프로젝트의 테스트 우선순위로 이어졌다 |

- [ ] **Step 6: 렌더 확인**

```bash
npm run dev
```

`/projects/ycc-church`, `/projects/ankang-welfare`를 열어 확인한다.

- 표·코드 블록이 자체 가로 스크롤 컨테이너 안에서 렌더되는가
- 브라우저 폭을 375px로 줄였을 때 **페이지 본문이 가로로 밀리지 않는가**
- 스크린샷이 깨지지 않고 캡션이 보이는가

- [ ] **Step 7: 커밋**

```bash
npm run format
git add -A
git commit -m "docs: 케이스 스터디 본문 2편 (영천중앙교회·안강 섬김)"
```

---

## Task 16: About 페이지

**Files:**
- Create: `src/app/about/page.tsx`
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: About 페이지 작성**

`src/app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getProjectsInOrder } from "@/lib/projects";
import { formatPeriod } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "소개",
  description: "배동우 — 백엔드 중심 풀스택 개발자. 경력과 개발 철학.",
};

const BACKGROUND = [
  { period: "~ 2024.02", label: "고려대학교 지구환경과학과 졸업" },
  { period: "2024.03 ~ 2024.09", label: "네이버클라우드 클라우드 기반 웹 데브옵스 과정 수료" },
  { period: "2024.11 ~", label: "Java·Spring Boot, TypeScript·NestJS·Next.js 실무" },
];

export default function AboutPage() {
  const projects = getProjectsInOrder();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">소개</h1>

      <p className="mt-6 leading-relaxed text-muted">
        실제 사용자와 운영자의 문제를 제품으로 해결하고, 기획부터 배포·운영까지 책임지는 것을
        지향합니다. AI가 코드를 빠르게 생성할 수 있는 시대일수록 중요한 것은 &ldquo;무엇을 왜
        만들어야 하는가&rdquo;라고 생각합니다.
      </p>

      <p className="mt-4 leading-relaxed text-muted">
        기관 웹서비스 의뢰를 받아 개발·운영하고 있습니다. 첫 프로젝트가 잘 마무리된 뒤 소개를 통해
        후속 프로젝트로 이어졌고, 지금은 접근성·공공서비스·운영자 CMS 쪽 경험이 쌓였습니다.
      </p>

      <section className="mt-16">
        <h2 className="text-xl font-bold">배경</h2>
        <ul className="mt-6 space-y-4">
          {BACKGROUND.map((item) => (
            <li key={item.label} className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <span className="font-mono text-sm text-faint sm:w-44 sm:shrink-0">
                {item.period}
              </span>
              <span className="text-muted">{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-bold">프로젝트 타임라인</h2>
        <ul className="mt-6 space-y-6">
          {projects.map((project) => (
            <li key={project.slug} className="border-l-2 border-line pl-5">
              <p className="font-mono text-sm text-faint">
                {formatPeriod({
                  start: project.periodStart,
                  end: project.periodEnd,
                  note: project.periodNote,
                })}
              </p>
              <p className="mt-1 font-bold">{project.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{project.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-bold">연락</h2>
        <ul className="mt-6 space-y-2 text-muted">
          <li>
            <a href={`mailto:${site.email}`} className="hover:text-ink">
              {site.email}
            </a>
          </li>
          <li>
            <a href={site.github} className="hover:text-ink">
              github.com/dongwoobae
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: E2E 테스트 추가**

`e2e/smoke.spec.ts` 끝에 추가:

```ts
test("소개 페이지에 배경과 타임라인이 보인다", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("소개");
  await expect(page.getByRole("heading", { name: "배경" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "프로젝트 타임라인" })).toBeVisible();
});
```

- [ ] **Step 3: 테스트 실행**

```bash
npm run e2e
```

기대: PASS (6 tests)

- [ ] **Step 4: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: About 페이지 (배경·프로젝트 타임라인·연락)"
```

---

# Phase 4 — SEO와 마무리

## Task 17: SEO (sitemap·robots·메타데이터·JSON-LD)

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/layout.tsx`
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: sitemap 작성**

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { getCaseStudyProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/projects", "/about"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const projectRoutes = getCaseStudyProjects().map((project) => ({
    url: `${site.url}/projects/${project.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}
```

- [ ] **Step 2: robots 작성**

`src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: 루트 메타데이터 확장 + JSON-LD**

`src/app/layout.tsx`의 `metadata`를 교체하고 `site` import를 추가한다:

```tsx
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.role}`,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  openGraph: {
    title: `${site.name} | ${site.role}`,
    description: site.tagline,
    siteName: site.name,
    locale: "ko_KR",
    type: "website",
    url: site.url,
  },
};
```

`<body>` 안 최상단에 JSON-LD를 추가한다:

```tsx
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: site.name,
              jobTitle: site.role,
              url: site.url,
              email: site.email,
              sameAs: [site.github],
            }),
          }}
        />
```

- [ ] **Step 4: E2E 테스트 추가**

`e2e/smoke.spec.ts` 끝에 추가:

```ts
test("sitemap과 robots가 서빙된다", async ({ page }) => {
  const sitemap = await page.goto("/sitemap.xml");
  expect(sitemap?.status()).toBe(200);
  expect(await sitemap?.text()).toContain("/projects/ycc-church");

  const robots = await page.goto("/robots.txt");
  expect(robots?.status()).toBe(200);
  expect(await robots?.text()).toContain("Sitemap:");
});
```

- [ ] **Step 5: 테스트 실행**

```bash
npm run e2e
```

기대: PASS (7 tests)

- [ ] **Step 6: 커밋**

```bash
npm run format
git add -A
git commit -m "feat: SEO (sitemap·robots·OG 메타데이터·JSON-LD Person)"
```

---

## Task 18: 최종 검증과 릴리스

**Files:**
- Create: `README.md`

- [ ] **Step 1: 저장소 README 작성**

```markdown
# dwoobae.com

> 개인 포트폴리오 웹사이트

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

## 구조

- 콘텐츠는 DB 없이 파일 기반입니다. 프로젝트 메타데이터는 `src/content/projects/meta.ts`에서 zod로 빌드타임 검증하고, 본문은 같은 디렉터리의 MDX입니다.
- 케이스 스터디 상세는 `generateStaticParams` + `dynamicParams = false`로 정적 생성합니다.
- 관리자 페이지·인증·DB가 없습니다. 콘텐츠는 git push로 관리합니다.

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
```

- [ ] **Step 2: 전체 품질 검사 실행**

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run e2e
```

기대: 모두 통과. 실패하면 고치고 다시 실행한다.

- [ ] **Step 3: 프로덕션 빌드 확인**

```bash
npm run build:worker
```

기대: 빌드 성공.

- [ ] **Step 4: 커밋 & 푸시**

```bash
git add -A
git commit -m "docs: 저장소 README 추가"
git push
```

- [ ] **Step 5: CI 통과와 배포 확인**

```bash
gh run watch
```

기대: 전 스텝 통과 후 배포 성공.

- [ ] **Step 6: 라이브 사이트 최종 확인**

`https://dwoobae.com`에서 아래를 확인한다.

- 홈: 히어로 · 운영 중 서비스 링크 2개 · 개발 방식 · 성장 서사 표 · 대표 케이스 2개
- `/projects`: 5개 프로젝트가 착수 순으로, 각 카드에 상태 배지와 기간
- `/projects/ycc-church`, `/projects/ankang-welfare`: 메타 바의 라이브 버튼이 실제 사이트로 연결
- `/about`: 배경 · 타임라인 · 연락처
- 모바일 폭(375px)에서 가로 스크롤이 생기지 않는지
- 존재하지 않는 경로에서 커스텀 404

- [ ] **Step 7: Google Search Console에 sitemap 제출**

`https://dwoobae.com/sitemap.xml`을 등록한다. (사용자 직접 수행)

---

## 완료 기준

1차 릴리스는 아래를 모두 만족하면 완료다.

- [ ] `https://dwoobae.com`이 커스텀 도메인으로 서빙된다
- [ ] 홈·프로젝트 목록·케이스 스터디 2편·About·404가 모두 동작한다
- [ ] `main` push가 CI 게이트(lint·format·typecheck·test·e2e)를 통과해야만 자동 배포된다
- [ ] 단위 테스트 16개 이상, E2E 7개 이상이 통과한다
- [ ] sitemap·robots·OG 메타데이터·JSON-LD가 서빙된다
- [ ] 모바일 폭에서 가로 스크롤이 없다

## 도메인 이전 대비 (2027-07)

`dwoobae.com`은 오등록한 도메인이라 1년 뒤 `dongwoobae.com`으로 옮긴다. 그때 손댈 곳이 아래 세 군데뿐이 되도록 이번 구현에서 지켜야 할 것들이다.

- 사이트 URL은 `NEXT_PUBLIC_SITE_URL` 하나만 본다. `src/lib/site.ts`의 `site.url`이 유일한 소비 지점이고, sitemap·robots·JSON-LD·OG는 모두 `site.url`을 경유한다. **컴포넌트나 MDX에 절대 URL을 직접 쓰지 않는다.**
- 이전 시 변경 지점: ① Cloudflare에서 새 zone 추가 ② `wrangler.jsonc`의 `routes` ③ `.env.local`과 Cloudflare 환경변수의 `NEXT_PUBLIC_SITE_URL`.
- **끊어진 링크 주의:** 지원서·이력서에 적어둔 `dwoobae.com` 링크는 도메인을 놓는 순간 죽는다. 이전 시점에 두 도메인을 1년 겹쳐 보유하고 Cloudflare Redirect Rule로 `dwoobae.com` → `dongwoobae.com` 301을 걸어두는 것을 권한다 (Worker 코드 변경 불필요).

## 다음 단계 (범위 외)

2차·3차 릴리스는 [설계 문서](../specs/2026-07-27-portfolio-design.md) §5를 참고한다. 별도 계획으로 작성한다.

- 2차: 케이스 스터디 3편 추가(모두의 캠퍼스·한약안전사용·특장차 업체) + 딥다이브 노트 3편 + `/notes` 라우트
- 3차: Workers Cron 헬스체크 → D1 적재 → 홈 상태 뱃지·응답시간 표시
