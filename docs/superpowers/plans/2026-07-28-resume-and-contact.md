# 이력서 페이지·연락처 개편·공유/측정 기반 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사실이 틀린 경력 콘텐츠를 바로잡고, `mailto:`를 클립보드 복사로 교체하며, 전화번호만 비밀번호로 잠긴 `/resume` 페이지(A4 인쇄용 스타일 포함)를 만들고, 프로젝트별 OG 이미지와 익명 애널리틱스를 붙인다.

**Architecture:** 기존 구조(파일 기반 콘텐츠 + zod 빌드타임 검증 + SSG)를 유지한다. 새로 생기는 서버 코드는 `POST /api/resume-contact` 라우트 하나뿐이고 상태를 갖지 않는다. 전화번호는 저장소 코드에 두지 않고 Cloudflare Workers secret으로만 존재하며, 비밀번호 검증에 성공한 응답으로만 나간다. 인쇄는 별도 파일이 아니라 `/resume`의 `@media print` 결과물이다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, zod, OpenNext Cloudflare Workers, Vitest, Playwright.

**설계 문서:** [docs/superpowers/specs/2026-07-28-resume-and-contact-design.md](../specs/2026-07-28-resume-and-contact-design.md)

---

## 사전 준비 (구현 시작 전 1회)

- [ ] **`AGENTS.md` 지시 확인**

이 저장소의 `AGENTS.md`는 "이 Next.js는 당신이 아는 그 Next.js가 아니다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 읽어라"고 지시한다. 아래 태스크에 착수하기 전에 관련 문서를 읽는다.

| 태스크 | 읽을 문서 |
| --- | --- |
| Task 8 (API 라우트) | `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` |
| Task 11 (`/resume` 메타데이터) | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` |
| Task 16–17 (OG 이미지) | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` |

- [ ] **품질 검사 기준선 확보**

Run:
```bash
npm run lint && npm run typecheck && npm test
```
Expected: 전부 통과. 여기서 이미 실패하는 항목이 있으면 그것부터 기록하고 시작한다. 이후 태스크의 "통과" 판정 기준이 흐려진다.

---

## 파일 구조

**신규**

| 경로 | 책임 |
| --- | --- |
| `src/lib/password.ts` | SHA-256 해시 + 상수 시간 비교. 순수 함수만. Web Crypto만 사용 |
| `src/lib/password.test.ts` | 위 검증 |
| `src/components/contact/CopyEmail.tsx` | 이메일 클립보드 복사 버튼 + Gmail 보조 링크 |
| `src/components/resume/UnlockContext.tsx` | 해제된 전화번호 상태를 버튼과 표시 위치가 공유 |
| `src/components/resume/DownloadButton.tsx` | 우측 상단 다운로드 버튼 + 비밀번호 모달 + 인쇄 트리거 |
| `src/components/resume/PrintPhone.tsx` | 인쇄 결과물에만 나타나는 전화번호 행 |
| `src/content/resume.ts` | 이력서 고유 콘텐츠(요약·성과 불릿·학력 상세·자격증·어학) |
| `src/content/resume.test.ts` | 이력서 콘텐츠 스키마 검증 |
| `src/content/home.test.ts` | 하이라이트 slug가 실재하는지 검증 |
| `src/app/resume/page.tsx` | 이력서 페이지 (서버 컴포넌트, 정적) |
| `src/app/api/resume-contact/route.ts` | 비밀번호 검증 후 전화번호 반환 |
| `src/app/opengraph-image.tsx` | 루트 OG 카드 |
| `src/app/projects/[slug]/opengraph-image.tsx` | 프로젝트별 OG 카드 |
| `e2e/resume.spec.ts` | `/resume` 및 잠금 E2E |

**수정**

| 경로 | 변경 |
| --- | --- |
| `src/lib/site.ts` | `email` 교체, `phone`·`repoUrl` 삭제 |
| `src/content/home.ts` | `career` 실제 이력으로 교체 + `kind` 필드, `highlights[].slug` 현행화 |
| `src/content/schema.ts` | `careerItemSchema`, `resumeSchema` 추가 |
| `src/components/home/SideRail.tsx` | `mailto:` → `CopyEmail`, `phone` 행 삭제, `/resume` 링크 추가 |
| `src/app/page.tsx` | 푸터 `mailto:`·전화번호 교체 |
| `src/app/layout.tsx` | 기본 OG 이미지, 애널리틱스 |
| `src/app/globals.css` | `@media print` 블록 |
| `wrangler.jsonc` | rate limit 바인딩 |
| `cloudflare-env.d.ts` | secret 타입 선언 |
| `.github/workflows/ci.yml` | E2E용 `.dev.vars` 생성 |
| `e2e/smoke.spec.ts` | 전화번호·`mailto:` 제거로 깨지는 단언 수정 |
| `README.md` | 클라이언트 상태·서버 라우트 예외 명시 |

---

# Phase 0 — 콘텐츠 정정

## Task 1: 하이라이트 slug 현행화

`src/content/home.ts`의 `highlights[].slug` 4개가 전부 구 slug라 랜딩의 주요 CTA가 301 리다이렉트를 거친다.

**Files:**
- Create: `src/content/home.test.ts`
- Modify: `src/content/home.ts:38,46,54,62`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/content/home.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { highlights } from "@/content/home";
import { projects } from "@/content/projects/meta";

describe("랜딩 하이라이트", () => {
  // 구 slug를 두면 next.config.ts의 301을 거쳐야 상세에 닿는다.
  // 사이트 내부 링크는 최종 URL을 직접 가리켜야 한다.
  it("모든 하이라이트 slug가 현행 프로젝트에 존재한다", () => {
    const slugs = new Set(projects.map((project) => project.slug));
    for (const item of highlights) {
      expect(slugs.has(item.slug), `${item.slug}는 현행 slug가 아니다`).toBe(
        true,
      );
    }
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
npx vitest run src/content/home.test.ts
```
Expected: FAIL — `ycc-church는 현행 slug가 아니다`

- [ ] **Step 3: slug 교체**

`src/content/home.ts`의 `highlights` 배열에서 `slug` 값 4개만 바꾼다. 나머지 필드는 그대로 둔다.

| 변경 전 | 변경 후 |
| --- | --- |
| `"ycc-church"` | `"ycc-website"` |
| `"ankang-welfare"` | `"ankang-sumgim"` |
| `"ku-barrier-free-map"` | `"modu-campus"` |
| `"vehicle-manufacturer"` | `"worldengco"` |

`next.config.ts`의 `legacySlugs`는 외부 유입용이므로 건드리지 않는다.

- [ ] **Step 4: 통과 확인**

Run:
```bash
npx vitest run src/content/home.test.ts
```
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/content/home.ts src/content/home.test.ts
git commit -m "fix: 랜딩 하이라이트 링크가 구 slug라 301을 거치던 문제"
```

---

## Task 2: 경력 데이터 교체

`career`가 2024.11부터 한 곳에 계속 재직 중인 것으로 읽히고 학력 연도도 틀렸다. 아울러 이력서에서 경력과 학력을 분리해 쓰기 위해 `kind` 필드를 추가한다.

**Files:**
- Modify: `src/content/schema.ts`
- Modify: `src/content/home.ts:13-33`
- Modify: `src/content/home.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

`src/content/home.test.ts`의 `import`에 `career`를 추가하고 아래 `describe`를 파일 끝에 덧붙인다.

```ts
describe("경력 데이터", () => {
  it("재직 2건과 교육·학력 2건으로 분류된다", () => {
    expect(career.filter((item) => item.kind === "job")).toHaveLength(2);
    expect(career.filter((item) => item.kind === "education")).toHaveLength(2);
  });

  it("현재 재직은 정확히 1건이다", () => {
    expect(career.filter((item) => item.current)).toHaveLength(1);
  });

  it("현재 재직은 목록 맨 앞에 온다", () => {
    expect(career[0].current).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
npx vitest run src/content/home.test.ts
```
Expected: FAIL — `kind` 속성이 없어 타입 오류 또는 길이 0

- [ ] **Step 3: 스키마 추가**

`src/content/schema.ts` 끝에 덧붙인다.

```ts
// 랜딩의 `$ git log --career` 행이자 이력서의 경력·학력 원천.
// 이력서는 경력과 학력을 분리해 싣기 때문에 kind로 갈라 쓴다.
export const careerItemSchema = z.object({
  period: z.string().min(1),
  kind: z.enum(["job", "education"]),
  current: z.boolean(),
  title: z.string().min(1),
  description: z.string().min(1),
});

export type CareerItem = z.infer<typeof careerItemSchema>;
```

- [ ] **Step 4: 데이터 교체**

`src/content/home.ts`의 `career`를 통째로 교체한다. `meta.ts`와 같은 패턴으로 zod 검증을 태운다 — 형식이 틀리면 빌드가 여기서 깨진다.

파일 상단 import에 `careerItemSchema`, `CareerItem`을 추가한다.

```ts
import { careerItemSchema, type CareerItem } from "@/content/schema";
```

`career`를 교체한다.

```ts
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
```

`page.tsx`가 `item.current`로 accent 여부를 가르고 있으므로 필드명을 바꾸지 않는다.

- [ ] **Step 5: 통과 확인**

Run:
```bash
npx vitest run src/content/home.test.ts && npm run typecheck
```
Expected: 둘 다 PASS

- [ ] **Step 6: 화면 확인**

Run:
```bash
npm run dev
```
`http://localhost:3000` 경력 섹션에 4행이 위 순서대로 뜨고, 첫 행 기간만 accent 색인지 확인한다. 확인 후 서버를 끈다.

- [ ] **Step 7: 커밋**

```bash
git add src/content/home.ts src/content/home.test.ts src/content/schema.ts
git commit -m "fix: 경력 표기를 실제 2사 재직 이력으로 정정"
```

---

# Phase 1 — 연락처 개편

## Task 3: site.ts 정리

**Files:**
- Modify: `src/lib/site.ts:7-11`
- Modify: `src/components/home/SideRail.tsx:53-55`
- Modify: `src/app/page.tsx:151-153`

- [ ] **Step 1: site.ts 수정**

`email`을 교체하고 `phone`·`repoUrl` 두 줄을 삭제한다.

```ts
export const site = {
  name: "배동우",
  role: "백엔드 중심 풀스택 개발자",
  tagline:
    "실사용자가 있는 서비스를 수주부터 설계·개발·운영까지 혼자 책임집니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dwoobae.com",
  email: "dw5817@gmail.com",
  github: "https://github.com/dongwoobae",
  githubLabel: "github.com/dongwoobae",
  // 전화번호는 여기 두지 않는다. Workers secret RESUME_PHONE으로만 존재하고
  // /api/resume-contact 응답으로만 나간다. src/app/api/resume-contact/route.ts 참조.
} as const;
```

- [ ] **Step 2: 타입 오류로 소비 지점 찾기**

Run:
```bash
npm run typecheck
```
Expected: FAIL — `SideRail.tsx`와 `page.tsx`에서 `site.phone`이 없다는 오류 2건

- [ ] **Step 3: SideRail에서 phone 행 삭제**

`src/components/home/SideRail.tsx`에서 아래 블록을 통째로 지운다.

```tsx
          <ContactRow label="phone">
            <span>{site.phone}</span>
          </ContactRow>
```

- [ ] **Step 4: 푸터에서 전화번호 삭제**

`src/app/page.tsx` 푸터의 우측 `<span>`을 GitHub만 남기도록 바꾼다.

```tsx
          <span className="font-mono text-xs text-faint">
            {site.githubLabel}
          </span>
```

- [ ] **Step 5: 통과 확인**

Run:
```bash
npm run typecheck && npm run lint
```
Expected: 둘 다 PASS

- [ ] **Step 6: 전화번호가 빌드 산출물에 없는지 확인**

Run:
```bash
grep -rn "5586" src/ || echo "OK: 소스에 없음"
```
Expected: `OK: 소스에 없음`

- [ ] **Step 7: 커밋**

```bash
git add src/lib/site.ts src/components/home/SideRail.tsx src/app/page.tsx
git commit -m "chore: 공개 메일을 gmail로 교체하고 전화번호·미사용 repoUrl 제거"
```

---

## Task 4: CopyEmail 컴포넌트

`mailto:`는 윈도우 데스크톱에서 Outlook을 깨우거나 앱 선택 대화상자를 띄운다. 클립보드 복사를 기본 동작으로 바꾼다.

**Files:**
- Create: `src/components/contact/CopyEmail.tsx`
- Modify: `src/components/home/SideRail.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 컴포넌트 작성**

Create `src/components/contact/CopyEmail.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "copied" | "failed";

const LABEL: Record<Status, string> = {
  idle: "",
  copied: "copied ✓",
  failed: "복사 실패 — 직접 선택하세요",
};

// 클릭 = 클립보드 복사. mailto:를 쓰지 않는 이유는 윈도우 데스크톱에서
// Outlook이나 앱 선택 대화상자가 뜨기 때문이다. 웹메일 사용자에게는 방해다.
// Gmail 바로가기는 보조 수단이고, 기본 동작은 어디까지나 복사다.
export function CopyEmail({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const addressRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(next: Status) {
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(site.email);
      flash("copied");
    } catch {
      // 권한 거부·비보안 컨텍스트 등. 사용자가 직접 복사할 수 있게 선택해 준다.
      const node = addressRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      flash("failed");
    }
  }

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`}>
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer font-medium text-accent underline-offset-4 hover:underline"
      >
        <span ref={addressRef}>{site.email}</span>
      </button>
      <a
        href={`https://mail.google.com/mail/?view=cm&to=${site.email}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[10.5px] text-faint hover:text-muted"
      >
        [Gmail]
      </a>
      <span aria-live="polite" className="font-mono text-[10.5px] text-accent">
        {LABEL[status]}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: SideRail에 적용**

`src/components/home/SideRail.tsx` 상단에 `import { CopyEmail } from "@/components/contact/CopyEmail";`를 추가하고, `mail` 행의 `<a href={mailto:...}>` 블록을 교체한다.

```tsx
          <ContactRow label="mail">
            <CopyEmail />
          </ContactRow>
```

- [ ] **Step 3: 푸터에 적용**

`src/app/page.tsx` 상단에 `import { CopyEmail } from "@/components/contact/CopyEmail";`를 추가하고, 푸터의 `mailto:` 앵커 전체를 교체한다.

```tsx
          <span className="font-mono text-[13px] text-faint">
            $ mail <CopyEmail />
          </span>
```

- [ ] **Step 4: 검사**

Run:
```bash
npm run typecheck && npm run lint
```
Expected: 둘 다 PASS

- [ ] **Step 5: 브라우저 동작 확인**

Run:
```bash
npm run dev
```
좌측 레일의 메일 주소를 클릭해 `copied ✓`가 2초간 뜨는지, 클립보드에 실제로 들어갔는지 확인한다. `[Gmail]`이 새 탭으로 열리는지도 본다. 확인 후 서버를 끈다.

- [ ] **Step 6: 커밋**

```bash
git add src/components/contact/CopyEmail.tsx src/components/home/SideRail.tsx src/app/page.tsx
git commit -m "feat: mailto 대신 클릭 복사 + Gmail 바로가기로 연락처 개편"
```

---

## Task 5: 기존 E2E 수정

Task 3·4로 스모크 테스트가 깨진다. 먼저 어디가 깨지는지 확인하고 고친다.

**Files:**
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 1: 현재 실패 확인**

Run:
```bash
npm run e2e
```
Expected: 전화번호·`mailto:`를 단언하는 테스트가 FAIL. 실패 목록을 기록한다.

- [ ] **Step 2: 단언 수정 및 회귀 방지 테스트 추가**

실패한 단언을 지우고, `e2e/smoke.spec.ts` 끝에 아래 테스트를 덧붙인다.

```ts
test("연락처가 mailto 없이 복사 방식으로 동작한다", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  // mailto:는 윈도우 데스크톱에서 Outlook을 깨우므로 한 곳도 남기지 않는다.
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);

  await page.getByRole("button", { name: "dw5817@gmail.com" }).first().click();
  await expect(page.getByText("copied ✓").first()).toBeVisible();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe("dw5817@gmail.com");
});

test("전화번호가 어느 페이지에도 노출되지 않는다", async ({ page }) => {
  for (const path of ["/", "/projects/modu-campus"]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText("5586");
  }
});
```

- [ ] **Step 3: 통과 확인**

Run:
```bash
npm run e2e
```
Expected: 전부 PASS

- [ ] **Step 4: 커밋**

```bash
git add e2e/smoke.spec.ts
git commit -m "test: 연락처 개편에 맞춰 E2E 갱신 + 전화번호 미노출 회귀 테스트"
```

---

# Phase 2 — /resume 페이지와 연락처 잠금

## Task 6: 비밀번호 검증 함수 (TDD)

Workers 런타임에는 Node의 `crypto.timingSafeEqual`이 없다. Web Crypto만 쓴다. 문자열을 직접 비교하면 길이와 일치 위치가 타이밍으로 새므로 고정 길이 digest끼리 비교한다.

**Files:**
- Create: `src/lib/password.ts`
- Create: `src/lib/password.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/lib/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/lib/password";

describe("verifyPassword", () => {
  it("정답이면 통과한다", async () => {
    await expect(verifyPassword("hunter2", "hunter2")).resolves.toBe(true);
  });

  it("오답이면 거부한다", async () => {
    await expect(verifyPassword("wrong", "hunter2")).resolves.toBe(false);
  });

  it("길이가 다른 입력을 거부한다", async () => {
    await expect(verifyPassword("hunter", "hunter2")).resolves.toBe(false);
    await expect(verifyPassword("hunter22", "hunter2")).resolves.toBe(false);
  });

  it("빈 입력을 거부한다", async () => {
    await expect(verifyPassword("", "hunter2")).resolves.toBe(false);
  });

  // secret 주입이 실패했을 때 빈 비밀번호로 뚫리면 안 된다.
  it("정답이 비어 있으면 무엇을 넣어도 거부한다", async () => {
    await expect(verifyPassword("", "")).resolves.toBe(false);
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
npx vitest run src/lib/password.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/password'`

- [ ] **Step 3: 구현**

Create `src/lib/password.ts`:

```ts
// Workers 런타임에는 Node의 crypto.timingSafeEqual이 없다. Web Crypto만 쓴다.

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return new Uint8Array(digest);
}

function equalInConstantTime(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

// 입력과 정답을 각각 해시해 고정 길이(32바이트)끼리 비교한다.
// 문자열을 직접 비교하면 길이와 첫 불일치 위치가 타이밍으로 새어 나간다.
export async function verifyPassword(
  input: string,
  expected: string,
): Promise<boolean> {
  // secret 주입 실패 시 빈 문자열로 뚫리는 것을 막는다.
  if (!expected || !input) return false;
  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  return equalInConstantTime(a, b);
}
```

- [ ] **Step 4: 통과 확인**

Run:
```bash
npx vitest run src/lib/password.test.ts
```
Expected: 5개 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/password.ts src/lib/password.test.ts
git commit -m "feat: 상수 시간 비밀번호 검증 함수"
```

---

## Task 7: Workers secret 설정

**Files:**
- Modify: `cloudflare-env.d.ts`
- Create: `.dev.vars` (커밋하지 않음)
- Modify: `.gitignore`

- [ ] **Step 1: `.gitignore` 확인**

Run:
```bash
grep -n "dev.vars" .gitignore || echo "없음"
```
`없음`이면 `.gitignore`에 `.dev.vars` 한 줄을 추가한다. 이 파일은 절대 커밋하지 않는다.

- [ ] **Step 2: 타입 선언**

`cloudflare-env.d.ts`의 `CloudflareEnv` 인터페이스에 두 줄을 추가한다. `wrangler types`는 secret을 알 수 없으므로 수동으로 선언한다.

```ts
interface CloudflareEnv {
  // wrangler secret put으로 주입한다. 저장소에 값을 두지 않는다.
  RESUME_PASSWORD?: string;
  RESUME_PHONE?: string;
}
```

기존 필드가 있으면 지우지 말고 위 두 줄만 덧붙인다.

- [ ] **Step 3: 로컬 개발용 값 주입**

`.dev.vars`를 만든다. `next dev`는 `next.config.ts`의 `initOpenNextCloudflareForDev()`를 통해 이 파일을 바인딩으로 읽는다.

```
RESUME_PASSWORD=123456789a
RESUME_PHONE=010-0000-0000
```

`.env`와 `.env.local`은 건드리지 않는다.

- [ ] **Step 4: 커밋**

```bash
git add cloudflare-env.d.ts .gitignore
git commit -m "chore: 이력서 연락처 secret 타입 선언 + .dev.vars 무시"
```

> **배포 전 사용자 작업:** `npx wrangler secret put RESUME_PASSWORD`, `npx wrangler secret put RESUME_PHONE`을 실행해 실제 값을 주입한다. 이 단계 없이 배포하면 잠금 해제가 항상 실패한다.

---

## Task 8: 연락처 API 라우트

**Files:**
- Create: `src/app/api/resume-contact/route.ts`

- [ ] **Step 1: 라우트 핸들러 문서 확인**

Read: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`

`export const dynamic`, `Response.json`, 메서드별 export 규약을 확인한다.

- [ ] **Step 2: 구현**

Create `src/app/api/resume-contact/route.ts`:

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { verifyPassword } from "@/lib/password";

// 이 라우트는 절대 정적화·캐시되면 안 된다. 성공 응답이 한 번이라도 캐시되면
// 비밀번호 없이 전화번호를 받을 수 있게 되어 잠금이 통째로 무의미해진다.
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "private, no-store",
} as const;

const bodySchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid" },
      { status: 400, headers: HEADERS },
    );
  }

  // OpenNext Workers에서는 process.env로 바인딩된 secret이 잡히지 않는다.
  const { env } = getCloudflareContext();

  const ok = await verifyPassword(
    parsed.data.password,
    env.RESUME_PASSWORD ?? "",
  );
  if (!ok) {
    // 실패 사유를 구분해 주지 않는다. secret 미주입도 같은 401로 떨어진다.
    return Response.json(
      { error: "invalid" },
      { status: 401, headers: HEADERS },
    );
  }

  return Response.json({ phone: env.RESUME_PHONE ?? "" }, { headers: HEADERS });
}
```

- [ ] **Step 3: 수동 검증**

Run:
```bash
npm run dev
```

별도 터미널에서:
```bash
curl -i -X POST http://localhost:3000/api/resume-contact \
  -H "Content-Type: application/json" -d '{"password":"wrong"}'
```
Expected: `HTTP/1.1 401`, 본문 `{"error":"invalid"}`, 헤더에 `cache-control: private, no-store`

```bash
curl -i -X POST http://localhost:3000/api/resume-contact \
  -H "Content-Type: application/json" -d '{"password":"123456789a"}'
```
Expected: `HTTP/1.1 200`, 본문 `{"phone":"010-0000-0000"}`, 헤더에 `cache-control: private, no-store`

```bash
curl -i http://localhost:3000/api/resume-contact
```
Expected: `405`

확인 후 서버를 끈다.

- [ ] **Step 4: Workers 런타임에서 확인**

Run:
```bash
npm run preview
```
같은 curl 3건을 preview 주소로 반복한다. `next dev`와 Workers 런타임의 바인딩 동작이 다를 수 있으므로 이 확인을 생략하지 않는다. 확인 후 끈다.

- [ ] **Step 5: 커밋**

```bash
git add src/app/api/resume-contact/route.ts
git commit -m "feat: 비밀번호 검증 후 전화번호를 반환하는 라우트"
```

---

## Task 9: 무차별 대입 속도 제한

Workers Rate Limiting 바인딩은 POP 단위로 동작하고 카운트가 최종 일관성이라 전역 정확도를 보장하지 않는다. 완벽한 차단이 아니라 자동화 속도를 늦추는 것이 목적이다.

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `cloudflare-env.d.ts`
- Modify: `src/app/api/resume-contact/route.ts`

- [ ] **Step 1: 바인딩 문법 확인**

`wrangler` 스킬 또는 Cloudflare 문서에서 현재 버전의 Rate Limiting 바인딩 설정 문법을 확인한다. 이 저장소의 wrangler는 `^4.114.0`이다. 문법을 추측해서 쓰지 않는다.

- [ ] **Step 2: 바인딩 추가**

확인한 문법대로 `wrangler.jsonc`에 rate limit 바인딩을 추가한다. 이름은 `RESUME_RATE_LIMIT`, 기준은 60초 창에 10회로 둔다.

- [ ] **Step 3: 타입 선언**

`cloudflare-env.d.ts`에 추가한다.

```ts
  RESUME_RATE_LIMIT?: { limit: (options: { key: string }) => Promise<{ success: boolean }> };
```

- [ ] **Step 4: 라우트에 적용**

`src/app/api/resume-contact/route.ts`의 `const { env } = getCloudflareContext();` 바로 다음에 삽입한다.

```ts
  // IP 단위로 시도 속도를 제한한다. POP별 최종 일관성이라 완벽한 차단은 아니고,
  // 자동화된 대입의 속도를 떨어뜨리는 것이 목적이다.
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const limiter = env.RESUME_RATE_LIMIT;
  if (limiter) {
    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      return Response.json(
        { error: "too_many" },
        { status: 429, headers: HEADERS },
      );
    }
  }
```

바인딩이 없는 로컬 환경에서도 라우트가 동작하도록 `if (limiter)`로 감싼다.

- [ ] **Step 5: 검증**

Run:
```bash
npm run preview
```

```bash
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST <preview-url>/api/resume-contact \
    -H "Content-Type: application/json" -d '{"password":"wrong"}'
done
```
Expected: 앞부분은 `401`, 임계치를 넘으면 `429`가 섞여 나온다. 15회 모두 401이면 바인딩이 붙지 않은 것이므로 Step 2로 돌아간다.

- [ ] **Step 6: 커밋**

```bash
git add wrangler.jsonc cloudflare-env.d.ts src/app/api/resume-contact/route.ts
git commit -m "feat: 이력서 연락처 라우트에 IP 기준 속도 제한"
```

---

## Task 10: 이력서 콘텐츠

`home.ts`에 없는 값만 새로 쓴다. 경력·스택·프로젝트는 기존 것을 재사용한다.

**Files:**
- Modify: `src/content/schema.ts`
- Create: `src/content/resume.ts`
- Create: `src/content/resume.test.ts`

- [ ] **Step 1: 스키마 추가**

`src/content/schema.ts` 끝에 덧붙인다.

```ts
// 이력서에만 있는 값. 경력·스택·대표 프로젝트는 home.ts를 재사용하므로 여기 없다.
export const resumeSchema = z.object({
  summary: z.array(z.string().min(1)).length(3),
  // key는 home.ts career의 title과 일치해야 한다(resume.test.ts가 검증).
  achievements: z.record(z.string(), z.array(z.string().min(1)).min(2)),
  education: z
    .array(
      z.object({
        period: z.string().min(1),
        school: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(1),
  certificates: z
    .array(z.object({ name: z.string().min(1), date: z.string().min(1) }))
    .min(1),
  languages: z
    .array(z.object({ name: z.string().min(1), score: z.string().min(1) }))
    .min(1),
});

export type Resume = z.infer<typeof resumeSchema>;
```

- [ ] **Step 2: 콘텐츠 작성**

Create `src/content/resume.ts`:

```ts
import { resumeSchema, type Resume } from "@/content/schema";

// 이력서에만 있는 값. 경력 기간·회사명은 home.ts의 career를,
// 대표 프로젝트는 home.ts의 highlights를, 스택은 stackLines를 재사용한다.
// achievements의 키는 career 항목의 title과 정확히 일치해야 한다.
const raw = {
  summary: [
    "기획부터 배포·운영까지 혼자 책임지는 백엔드 중심 풀스택 개발자입니다.",
    "실사용자가 있는 서비스 2건을 직접 수주해 설계·개발하고 현재 운영 중입니다.",
    "WebSub 이벤트 파이프라인, 얼굴 자동 블러, 서버리스 잡 체이닝처럼 운영 부담을 줄이는 문제를 코드로 풉니다.",
  ],
  achievements: {
    모바일이앤엠애드: [
      "이팝콘 다이렉트(오픈몰) 백엔드 개발.",
      "AWS 서버 구성을 설계하고 배포 파이프라인을 구축.",
    ],
    메디케이시스템: [
      "한약안전사용플랫폼을 1인 담당으로 기획·개발·운영까지 단독 수행.",
      "공공데이터 3만 건 이상을 수집·정제해 통합 검색 기반으로 구성.",
      "외부 기관 데이터 제공 협의와 공문 대응을 개발과 병행해 직접 처리.",
      "Spring Boot·NestJS·Next.js를 실무에 적용.",
    ],
  },
  education: [
    {
      period: "2024.03–2024.09",
      school: "네이버클라우드 데브옵스 과정",
      detail: "클라우드 기반 웹 개발자 과정 수료",
    },
    {
      period: "2015.03–2022.08",
      school: "고려대학교 안암캠퍼스",
      detail: "지구환경과학과 학사",
    },
  ],
  certificates: [
    { name: "NAVER CLOUD PLATFORM Certified Professional", date: "2024.08" },
    { name: "NAVER CLOUD PLATFORM Certified Associate", date: "2024.08" },
    { name: "컴퓨터활용능력 1급 필기", date: "2022.04" },
  ],
  languages: [{ name: "TOEIC", score: "825 (2022.04)" }],
};

// 빌드타임 검증 — 형식이 틀리면 여기서 빌드가 깨진다.
export const resume: Resume = resumeSchema.parse(raw);
```

> **확정 필요:** `summary` 3줄과 `achievements`는 초안이다. Task 15 완료 후 실제 화면을 보면서 사용자와 문구를 확정한다. 특히 메디케이시스템의 "공공데이터 3만 건 이상"은 `meta.ts`의 프로젝트 요약에서 가져온 값이므로 실제 수치가 다르면 고친다.

- [ ] **Step 3: 테스트 작성**

Create `src/content/resume.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { career } from "@/content/home";
import { resume } from "@/content/resume";

describe("이력서 콘텐츠", () => {
  it("요약이 3줄이다", () => {
    expect(resume.summary).toHaveLength(3);
  });

  // 키가 어긋나면 이력서 경력 절에 성과가 통째로 비어 출력된다.
  it("성과 키가 재직 경력 title과 일치한다", () => {
    const jobs = career
      .filter((item) => item.kind === "job")
      .map((item) => item.title);
    expect(Object.keys(resume.achievements).sort()).toEqual([...jobs].sort());
  });

  it("모든 재직 경력에 성과가 2줄 이상 있다", () => {
    for (const [company, lines] of Object.entries(resume.achievements)) {
      expect(lines.length, `${company} 성과`).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 4: 통과 확인**

Run:
```bash
npx vitest run src/content/resume.test.ts && npm run typecheck
```
Expected: 둘 다 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/content/schema.ts src/content/resume.ts src/content/resume.test.ts
git commit -m "feat: 이력서 콘텐츠와 빌드타임 스키마 검증"
```

---

## Task 11: 다운로드 버튼과 잠금 모달

동작 모델은 이렇다.

1. `/resume`는 누구나 자유롭게 열람한다. 이 화면에 전화번호는 **없다**.
2. 우측 상단 `이력서 다운로드` 버튼을 누르면 비밀번호 모달이 뜬다.
3. 통과하면 전화번호를 받아 들고 곧바로 인쇄 다이얼로그를 연다.
4. 전화번호는 **인쇄 결과물에만** 찍힌다. 해제 후에도 화면에는 표시하지 않는다.

전화번호 상태를 버튼(우측 상단)과 표시 위치(연락처 블록)가 함께 봐야 하므로 컨텍스트로 공유한다. 세 파일로 나눈다.

**Files:**
- Create: `src/components/resume/UnlockContext.tsx`
- Create: `src/components/resume/DownloadButton.tsx`
- Create: `src/components/resume/PrintPhone.tsx`

- [ ] **Step 1: 컨텍스트 작성**

Create `src/components/resume/UnlockContext.tsx`:

```tsx
"use client";

import { createContext, useContext, useState } from "react";

type UnlockValue = {
  phone: string | null;
  setPhone: (phone: string) => void;
};

const UnlockContext = createContext<UnlockValue | null>(null);

// 전화번호는 어디에도 상수로 들어가지 않는다. 정적 HTML과 JS 번들에 값이 없고,
// /api/resume-contact 응답으로만 이 상태에 들어온다.
export function UnlockProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  return (
    <UnlockContext.Provider value={{ phone, setPhone }}>
      {children}
    </UnlockContext.Provider>
  );
}

export function useUnlock(): UnlockValue {
  const value = useContext(UnlockContext);
  if (!value) throw new Error("UnlockProvider 안에서만 쓸 수 있다");
  return value;
}
```

- [ ] **Step 2: 인쇄 전용 전화번호 행 작성**

Create `src/components/resume/PrintPhone.tsx`:

```tsx
"use client";

import { useUnlock } from "@/components/resume/UnlockContext";

// 해제 전에는 아무것도 렌더하지 않고, 해제 후에도 화면에는 보이지 않는다.
// hidden print:flex — 오직 인쇄 결과물에만 나타난다.
export function PrintPhone() {
  const { phone } = useUnlock();
  if (!phone) return null;

  return (
    <span className="hidden items-baseline gap-2.5 print:flex">
      <span className="w-10 flex-none font-mono text-[10.5px] text-[#666]">
        phone
      </span>
      <span>{phone}</span>
    </span>
  );
}
```

- [ ] **Step 3: 다운로드 버튼과 모달 작성**

Create `src/components/resume/DownloadButton.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useUnlock } from "@/components/resume/UnlockContext";

export function DownloadButton() {
  const { setPhone } = useUnlock();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setPassword("");
    setError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/resume-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(
          response.status === 429
            ? "시도가 너무 잦습니다. 잠시 후 다시 시도하세요."
            : "비밀번호가 올바르지 않습니다.",
        );
        return;
      }
      const data = (await response.json()) as { phone: string };
      setPhone(data.phone);
      close();
      // 전화번호가 DOM에 반영된 뒤 인쇄 다이얼로그를 연다.
      // 같은 틱에 호출하면 번호가 빠진 채로 인쇄될 수 있다.
      requestAnimationFrame(() => window.print());
    } catch {
      setError("요청에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded border border-line px-3 py-1.5 font-mono text-[11.5px] text-accent hover:border-accent print:hidden"
      >
        ↓ 이력서 다운로드
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="이력서 다운로드"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 print:hidden"
          onClick={close}
        >
          <form
            onSubmit={submit}
            onClick={(event) => event.stopPropagation()}
            className="flex w-full max-w-[320px] flex-col gap-3 rounded-lg border border-line bg-card p-6"
          >
            <p className="font-mono text-[11.5px] text-faint">
              $ unlock resume.pdf
            </p>
            <p className="text-[12.5px] leading-[1.7] text-muted">
              연락처가 포함된 이력서를 내려받습니다. 비밀번호를 입력하세요.
            </p>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-label="이력서 다운로드 비밀번호"
              className="rounded border border-line bg-page px-3 py-2 font-mono text-[13px] text-ink"
            />
            <span aria-live="polite" className="text-[11.5px] text-muted">
              {error}
            </span>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="cursor-pointer px-3 py-1.5 font-mono text-[11.5px] text-faint"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={pending || password.length === 0}
                className="cursor-pointer rounded border border-line px-3 py-1.5 font-mono text-[11.5px] text-accent disabled:opacity-40"
              >
                {pending ? "확인 중" : "다운로드"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: 검사**

Run:
```bash
npm run typecheck && npm run lint
```
Expected: 둘 다 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/resume/UnlockContext.tsx src/components/resume/PrintPhone.tsx src/components/resume/DownloadButton.tsx
git commit -m "feat: 이력서 다운로드 버튼과 비밀번호 모달"
```

---

## Task 12: /resume 페이지

**Files:**
- Create: `src/app/resume/page.tsx`

- [ ] **Step 1: 메타데이터 문서 확인**

Read: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`

`robots` 필드 형식을 확인한다.

- [ ] **Step 2: 페이지 작성**

Create `src/app/resume/page.tsx`:

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyEmail } from "@/components/contact/CopyEmail";
import { DownloadButton } from "@/components/resume/DownloadButton";
import { PrintPhone } from "@/components/resume/PrintPhone";
import { UnlockProvider } from "@/components/resume/UnlockContext";
import { career, highlights, stackLines } from "@/content/home";
import { resume } from "@/content/resume";
import { site } from "@/lib/site";

// noindex는 접근 통제가 아니라 검색 노출 방지일 뿐이다. URL을 아는 사람은
// 누구나 열람할 수 있으므로 본문은 공개 전제로 쓴다. 잠그는 값은 전화번호뿐이다.
export const metadata: Metadata = {
  title: "이력서",
  robots: { index: false, follow: false },
};

const jobs = career.filter((item) => item.kind === "job");

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-9 mb-3 border-b border-line pb-1.5 text-[15px] font-bold text-accent print:mt-7 print:border-[#ddd] print:text-[11pt] print:text-[--print-accent]">
      {children}
    </h2>
  );
}

// 좌측 라벨(기간) + 우측 내용. 랜딩 경력 섹션과 같은 문법이라 화면과 종이의
// 인상이 이어지고, 경력의 시간 축이 좌측에 정렬돼 흐름이 바로 읽힌다.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-[18px] print:break-inside-avoid print:flex-row">
      <span className="font-mono text-[11.5px] text-faint sm:w-24 sm:flex-none print:w-[22mm] print:text-[8.5pt] print:text-[#666]">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function ResumePage() {
  return (
    // 전화번호 상태를 다운로드 버튼(우측 상단)과 인쇄 전용 행(연락처 블록)이
    // 함께 봐야 하므로 페이지 전체를 provider로 감싼다.
    <UnlockProvider>
      <main id="main" className="min-h-screen bg-page print:bg-white">
        <div className="resume-sheet mx-auto max-w-[860px] px-5 pb-20 md:px-10 print:max-w-none print:px-0 print:pb-0">
          <div className="flex items-center justify-between gap-4 border-b border-line py-[22px] font-mono print:hidden">
            <Link href="/" className="text-[12.5px] text-tertiary">
              ← cd ~/dongwoobae
            </Link>
            <DownloadButton />
          </div>

          <header className="flex items-start justify-between gap-6 pt-10 print:pt-0">
            <div>
              <h1 className="text-[28px] font-bold print:text-[18pt]">
                {site.name}
              </h1>
              <p className="mt-1.5 font-mono text-[12px] text-tertiary print:text-[9pt]">
                backend-driven fullstack
              </p>
              <div className="mt-4 flex flex-col gap-1.5 text-[13px] print:text-[9pt]">
                <span className="flex items-baseline gap-2.5">
                  <span className="w-10 flex-none font-mono text-[10.5px] text-faint">
                    mail
                  </span>
                  <CopyEmail />
                </span>
                {/* 화면에는 전화번호가 없다. 해제 후에도 인쇄에만 나타난다. */}
                <PrintPhone />
                <span className="flex items-baseline gap-2.5">
                  <span className="w-10 flex-none font-mono text-[10.5px] text-faint">
                    web
                  </span>
                  <span className="text-muted">
                    {site.url.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                <span className="flex items-baseline gap-2.5">
                  <span className="w-10 flex-none font-mono text-[10.5px] text-faint">
                    git
                  </span>
                  <span className="text-muted">{site.githubLabel}</span>
                </span>
              </div>
            </div>
            <Image
              src="/photo/dongwoo_photo.jpg"
              alt="배동우 프로필 사진"
              width={98}
              height={124}
              className="h-[124px] w-[98px] flex-none rounded border border-line object-cover object-top print:h-[33mm] print:w-[26mm] print:rounded-none"
            />
          </header>

        <SectionHead>요약</SectionHead>
        <ul className="flex flex-col gap-1.5 text-[13px] leading-[1.7] text-muted print:text-[9.5pt] print:text-[#111]">
          {resume.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <SectionHead>경력</SectionHead>
        {jobs.map((job) => (
          <Row key={job.title} label={job.period}>
            <strong className="text-[14px] print:text-[10pt]">
              {job.title}
            </strong>
            <ul className="mt-1 flex flex-col gap-1 text-[12.5px] leading-[1.7] text-muted print:text-[9.5pt] print:text-[#111]">
              {resume.achievements[job.title]?.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </Row>
        ))}

        <SectionHead>대표 프로젝트</SectionHead>
        {highlights.slice(0, 3).map((item) => (
          <Row key={item.slug} label={item.kicker}>
            <strong className="text-[14px] print:text-[10pt]">
              {item.title}
            </strong>
            <p className="mt-1 text-[12.5px] leading-[1.7] text-muted print:text-[9.5pt] print:text-[#111]">
              {item.description}
            </p>
          </Row>
        ))}

        <SectionHead>기술 스택</SectionHead>
        <div className="flex flex-col gap-1.5 text-[12.5px] print:text-[9.5pt]">
          {stackLines.map((line) => (
            <Row key={line.label} label={line.label}>
              <span className="text-muted print:text-[#111]">{line.value}</span>
            </Row>
          ))}
        </div>

        <SectionHead>학력</SectionHead>
        {resume.education.map((item) => (
          <Row key={item.school} label={item.period}>
            <strong className="text-[13.5px] print:text-[10pt]">
              {item.school}
            </strong>{" "}
            <span className="text-[12.5px] text-muted print:text-[9.5pt] print:text-[#111]">
              {item.detail}
            </span>
          </Row>
        ))}

        <SectionHead>자격증 · 어학</SectionHead>
        {resume.certificates.map((item) => (
          <Row key={item.name} label={item.date}>
            <span className="text-[12.5px] text-muted print:text-[9.5pt] print:text-[#111]">
              {item.name}
            </span>
          </Row>
        ))}
        {resume.languages.map((item) => (
          <Row key={item.name} label={item.name}>
            <span className="text-[12.5px] text-muted print:text-[9.5pt] print:text-[#111]">
              {item.score}
            </span>
          </Row>
        ))}
        </div>
      </main>
    </UnlockProvider>
  );
}
```

> `<header>` 이후의 섹션들은 위 코드에서 들여쓰기가 한 단계 얕게 남아 있다. `UnlockProvider`로 한 겹 더 감쌌기 때문이다. 다음 Step의 `npm run format`이 정리하므로 손으로 맞추지 않아도 된다. 중요한 건 닫는 태그 순서(`</div>` → `</main>` → `</UnlockProvider>`)다.

- [ ] **Step 3: 검사**

Run:
```bash
npm run format && npm run typecheck && npm run lint
```
Expected: 전부 PASS

- [ ] **Step 4: 화면 확인**

Run:
```bash
npm run dev
```
`http://localhost:3000/resume`에서 확인한다.

1. 전 섹션이 렌더된다
2. 화면 어디에도 전화번호가 없다
3. 우측 상단 `↓ 이력서 다운로드` 버튼을 누르면 모달이 뜬다
4. `123456789a`를 넣으면 모달이 닫히고 인쇄 다이얼로그가 열린다
5. 인쇄 미리보기에만 전화번호가 있고, 취소 후 화면에는 여전히 없다

확인 후 끈다.

- [ ] **Step 5: 커밋**

```bash
git add src/app/resume/page.tsx
git commit -m "feat: 이력서 페이지 (연락처 잠금 포함)"
```

---

## Task 13: 사이트에서 /resume 진입점 추가

**Files:**
- Modify: `src/components/home/SideRail.tsx`

- [ ] **Step 1: 레일 하단에 링크 추가**

`src/components/home/SideRail.tsx`의 `<RailNav />` 바로 위에 넣는다.

```tsx
        <Link
          href="/resume"
          className="font-mono text-[11.5px] text-accent hover:underline"
        >
          $ open resume
        </Link>
```

파일 상단에 `import Link from "next/link";`를 추가한다.

- [ ] **Step 2: 확인 및 커밋**

Run:
```bash
npm run typecheck && npm run lint
```
Expected: 둘 다 PASS

```bash
git add src/components/home/SideRail.tsx
git commit -m "feat: 좌측 레일에 이력서 진입점"
```

---

## Task 14: 인쇄 스타일

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 인쇄 블록 추가**

`src/app/globals.css` 끝에 덧붙인다.

```css
/* 이력서 인쇄 규격. 화면과 종이는 서로 다른 디자인이다. 화면(/resume)은 사이트와
   같은 다크 터미널 테마이고, 인쇄물만 흰 배경 + 파란 포인트의 일반적인 이력서
   형태로 갈아끼운다. 종이에서는 터미널 장식(프롬프트 접두사·커서·경로 표기·
   카드 보더)이 노이즈이므로 전부 뺀다. */
@media print {
  @page {
    size: A4;
    margin: 15mm 18mm;
  }

  :root {
    /* 화면 accent(#7ee2a8)는 민트라 흰 종이에서 대비가 부족해 쓰지 않는다.
       종이 이력서는 사이트 브랜딩보다 관례와 가독성이 우선이라 파랑을 쓴다. */
    --print-accent: #1f5fa9;
  }

  html,
  body {
    background: #fff !important;
    color: #111 !important;
  }

  /* 흑백 출력에서 색이 죽어도 Bold와 실선으로 위계가 유지되어야 한다. */
  .resume-sheet a {
    color: #111 !important;
    text-decoration: none;
  }

  /* 종이에서는 클릭할 수 없으므로 주소가 보여야 한다. */
  .resume-sheet a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 8pt;
    color: #666;
  }
}
```

- [ ] **Step 2: 인쇄 미리보기 확인**

Run:
```bash
npm run dev
```
`/resume`에서 `Ctrl+P`. 확인 항목:

1. 배경이 흰색, 본문이 검정인가
2. 상단 `← cd ~/dongwoobae` 네비와 잠금 입력 폼이 안 보이는가
3. 페이지 경계에서 경력·프로젝트 항목이 잘리지 않는가 (분량은 1장으로 강제하지 않는다)
4. 경력·프로젝트 항목이 페이지 경계에서 잘리지 않는가
5. 좌측 기간 열이 정렬돼 있는가

항목이 페이지 경계에서 잘리면 `print:break-inside-avoid`가 해당 요소에 붙어 있는지 확인한다.

- [ ] **Step 3: 참고 양식과 대조**

인쇄 미리보기를 `docs/superpowers/specs/2026-07-28-resume-and-contact-design.md`의 인쇄 디자인 절과 대조한다. 확인 항목:

1. 섹션 헤더가 파란 Bold + 전폭 실선인가
2. 파랑이 섹션 헤더와 기술 키워드 두 곳에만 쓰였는가
3. 화면의 초록 accent가 종이에 한 군데도 남지 않았는가

- [ ] **Step 4: 실제 출력 확인**

컬러·흑백 양쪽으로 실제 인쇄한다. accent 색의 종이 대비는 화면 미리보기로 판정할 수 없다. 흑백에서 섹션 헤더가 본문과 구분되지 않으면 `--print-accent`를 더 어둡게 내린다.

- [ ] **Step 5: 커밋**

```bash
git add src/app/globals.css
git commit -m "feat: 이력서 인쇄 스타일 (흰 배경·파란 포인트)"
```

---

## Task 15: 이력서 E2E

**Files:**
- Create: `e2e/resume.spec.ts`

- [ ] **Step 1: 테스트 작성**

Create `e2e/resume.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

// .dev.vars에 넣은 로컬 개발용 값과 같아야 한다.
const PASSWORD = process.env.RESUME_PASSWORD ?? "123456789a";
const PHONE = process.env.RESUME_PHONE ?? "010-0000-0000";

test("이력서 페이지가 전 섹션을 렌더한다", async ({ page }) => {
  const response = await page.goto("/resume");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("배동우");
  for (const section of [
    "요약",
    "경력",
    "대표 프로젝트",
    "기술 스택",
    "학력",
    "자격증 · 어학",
  ]) {
    await expect(
      page.getByRole("heading", { level: 2, name: section }),
    ).toBeVisible();
  }

  await expect(page.getByText("모바일이앤엠애드")).toBeVisible();
  await expect(page.getByText("메디케이시스템")).toBeVisible();
});

test("공개 열람 화면에는 전화번호가 없다", async ({ page }) => {
  await page.goto("/resume");
  await expect(page.locator("body")).not.toContainText(PHONE);

  // 정적 HTML 자체에도 없어야 한다. CSS로 가려두는 것과는 다르다.
  const html = await page.content();
  expect(html).not.toContain(PHONE);
});

test("오답을 넣으면 전화번호가 나오지 않는다", async ({ page }) => {
  await page.goto("/resume");

  await page.getByRole("button", { name: "이력서 다운로드" }).click();
  await page.getByLabel("이력서 다운로드 비밀번호").fill("definitely-wrong");
  await page.getByRole("button", { name: "다운로드" }).click();

  await expect(page.getByText("비밀번호가 올바르지 않습니다.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(PHONE);
});

test("정답을 넣으면 인쇄에만 전화번호가 나타난다", async ({ page }) => {
  // window.print()는 헤드리스에서 다이얼로그를 띄우려다 멈출 수 있어 막아 둔다.
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto("/resume");

  await page.getByRole("button", { name: "이력서 다운로드" }).click();
  await page.getByLabel("이력서 다운로드 비밀번호").fill(PASSWORD);
  await page.getByRole("button", { name: "다운로드" }).click();

  // 모달이 닫힌다.
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // 화면(screen)에서는 해제 후에도 보이지 않는다.
  await page.emulateMedia({ media: "screen" });
  await expect(page.getByText(PHONE)).toBeHidden();

  // 인쇄 미디어에서만 나타난다.
  await page.emulateMedia({ media: "print" });
  await expect(page.getByText(PHONE)).toBeVisible();
});

test("모달을 ESC로 닫을 수 있다", async ({ page }) => {
  await page.goto("/resume");

  await page.getByRole("button", { name: "이력서 다운로드" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// 이 헤더가 없으면 엣지가 성공 응답을 캐시할 수 있고, 그 순간 잠금이 무의미해진다.
test("연락처 응답이 캐시 금지 헤더를 단다", async ({ request }) => {
  const ok = await request.post("/api/resume-contact", {
    data: { password: PASSWORD },
  });
  expect(ok.status()).toBe(200);
  expect(ok.headers()["cache-control"]).toContain("no-store");

  const fail = await request.post("/api/resume-contact", {
    data: { password: "wrong" },
  });
  expect(fail.status()).toBe(401);
  expect(fail.headers()["cache-control"]).toContain("no-store");
});

test("이력서는 검색 색인에서 빠진다", async ({ page }) => {
  await page.goto("/resume");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  const sitemap = await page.goto("/sitemap.xml");
  expect(await sitemap?.text()).not.toContain("/resume");
});
```

- [ ] **Step 2: 통과 확인**

Run:
```bash
npm run e2e
```
Expected: 전부 PASS. 실패하면 `.dev.vars` 값과 테스트 상수가 일치하는지 먼저 본다.

- [ ] **Step 3: 커밋**

```bash
git add e2e/resume.spec.ts
git commit -m "test: 이력서 페이지와 연락처 잠금 E2E"
```

---

## Task 16: CI에 secret 주입

CI에서 E2E가 도는데 `.dev.vars`가 없으면 잠금 테스트가 전부 깨진다.

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: 현재 워크플로 확인**

Read: `.github/workflows/ci.yml`

E2E 실행 스텝의 위치를 파악한다.

- [ ] **Step 2: `.dev.vars` 생성 스텝 추가**

E2E 실행 스텝 **앞에** 삽입한다.

```yaml
      - name: Write .dev.vars for E2E
        run: |
          echo "RESUME_PASSWORD=${{ secrets.RESUME_PASSWORD }}" >> .dev.vars
          echo "RESUME_PHONE=${{ secrets.RESUME_PHONE }}" >> .dev.vars
```

E2E 실행 스텝에 환경변수를 붙인다.

```yaml
        env:
          RESUME_PASSWORD: ${{ secrets.RESUME_PASSWORD }}
          RESUME_PHONE: ${{ secrets.RESUME_PHONE }}
```

- [ ] **Step 3: 커밋 및 확인**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: E2E용 이력서 secret 주입"
git push
```

GitHub Actions 실행 결과를 확인한다. 실패하면 저장소 Settings → Secrets에 두 값이 등록됐는지 본다.

> **사용자 작업:** GitHub 저장소 Settings → Secrets and variables → Actions에 `RESUME_PASSWORD`, `RESUME_PHONE`을 등록한다. 프로덕션 값과 같을 필요는 없다.

---

# Phase 3 — OG 이미지

## Task 17: 루트 OG 카드

**Files:**
- Create: `src/app/opengraph-image.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 문서 확인**

Read: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`

`ImageResponse`의 `fonts` 옵션 형식과 `size`·`contentType` export 규약을 확인한다. `next/font`는 여기서 쓸 수 없다.

- [ ] **Step 2: 라틴 전용 카드부터 작성**

한글 폰트 로딩은 파일이 크고 실패 지점이 많다. 먼저 파이프라인이 도는지부터 확인한다.

Create `src/app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.role}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          background: "#0f1216",
          color: "#dfe5ec",
        }}
      >
        <div style={{ fontSize: 28, color: "#7ee2a8" }}>$ whoami</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 20 }}>
          Dongwoo Bae
        </div>
        <div style={{ fontSize: 34, color: "#9aa4b2", marginTop: 16 }}>
          backend-driven fullstack
        </div>
        <div style={{ fontSize: 26, color: "#5b6572", marginTop: 40 }}>
          {site.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 3: 빌드 후 산출물 확인**

Run:
```bash
npm run build
```
Expected: 빌드 통과

Run:
```bash
npm run dev
```
`http://localhost:3000/opengraph-image`를 브라우저로 연다.

Expected: 1200×630 다크 카드가 뜬다. 생성이 실패해도 빌드는 통과할 수 있으므로 이 눈 확인을 생략하지 않는다.

- [ ] **Step 4: layout에 연결**

`src/app/layout.tsx`의 `metadata.openGraph`에 `images`를 추가한다.

```ts
  openGraph: {
    title: `${site.name} | ${site.role}`,
    description: site.tagline,
    siteName: site.name,
    locale: "ko_KR",
    type: "website",
    url: site.url,
    images: ["/opengraph-image"],
  },
```

- [ ] **Step 5: 커밋**

```bash
git add src/app/opengraph-image.tsx src/app/layout.tsx
git commit -m "feat: 루트 OG 이미지"
```

---

## Task 18: 프로젝트별 OG 카드

프로젝트 제목이 한글이라 한글 폰트가 필요하다. OG 이미지는 빌드타임에 생성되므로 폰트 파일은 Worker 번들에 실리지 않는다.

**Files:**
- Create: `assets/fonts/` (폰트 파일)
- Create: `src/app/projects/[slug]/opengraph-image.tsx`

- [ ] **Step 1: 한글 폰트 확보**

`assets/fonts/`를 만들고 IBM Plex Sans KR Bold `.ttf`를 넣는다. `public/`이 아니라 `assets/`에 두는 이유는 정적 서빙 대상이 아니기 때문이다.

- [ ] **Step 2: 카드 작성**

Create `src/app/projects/[slug]/opengraph-image.tsx`:

```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { projects } from "@/content/projects/meta";
import { getProjectBySlug } from "@/lib/projects";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  // ImageResponse는 next/font를 쓸 수 없다. 폰트 바이트를 직접 넘긴다.
  const font = await readFile(
    join(process.cwd(), "assets/fonts/IBMPlexSansKR-Bold.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          background: "#0f1216",
          color: "#dfe5ec",
        }}
      >
        <div style={{ fontSize: 26, color: "#7ee2a8" }}>
          $ cat projects/{slug}
        </div>
        <div style={{ fontSize: 64, marginTop: 24 }}>{project?.title}</div>
        <div style={{ fontSize: 30, color: "#9aa4b2", marginTop: 18 }}>
          {project?.summary}
        </div>
        <div style={{ fontSize: 24, color: "#5b6572", marginTop: 40 }}>
          {site.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "PlexKR", data: font, style: "normal" }] },
  );
}
```

- [ ] **Step 3: 빌드 및 눈 확인**

Run:
```bash
npm run build && npm run dev
```
5개 slug 전부를 브라우저로 연다.

```
http://localhost:3000/projects/modu-campus/opengraph-image
http://localhost:3000/projects/ankang-sumgim/opengraph-image
http://localhost:3000/projects/ycc-website/opengraph-image
http://localhost:3000/projects/worldengco/opengraph-image
http://localhost:3000/projects/hmsu/opengraph-image
```
Expected: 5장 모두 한글이 네모(두부)로 깨지지 않고 정상 렌더된다.

한글이 깨지면 폰트 경로와 파일명을 먼저 확인한다. 그래도 안 되면 설계 문서의 대응대로 카드에서 한글을 빼고 slug·스택 등 라틴 텍스트 중심으로 재구성한다.

- [ ] **Step 4: Workers 빌드 확인**

Run:
```bash
npm run build:worker
```
Expected: 통과. `assets/fonts/`의 폰트가 Worker 번들에 실려 크기 경고가 나면, OG 라우트가 정적 생성되지 않고 런타임으로 떨어진 것이므로 `generateStaticParams`를 다시 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add assets/fonts src/app/projects/\[slug\]/opengraph-image.tsx
git commit -m "feat: 프로젝트별 OG 이미지"
```

---

# Phase 4 — 애널리틱스

## Task 19: Cloudflare Web Analytics

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `.env.example`

- [ ] **Step 1: 스크립트 추가**

`src/app/layout.tsx`의 `<body>` 안, JSON-LD 스크립트 바로 다음에 넣는다.

```tsx
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          // 쿠키를 쓰지 않는 익명 집계라 동의 배너가 필요 없다.
          // 토큰이 없으면 렌더하지 않아 로컬 개발과 E2E에 영향을 주지 않는다.
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({
              token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN,
            })}
          />
        )}
```

- [ ] **Step 2: 환경변수 문서화**

`.env.example`에 한 줄 추가한다.

```
NEXT_PUBLIC_CF_BEACON_TOKEN=
```

`.env.local`은 건드리지 않는다.

- [ ] **Step 3: 검사**

Run:
```bash
npm run typecheck && npm run lint && npm run e2e
```
Expected: 전부 PASS. 토큰이 비어 있으므로 스크립트는 렌더되지 않는다.

- [ ] **Step 4: 커밋**

```bash
git add src/app/layout.tsx .env.example
git commit -m "feat: Cloudflare Web Analytics"
```

> **사용자 작업:** Cloudflare 대시보드 → Web Analytics에서 `dwoobae.com` 사이트를 추가하고 발급된 토큰을 Cloudflare Workers 환경변수 `NEXT_PUBLIC_CF_BEACON_TOKEN`에 넣는다. 빌드타임에 인라인되는 값이므로 배포 파이프라인 쪽에 설정해야 한다.

---

# 마무리

## Task 20: 문서 갱신

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 클라이언트 상태 문장 갱신**

README의 "클라이언트 상태는 셋뿐입니다 — 히어로 타이핑 진행도, 스크롤 스파이 활성 섹션, 목록 hover 미리보기." 문장을 교체한다.

```markdown
클라이언트 상태는 다섯입니다 — 히어로 타이핑 진행도, 스크롤 스파이 활성 섹션, 목록 hover 미리보기, 이메일 복사 피드백, 이력서 연락처 잠금 해제. 나머지는 전부 서버 컴포넌트입니다.
```

- [ ] **Step 2: 서버 라우트 예외 명시**

README의 "관리자 페이지·인증·DB가 없습니다." 항목 아래에 덧붙인다.

```markdown
- 서버 라우트는 `POST /api/resume-contact` 하나뿐입니다. 이력서의 전화번호를 비밀번호 뒤에 두려면 서버 검증이 필요해서 둔 예외이고, 상태를 갖지 않습니다. 전화번호와 비밀번호는 저장소에 없고 Workers secret(`RESUME_PHONE`, `RESUME_PASSWORD`)으로만 존재합니다. 로컬 개발은 `.dev.vars`로 주입합니다.
- `/resume`는 `noindex`이고 sitemap에서 빠집니다. 다만 이는 검색 노출 방지일 뿐 접근 통제가 아니라, 본문은 공개 전제로 씁니다.
```

- [ ] **Step 3: 이력서 항목 추가**

README의 "프로젝트 스크린샷" 섹션 앞에 넣는다.

```markdown
## 이력서

`/resume`는 별도 PDF 파일이 아니라 `src/content/resume.ts` + `home.ts`를 조립한 페이지이고, 인쇄(`Ctrl+P`)하면 흰 배경·파란 포인트의 A4 이력서로 나옵니다. 인쇄 규격은 `src/app/globals.css`의 `@media print` 블록에 있습니다. 내용을 고칠 때는 `resume.ts`만 보면 되고, 경력·스택·대표 프로젝트는 `home.ts`를 재사용하므로 두 번 쓰지 않습니다.
```

- [ ] **Step 4: 전체 검사 후 커밋**

Run:
```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run e2e
```
Expected: 전부 PASS

```bash
git add README.md
git commit -m "docs: README에 이력서 라우트·서버 라우트 예외 반영"
```

---

## Task 21: 배포 확인

- [ ] **Step 1: Workers 런타임 전체 확인**

Run:
```bash
npm run preview
```

확인 항목:

1. `/` 렌더, 메일 복사 동작
2. `/resume` 렌더, 오답 401, 정답 200
3. `/opengraph-image`와 프로젝트 OG 5장
4. `/sitemap.xml`에 `/resume`가 없음
5. 하이라이트 카드 4개 클릭 시 리다이렉트 없이 바로 상세 도달

- [ ] **Step 2: 배포**

```bash
git push
```

GitHub Actions가 lint·format·typecheck·test·e2e를 통과한 뒤 배포한다.

- [ ] **Step 3: 프로덕션 확인**

1. `https://dwoobae.com/resume`에서 실제 비밀번호로 해제되는가 (Task 7의 `wrangler secret put`이 선행돼야 한다)
2. 프로젝트 상세 URL을 카카오톡·슬랙에 붙여 OG 카드가 뜨는가
3. Cloudflare Web Analytics 대시보드에 방문이 잡히는가

---

## 미해결 항목

| 항목 | 처리 시점 |
| --- | --- |
| `resume.ts`의 요약 3줄·성과 불릿 문구 확정 | Task 14(인쇄 확인) 후 실물을 보며 사용자와 확정 |
| `--print-accent` 최종 색값 | Task 14 Step 3의 흑백 출력 결과로 확정 |
| favicon 교체 | 범위 밖. 아이콘 확정 후 별도 작업 |
| 잔디 최근 90일 뷰 | 범위 밖. 별도 작업 |
