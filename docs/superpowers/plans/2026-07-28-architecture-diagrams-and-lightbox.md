# 케이스 스터디 아키텍처 다이어그램 · 라이트박스 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 상세 페이지에 실코드 기반 SVG 아키텍처 다이어그램 4장을 넣고, 스크린샷·다이어그램을 크게 볼 수 있는 라이트박스를 붙인다.

**Architecture:** 다이어그램은 React 인라인 SVG다. 사이트 CSS 변수·폰트를 상속하고 라벨은 실제 `<text>`라 오탈자가 불가능하다. 노드 위치는 사람이 정하지만 화살표 기하는 `geometry.ts`의 순수 함수가 계산한다. 라이트박스는 네이티브 `<dialog showModal()>`로 포커스 트랩·ESC·top-layer를 브라우저에 위임하고, 스크린샷과 다이어그램이 같은 셸을 공유한다.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · vitest (node env) · Playwright

**설계 문서:** `docs/superpowers/specs/2026-07-28-architecture-diagrams-and-lightbox-design.md` — 다이어그램 내용의 근거인 실코드 확인 결과가 그 문서의 "코드 확인 결과" 절에 있다. 라벨 문구가 헷갈리면 그 절이 기준이다.

---

## ⚠️ 실행 완료 (2026-07-29) — 이 문서의 코드를 그대로 복사하지 마라

브랜치 `feat/architecture-diagrams`에서 12개 태스크를 전부 실행했다. 최종 상태는
`lint` · `format:check` · `typecheck` · `test`(51) · `e2e`(30) · `build` 전부 통과다.

**실행 중 이 계획서의 코드에서 결함 8건이 나왔다.** 각 태스크 안에 `> ⚠️ 정정` 블록으로
표시해 뒀다. 이 문서를 다시 따라 할 일이 있으면 **정정 블록을 먼저 읽어라.**

| 유형 | 건수 | 어떻게 잡혔나 |
| --- | --- | --- |
| 라벨이 노드에 가려 잘림 (Task 4·6) | 2 | 브라우저 렌더 검수 — 테스트로는 안 잡힌다 |
| lint·typecheck 위반 (Task 8·9) | 3 | `npm run lint` / `npm run typecheck` |
| 옛 컴포넌트 기준으로 쓰인 Task 9 | 1 | 대상 파일을 읽고 대조 |
| geometry 퇴화 입력 (Task 2) | 2 | 코드 리뷰 |
| 그림 ↔ 문안 모순 (Task 1·5) | 1 | 코드 리뷰 + ycc-website 실코드 재확인 |

가장 중요한 교훈 두 가지.

1. **렌더를 눈으로 보지 않으면 라벨 잘림은 절대 안 잡힌다.** 좌표는 타입도 테스트도
   통과한다. Task 4·6의 브라우저 확인 단계를 건너뛰면 잘린 라벨이 그대로 배포된다.
2. **그림과 글이 서로 다른 주장을 하는 사고가 실제로 났다.** 이 작업의 존재 이유가
   그건데, 계획서 자체가 `5·3ⁿ`(문안)과 `5·3ⁿ⁻¹`(그림)로 갈려 있었다. 실코드
   `computeNextRetry`가 `5 * 3^(attempts-1)`이라 그림이 맞았다.

---

## 사전 확인 (모든 작업 공통)

- 작업 디렉터리: `c:\Users\servi\projects\portfolio`
- **`src/config/secret.ts`와 `.env`는 절대 건드리지 않는다.**
- vitest는 `src/**/*.test.ts`만 수집한다. **테스트 파일은 반드시 `.ts`** — `.tsx`로 만들면 조용히 수집되지 않는다.
- vitest 환경은 `node`다. jsdom·testing-library가 없고 **이 작업에서 추가하지 않는다.** 컴포넌트 렌더/상호작용 검증은 Playwright가 맡는다.
- 색은 `src/app/globals.css`의 `@theme` 토큰(`text-muted`, `bg-card`, `border-line-accent` …)을 쓰고 hex를 새로 적지 않는다.
- **다이어그램 태스크(4~7)는 하나가 끝날 때마다 전부 초록이어야 한다.** 각 태스크가 id·메타·컴포넌트·레지스트리·케이스 스터디 연결을 한 번에 끝낸다.
- 커밋 메시지는 기존 이력을 따라 한국어 `feat:` / `fix:` / `test:` / `chore:` 접두사를 쓴다.

---

## 파일 구조

| 경로 | 책임 | 상태 |
| --- | --- | --- |
| `src/content/projects/diagrams.ts` | `DiagramId` 유니온 + `DIAGRAM_META`(제목·설명·크기). 순수 데이터 | 신규 (Task 4, 5~7에서 확장) |
| `src/content/projects/diagrams.test.ts` | 레지스트리 ↔ 케이스 스터디 사용처 정합성 | 신규 (Task 4) |
| `src/content/projects/case-studies.ts` | 케이스 스터디 본문. `diagram` 필드, YCC 문안 정정, 월드ENC 섹션 신설 | 수정 |
| `src/components/project/diagrams/geometry.ts` | 화살표 접점·루프 경로 계산. 순수 함수만 | 신규 (Task 2) |
| `src/components/project/diagrams/geometry.test.ts` | 위 함수 단위 테스트 | 신규 (Task 2) |
| `src/components/project/diagrams/primitives.tsx` | `DiagramSvg`·`Node`·`Arrow`·`Loop`·`Lane` | 신규 (Task 3) |
| `src/components/project/diagrams/YccWebsub.tsx` | WebSub 푸시 다이어그램 | 신규 (Task 4) |
| `src/components/project/diagrams/YccQstash.tsx` | QStash 체이닝 다이어그램 | 신규 (Task 5) |
| `src/components/project/diagrams/SumgimBlur.tsx` | 얼굴 블러 파이프라인 다이어그램 | 신규 (Task 6) |
| `src/components/project/diagrams/WorldengReservation.tsx` | 예약 이중예약 방어 다이어그램 | 신규 (Task 7) |
| `src/components/project/diagrams/index.ts` | `DIAGRAMS: Record<DiagramId, ComponentType<DiagramProps>>` | 신규 (Task 4, 5~7에서 확장) |
| `src/components/project/CaseStudyDiagram.tsx` | figure 셸 · 가로 스크롤 · 확대 버튼 | 신규 (Task 4, Task 10에서 확대) |
| `src/components/project/CaseStudyBody.tsx` | 섹션 헤딩과 카드 사이에 다이어그램 슬롯 | 수정 (Task 4) |
| `src/components/project/Lightbox.tsx` | dialog 셸 · 키보드 · fit/1:1 · 카운터 | 신규 (Task 8) |
| `src/components/project/ShotGallery.tsx` | 썸네일 그리드 + 라이트박스 연결 | 신규 (Task 9) |
| `src/components/project/CaseStudyShots.tsx` | `ShotGallery`로 대체 | 삭제 (Task 9) |
| `src/app/projects/[slug]/page.tsx` | `CaseStudyShots` → `ShotGallery` 교체 | 수정 (Task 9) |
| `src/app/globals.css` | `dialog::backdrop` + 페이드 | 수정 (Task 8) |
| `e2e/diagrams.spec.ts` | 다이어그램·라이트박스 E2E | 신규 (Task 11) |

---

## Phase 0 — 문안 정정

### Task 1: 영천중앙교회 케이스 스터디 문안을 실코드에 맞춘다

다이어그램이 실코드를 그리므로, 같은 섹션의 카드 문장이 코드와 다르면 그림과 글이 서로 다른 주장을 하게 된다. 다이어그램보다 먼저 고친다.

**Files:**
- Modify: `src/content/projects/case-studies.ts`

- [ ] **Step 1: 백필 서술 정정**

`"ycc-website"` → `sections` → `## 설교 자동 동기화 — WebSub 푸시` → 두 번째 카드 `콜백 보안 2겹 + 구독 자동 갱신`을 찾는다. 현재 `description` 마지막 문장이 `"누락분은 재생목록 순회 백필로 보완"`인데, `reconcileSermons`는 재생목록을 순회하지 않고 채널 최신 영상 목록과 DB를 대조한다. 카드 전체를 아래로 교체한다.

```ts
          {
            title: "콜백 보안 2겹 + 구독 자동 갱신",
            description:
              "구독 검증은 우리 채널 토픽일 때만 hub.challenge 에코, 알림은 X-Hub-Signature(HMAC-SHA1)를 timing-safe 비교로 위조 차단. WebSub 리스 만료는 2일 주기 QStash cron 재구독으로 방지, 푸시 소실분은 매일 채널 최신 영상과 DB를 대조하는 보정 잡으로 주워 담는다.",
          },
```

- [ ] **Step 2: 재시도 서술 정정**

같은 프로젝트 `## AI 요약 파이프라인 — 서버리스 메시지 큐` → 두 번째 카드 `동시성 제어 + 서버리스식 백오프`를 찾는다. 현재 문장은 재시도 메커니즘 두 개를 하나로 뭉갰다. 실제로는 ingest·자막 단계가 QStash delay 고정 30분 재시도, 요약 단계가 DB 백오프 + 매시간 스위퍼다. 카드 전체를 아래로 교체한다. **`title`도 바뀐다.**

```ts
          {
            title: "동시성 제어 + 서버리스식 재시도",
            description:
              "Postgres CTE UPDATE...RETURNING으로 설교 1건을 원자적 선점해 중복 요약 차단. sleep이 불가능하므로 재시도를 두 갈래로 나눴다 — 영상·자막 미준비는 QStash 지연 발행으로 30분 뒤 재투입(최대 12회), 요약 실패는 다음 시각(5·3ⁿ⁻¹분)을 DB에 적어 두고 매시간 스위퍼가 최대 3회까지 회수한다. Gemini responseSchema로 요점·타임스탬프 챕터를 JSON 스키마로 강제.",
          },
```

> ⚠️ **정정** — 원안은 `5·3ⁿ분`이었고 상한을 적지 않았다. 위 코드는 고친 뒤의 값이다.
>
> `ycc-website/src/lib/sermons/summarize.ts`의 실제 구현은
> `computeNextRetry`가 `5 * Math.pow(3, Math.max(0, attempts - 1))`,
> `MAX_SUMMARY_ATTEMPTS = 3`이다. 즉 **5·3ⁿ⁻¹분, 최대 3회**다.
> `5·3ⁿ`으로 적으면 첫 재시도가 5분이 아니라 15분이 되어 사실과 다르고,
> Task 5가 그리는 다이어그램 노드(`5 × 3ⁿ⁻¹ 분`)와도 어긋난다.
> 같은 이유로 Task 5의 `DIAGRAM_META["ycc-qstash"].desc`도 함께 고쳐야 한다.

- [ ] **Step 3: 검증**

```bash
npm run test
npm run typecheck
```

기대: 둘 다 통과. 기존 `meta.test.ts`·`assets.test.ts`가 그대로 통과해야 한다.

- [ ] **Step 4: 커밋**

```bash
git add src/content/projects/case-studies.ts
git commit -m "fix: 영천중앙교회 백필·재시도 서술을 실제 구현에 맞게 정정"
```

---

## Phase 1 — 다이어그램 기반

### Task 2: 좌표 계산 순수 함수

화살표 좌표를 손으로 적지 않기 위한 핵심이다. JSX와 분리해야 vitest(node env)에서 테스트할 수 있다.

**Files:**
- Create: `src/components/project/diagrams/geometry.ts`
- Test: `src/components/project/diagrams/geometry.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/components/project/diagrams/geometry.test.ts
import { describe, expect, it } from "vitest";
import { anchor, loopPath, midpoint, type Box } from "./geometry";

const box = (x: number, y: number): Box => ({ x, y, w: 100, h: 60 });

/** 점이 박스 경계 위(모서리 포함, 오차 0.01)에 있는지 */
function onBorder(p: { x: number; y: number }, b: Box): boolean {
  const inX = p.x >= b.x - 0.01 && p.x <= b.x + b.w + 0.01;
  const inY = p.y >= b.y - 0.01 && p.y <= b.y + b.h + 0.01;
  const onVertical =
    Math.abs(p.x - b.x) < 0.01 || Math.abs(p.x - (b.x + b.w)) < 0.01;
  const onHorizontal =
    Math.abs(p.y - b.y) < 0.01 || Math.abs(p.y - (b.y + b.h)) < 0.01;
  return inX && inY && (onVertical || onHorizontal);
}

describe("anchor", () => {
  it("수평으로 나란한 박스면 오른쪽 변 중점을 반환한다", () => {
    expect(anchor(box(0, 0), box(200, 0))).toEqual({ x: 100, y: 30 });
  });

  it("왼쪽으로 향하면 왼쪽 변 중점을 반환한다", () => {
    expect(anchor(box(200, 0), box(0, 0))).toEqual({ x: 200, y: 30 });
  });

  it("수직으로 나란한 박스면 아래 변 중점을 반환한다", () => {
    expect(anchor(box(0, 0), box(0, 200))).toEqual({ x: 50, y: 60 });
  });

  it("위로 향하면 위 변 중점을 반환한다", () => {
    expect(anchor(box(0, 200), box(0, 0))).toEqual({ x: 50, y: 200 });
  });

  it("대각선 배치에서도 반환점이 박스 경계 위에 있다", () => {
    const a = box(0, 0);
    const b = box(180, 140);
    expect(onBorder(anchor(a, b), a)).toBe(true);
    expect(onBorder(anchor(b, a), b)).toBe(true);
  });

  it("가파른 대각선에서도 반환점이 박스 경계 위에 있다", () => {
    const a = box(0, 0);
    const b = box(20, 400);
    expect(onBorder(anchor(a, b), a)).toBe(true);
    expect(onBorder(anchor(b, a), b)).toBe(true);
  });

  it("두 박스 중심이 같으면 오른쪽 변 중점으로 폴백한다", () => {
    expect(anchor(box(0, 0), box(0, 0))).toEqual({ x: 100, y: 30 });
  });
});

describe("loopPath", () => {
  it("노드 오른쪽 변에서 나가 같은 변으로 되돌아온다", () => {
    const d = loopPath(box(0, 0), 30);
    expect(d.startsWith("M 100 ")).toBe(true);
    expect(d.endsWith("H 100")).toBe(true);
    expect(d).toContain("A ");
  });
});

describe("midpoint", () => {
  it("두 점의 중점을 반환한다", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/components/project/diagrams/geometry.test.ts`
기대: FAIL — `Failed to resolve import "./geometry"`

- [ ] **Step 3: 구현**

```ts
// src/components/project/diagrams/geometry.ts
// 다이어그램 좌표 계산. JSX가 섞이지 않은 순수 함수만 둔다 —
// vitest가 node 환경이라 렌더 없이 테스트할 수 있는 유일한 층이다.

export type Box = { x: number; y: number; w: number; h: number };

export type Point = { x: number; y: number };

const center = (b: Box): Point => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/**
 * a에서 b를 향할 때 a의 경계와 만나는 점.
 * 중심을 잇는 방향의 지배 축을 판정해 마주 보는 변 위의 점을 돌려주므로,
 * 어떤 배치에서도 선이 박스 안에서 시작하거나 허공에서 끝나지 않는다.
 */
export function anchor(a: Box, b: Box): Point {
  const ca = center(a);
  const cb = center(b);
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;

  // 중심이 같으면 방향을 정할 수 없다 — 오른쪽으로 폴백한다.
  if (dx === 0 && dy === 0) return { x: a.x + a.w, y: ca.y };

  // |dx|/|dy| 와 (w/2)/(h/2) 를 곱셈으로 비교해 0 나눗셈을 피한다.
  if (Math.abs(dx) * a.h >= Math.abs(dy) * a.w) {
    return {
      x: dx > 0 ? a.x + a.w : a.x,
      y: ca.y + (dy / Math.abs(dx)) * (a.w / 2),
    };
  }
  return {
    x: ca.x + (dx / Math.abs(dy)) * (a.h / 2),
    y: dy > 0 ? a.y + a.h : a.y,
  };
}

/**
 * 재시도 표현용 되돌이 경로. 노드 오른쪽 변에서 나가 out만큼 밖으로 돌았다가
 * 같은 변 아래쪽으로 되돌아온다. 화살촉은 되돌아오는 끝에 붙는다.
 */
export function loopPath(b: Box, out: number, radius = 12): string {
  const x = b.x + b.w;
  const y1 = b.y + b.h * 0.3;
  const y2 = b.y + b.h * 0.75;
  const far = x + out;
  return [
    `M ${x} ${y1}`,
    `H ${far - radius}`,
    `A ${radius} ${radius} 0 0 1 ${far} ${y1 + radius}`,
    `V ${y2 - radius}`,
    `A ${radius} ${radius} 0 0 1 ${far - radius} ${y2}`,
    `H ${x}`,
  ].join(" ");
}

/** 두 점의 중점 — 경로 라벨을 놓을 자리 */
export function midpoint(p: Point, q: Point): Point {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
```

> ⚠️ **정정** — 위 `anchor`·`loopPath`에 퇴화 입력 결함이 둘 있다. 현재 다이어그램
> 값으로는 도달하지 않지만, 순수층이고 재사용을 전제로 만든 함수라 고쳐 두는 편이 낫다.
>
> 1. **`anchor`가 폭 0인 박스에서 `NaN`을 반환한다.** `a.w === 0`이면 지배축 비교가
>    `0 >= 0`으로 수평 분기에 들어가는데, `dx`도 0이면 `dy / Math.abs(dx)`가 `Infinity`가
>    되고 `Infinity * 0`이 `NaN`이 된다. **NaN 좌표는 예외도 경고도 없이 선을 지운다** —
>    가장 알아채기 어려운 실패다. `if (dx === 0 && dy === 0)` 폴백 바로 뒤에
>    `if (a.w === 0) return ca;`를 넣는다(퇴화한 박스는 중심이 경계 위의 점이다).
> 2. **`loopPath`가 반경을 제한하지 않는다.** 노드가 낮으면 두 접점 간격
>    (`0.45 * h`)이 반경 2배보다 작아져 `V ${y2 - radius}`가 첫 호의 끝보다 위를
>    가리키고 경로가 역주행한다. `radius > out`이면 첫 수평선이 노드 안쪽에서 시작한다.
>    `const r = Math.max(0, Math.min(radius, out, (y2 - y1) / 2));`로 깎고 이후 전부 `r`을
>    쓴다. 현재 값(`h=96`, `out=34`)에서는 12가 그대로 유지된다.
>
> 테스트도 함께 늘렸다 — 폭 0 박스에서 유한 좌표, 여러 방향에서 유한 좌표,
> 낮은 노드에서 경로 비역주행, `out < radius`에서 수평선 시작점, 기존 값에서 반경 12 유지.
> 최종 `geometry.test.ts`는 14 tests다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/project/diagrams/geometry.test.ts`
기대: PASS — 9 tests (위 정정을 함께 적용하면 14 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/components/project/diagrams/geometry.ts src/components/project/diagrams/geometry.test.ts
git commit -m "feat: 다이어그램 화살표 좌표 계산 순수 함수"
```

---

### Task 3: SVG 프리미티브

**Files:**
- Create: `src/components/project/diagrams/primitives.tsx`

- [ ] **Step 1: 구현**

`useId()`로 마커 id를 인스턴스마다 유니크하게 만드는 것이 핵심이다. 라이트박스가 열리면 같은 다이어그램이 문서에 두 벌 존재하는데, `<marker id="head">`가 중복되면 `url(#head)`가 먼저 나온 쪽에 붙어 한쪽 화살촉이 사라진다.

```tsx
// src/components/project/diagrams/primitives.tsx
"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { anchor, loopPath, midpoint, type Box } from "./geometry";

/** 다이어그램이 선언하는 노드. 위치는 사람이 정하고 화살표 기하는 파생된다. */
export type DiagramNode = Box & {
  id: string;
  title: string;
  /** 제목 아래 모노 보조 문구. 줄바꿈은 배열 원소로 나눈다. */
  notes?: string[];
  accent?: boolean;
};

export type NodeMap = Record<string, DiagramNode>;

export function nodeMap(nodes: DiagramNode[]): NodeMap {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

// 같은 문서에 다이어그램이 여러 벌 있을 때 marker id가 충돌하지 않도록
// 인스턴스별 접두사를 내려보낸다.
const PrefixContext = createContext("d");

const TITLE_DY = 22;
const NOTE_TOP = 38;
const NOTE_LINE = 13;

export function DiagramSvg({
  titleId,
  descId,
  title,
  desc,
  width,
  height,
  children,
}: {
  titleId: string;
  descId: string;
  title: string;
  desc: string;
  width: number;
  height: number;
  children: ReactNode;
}) {
  // useId()는 ":r1:" 형태를 반환한다. url(#...) 참조에서 콜론이 문제를 일으키므로 뺀다.
  const prefix = useId().replace(/:/g, "");
  return (
    <PrefixContext.Provider value={prefix}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        // 부모가 폭을 제한해도 좌표계를 유지한다. 축소하면 11px 라벨이 안 읽힌다.
        className="max-w-none"
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{desc}</desc>
        <defs>
          <marker
            id={`${prefix}-head`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-muted)" />
          </marker>
          <marker
            id={`${prefix}-head-accent`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-accent)" />
          </marker>
        </defs>
        {children}
      </svg>
    </PrefixContext.Provider>
  );
}

/** 레인 배경 — "왜 이쪽은 순차이고 저쪽은 병렬인가"를 배치로 보여줄 때 쓴다. */
export function Lane({ x, y, w, h, label }: Box & { label: string }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill="var(--color-rail)"
        stroke="var(--color-line)"
        strokeDasharray="3 4"
      />
      <text
        x={x + 14}
        y={y + 20}
        className="font-mono"
        fontSize={11}
        fill="var(--color-faint)"
      >
        {label}
      </text>
    </g>
  );
}

export function Node({ node }: { node: DiagramNode }) {
  const { x, y, w, h, title, notes = [], accent } = node;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={accent ? "var(--color-card-hi)" : "var(--color-card)"}
        stroke={accent ? "var(--color-line-accent)" : "var(--color-line)"}
      />
      <text
        x={x + 14}
        y={y + TITLE_DY}
        fontSize={13}
        fill={accent ? "var(--color-accent)" : "var(--color-ink)"}
      >
        {title}
      </text>
      {notes.map((note, i) => (
        <text
          key={i}
          x={x + 14}
          y={y + NOTE_TOP + i * NOTE_LINE}
          className="font-mono"
          fontSize={10.5}
          fill="var(--color-muted)"
        >
          {note}
        </text>
      ))}
    </g>
  );
}

function EdgeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="font-mono"
      fontSize={11}
      fill="var(--color-muted)"
      // 라벨 폭을 추정해 배경 사각형을 그리면 반드시 어긋난다.
      // 페이지 배경색으로 후광을 둘러 선 위에서 읽히게 한다.
      stroke="var(--color-page)"
      strokeWidth={4}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

export function Arrow({
  nodes,
  from,
  to,
  label,
  accent,
  dashed,
  /** 라벨을 경로 중점에서 위아래로 밀어야 할 때 */
  labelDy = -6,
}: {
  nodes: NodeMap;
  from: string;
  to: string;
  label?: string;
  accent?: boolean;
  dashed?: boolean;
  labelDy?: number;
}) {
  const prefix = useContext(PrefixContext);
  const a = nodes[from];
  const b = nodes[to];
  // 노드 id는 같은 파일 안의 문자열 리터럴이라 타입이 잡아주지 못한다.
  // 조용히 안 그려지는 것보다 즉시 터지는 편이 낫다 — dev에서 바로 잡힌다.
  if (!a || !b) throw new Error(`Arrow: 알 수 없는 노드 id (${from} → ${to})`);

  const start = anchor(a, b);
  const end = anchor(b, a);
  const mid = midpoint(start, end);
  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={accent ? "var(--color-accent)" : "var(--color-line)"}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5 4" : undefined}
        markerEnd={`url(#${prefix}-head${accent ? "-accent" : ""})`}
      />
      {label && <EdgeLabel x={mid.x} y={mid.y + labelDy} text={label} />}
    </g>
  );
}

/** 재시도 되돌이 경로 전용. 노드 오른쪽으로 나갔다 같은 노드로 돌아온다. */
export function Loop({
  nodes,
  on,
  label,
  out = 34,
}: {
  nodes: NodeMap;
  on: string;
  label: string;
  out?: number;
}) {
  const prefix = useContext(PrefixContext);
  const node = nodes[on];
  if (!node) throw new Error(`Loop: 알 수 없는 노드 id (${on})`);
  return (
    <g>
      <path
        d={loopPath(node, out)}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
        markerEnd={`url(#${prefix}-head)`}
      />
      <text
        x={node.x + node.w + out + 8}
        y={node.y + node.h / 2 + 4}
        className="font-mono"
        fontSize={10.5}
        fill="var(--color-muted)"
      >
        {label}
      </text>
    </g>
  );
}
```

- [ ] **Step 2: 타입 검사**

Run: `npm run typecheck`
기대: PASS

- [ ] **Step 3: 커밋**

```bash
git add src/components/project/diagrams/primitives.tsx
git commit -m "feat: 다이어그램 SVG 프리미티브"
```

---

## Phase 2 — 다이어그램 4장

### Task 4: 첫 다이어그램 — 영천중앙교회 WebSub 푸시

이 태스크가 배선 전체(메타·테스트·레지스트리·figure 셸·본문 슬롯)를 함께 만든다. Task 5~7은 여기에 항목만 더한다.

**Files:**
- Create: `src/content/projects/diagrams.ts`
- Test: `src/content/projects/diagrams.test.ts`
- Create: `src/components/project/diagrams/YccWebsub.tsx`
- Create: `src/components/project/diagrams/index.ts`
- Create: `src/components/project/CaseStudyDiagram.tsx`
- Modify: `src/components/project/CaseStudyBody.tsx`
- Modify: `src/content/projects/case-studies.ts`

- [ ] **Step 1: 다이어그램 메타 (id 1개로 시작)**

```ts
// src/content/projects/diagrams.ts
// 다이어그램의 신원(id)과 접근성 텍스트·좌표계 크기. 순수 데이터라 컴포넌트를 import하지 않는다.
// SVG 컴포넌트 레지스트리는 src/components/project/diagrams/index.ts에 있고,
// Record<DiagramId, ComponentType>이라 여기 id를 추가하고 컴포넌트를 안 만들면 타입 검사가 깨진다.

export type DiagramId = "ycc-websub";

export type DiagramMeta = {
  /** svg <title> — 라이트박스 헤더와 접근가능 이름으로도 쓴다 */
  title: string;
  /** svg <desc> — 스크린리더 사용자에게는 이 문장이 다이어그램의 전부다 */
  desc: string;
  /** viewBox 크기이자 인라인 렌더 시 최소 폭 */
  width: number;
  height: number;
};

export const DIAGRAM_META: Record<DiagramId, DiagramMeta> = {
  "ycc-websub": {
    title: "설교 자동 동기화 — WebSub 푸시 경로",
    desc: "YouTube 채널에 영상이 올라오면 PubSubHubbub 허브가 Atom XML을 콜백으로 푸시한다. 콜백은 X-Hub-Signature를 HMAC-SHA1로 timing-safe 검증한 뒤 videoId를 파싱해 QStash에 ingest-video 잡을 발행한다. 구독 검증 요청은 채널 토픽이 일치할 때만 challenge를 에코한다. 별도로 2일 주기 cron이 구독을 재갱신하고, 매일 cron이 채널 최신 영상과 DB를 대조해 푸시 소실분을 보정 등록한다.",
    width: 940,
    height: 470,
  },
};
```

- [ ] **Step 2: 실패하는 정합성 테스트 작성**

`DIAGRAM_META`가 `Record<DiagramId, DiagramMeta>`라 "id가 있는데 메타가 없다"는 타입 검사가 잡는다. 런타임 테스트는 **케이스 스터디와의 연결**만 본다.

```ts
// src/content/projects/diagrams.test.ts
import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/projects/case-studies";
import { DIAGRAM_META } from "@/content/projects/diagrams";

/** 케이스 스터디 전체에서 실제로 참조된 다이어그램 id */
function usedDiagramIds(): Set<string> {
  const used = new Set<string>();
  for (const study of Object.values(caseStudies)) {
    for (const section of study.sections) {
      if ("cards" in section && section.diagram) used.add(section.diagram);
    }
  }
  return used;
}

describe("DIAGRAM_META", () => {
  it("케이스 스터디가 참조하는 id가 전부 정의돼 있다", () => {
    for (const id of usedDiagramIds()) {
      expect(DIAGRAM_META, `${id}에 메타가 없다`).toHaveProperty(id);
    }
  });

  it("정의만 해두고 안 쓰는 다이어그램이 없다", () => {
    const used = usedDiagramIds();
    const orphans = Object.keys(DIAGRAM_META).filter((id) => !used.has(id));
    expect(orphans).toEqual([]);
  });

  it("모든 항목이 비어 있지 않은 title·desc와 양수 크기를 갖는다", () => {
    for (const [id, meta] of Object.entries(DIAGRAM_META)) {
      expect(meta.title.trim(), `${id}.title`).not.toBe("");
      expect(meta.desc.trim(), `${id}.desc`).not.toBe("");
      expect(meta.width, `${id}.width`).toBeGreaterThan(0);
      expect(meta.height, `${id}.height`).toBeGreaterThan(0);
    }
  });

  it("desc는 스크린리더가 흐름을 파악할 만큼 서술적이다", () => {
    for (const [id, meta] of Object.entries(DIAGRAM_META)) {
      expect(meta.desc.length, `${id}.desc가 너무 짧다`).toBeGreaterThan(80);
    }
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npx vitest run src/content/projects/diagrams.test.ts`
기대: FAIL — `정의만 해두고 안 쓰는 다이어그램이 없다`에서 `["ycc-websub"]`가 orphan으로 잡힌다. 아직 케이스 스터디에 연결하지 않았으니 정상이다.

- [ ] **Step 4: `case-studies.ts`에 `diagram` 필드 타입 추가**

파일 상단 import에 한 줄을 더한다.

```ts
import type { DiagramId } from "@/content/projects/diagrams";
```

`CaseStudySection` 타입을 아래로 교체한다. prose 변형은 건드리지 않는다.

```ts
export type CaseStudySection =
  | { heading: string; prose: ProseSegment[] }
  | { heading: string; diagram?: DiagramId; cards: Card[]; columns?: 2 };
```

- [ ] **Step 5: 다이어그램 컴포넌트**

```tsx
// src/components/project/diagrams/YccWebsub.tsx
"use client";

import { DIAGRAM_META } from "@/content/projects/diagrams";
import {
  Arrow,
  DiagramSvg,
  Node,
  nodeMap,
  type DiagramNode,
} from "./primitives";

const META = DIAGRAM_META["ycc-websub"];

const NODES: DiagramNode[] = [
  {
    id: "yt",
    x: 24,
    y: 30,
    w: 190,
    h: 58,
    title: "YouTube 채널",
    notes: ["설교 영상 업로드"],
  },
  {
    id: "hub",
    x: 274,
    y: 30,
    w: 210,
    h: 58,
    title: "PubSubHubbub 허브",
    notes: ["pubsubhubbub.appspot.com"],
  },
  {
    id: "callback",
    x: 544,
    y: 14,
    w: 250,
    h: 90,
    title: "POST /api/youtube/websub",
    notes: [
      "X-Hub-Signature HMAC-SHA1",
      "timingSafeEqual 비교",
      "at:deleted-entry 무시",
    ],
    accent: true,
  },
  {
    id: "publish",
    x: 594,
    y: 160,
    w: 200,
    h: 58,
    title: "QStash ingest-video",
    notes: ["yt:videoId 발행"],
    accent: true,
  },
  {
    id: "verify",
    x: 544,
    y: 262,
    w: 250,
    h: 72,
    title: "GET /api/youtube/websub",
    notes: ["hub.topic 일치 → challenge 에코", "불일치 → 404"],
  },
  {
    id: "renew",
    x: 274,
    y: 262,
    w: 210,
    h: 72,
    title: "websub-renew",
    notes: ["QStash cron 2일", "리스 만료 전 재구독"],
  },
  {
    id: "reconcile",
    x: 274,
    y: 372,
    w: 210,
    h: 72,
    title: "reconcile-sermons",
    notes: ["QStash cron 매일", "yt-api /channel/videos"],
  },
  {
    id: "db",
    x: 594,
    y: 372,
    w: 200,
    h: 72,
    title: "Neon sermons",
    notes: ["DB 대조 → 누락분", "직접 등록"],
  },
];

const N = nodeMap(NODES);

export function YccWebsub({
  titleId,
  descId,
}: {
  titleId: string;
  descId: string;
}) {
  return (
    <DiagramSvg
      titleId={titleId}
      descId={descId}
      title={META.title}
      desc={META.desc}
      width={META.width}
      height={META.height}
    >
      {/* 화살표를 먼저 그린다 — SVG는 나중에 그린 것이 위에 오므로 노드 박스가 선을 덮는다. */}
      <Arrow nodes={N} from="yt" to="hub" label="업로드" accent />
      <Arrow nodes={N} from="hub" to="callback" label="Atom XML push" accent />
      <Arrow nodes={N} from="callback" to="publish" label="videoId 파싱" accent />
      <Arrow nodes={N} from="renew" to="hub" label="재구독" dashed />
      <Arrow nodes={N} from="hub" to="verify" label="구독 검증" dashed />
      <Arrow nodes={N} from="reconcile" to="db" label="푸시 소실분 보정" dashed />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
```

- [ ] **Step 6: 레지스트리**

```ts
// src/components/project/diagrams/index.ts
import type { ComponentType } from "react";
import type { DiagramId } from "@/content/projects/diagrams";
import { YccWebsub } from "./YccWebsub";

export type DiagramProps = { titleId: string; descId: string };

// Record<DiagramId, ...>라서 id를 늘리고 컴포넌트를 안 만들면 타입 검사가 깨진다.
export const DIAGRAMS: Record<DiagramId, ComponentType<DiagramProps>> = {
  "ycc-websub": YccWebsub,
};
```

- [ ] **Step 7: `CaseStudyDiagram` 셸**

라이트박스는 Task 10에서 붙인다. 지금은 figure + 가로 스크롤만 만든다.

```tsx
// src/components/project/CaseStudyDiagram.tsx
"use client";

import { useId } from "react";
import { DIAGRAMS } from "@/components/project/diagrams";
import { DIAGRAM_META, type DiagramId } from "@/content/projects/diagrams";

export function CaseStudyDiagram({ id }: { id: DiagramId }) {
  const meta = DIAGRAM_META[id];
  const Diagram = DIAGRAMS[id];
  const base = useId().replace(/:/g, "");

  return (
    <figure className="mb-6">
      {/* 축소하지 않고 가로 스크롤한다 — 줄이면 11px 라벨이 안 읽힌다.
          globals.css의 .prose-scroll 규약을 따른다. */}
      <div className="prose-scroll max-w-full rounded-lg border border-line bg-page p-3">
        <Diagram titleId={`${base}-title`} descId={`${base}-desc`} />
      </div>
      <figcaption className="mt-2.5 font-mono text-[11px] text-faint">
        ↑ {meta.title}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 8: `CaseStudyBody`에 슬롯 삽입**

`src/components/project/CaseStudyBody.tsx` 전체를 아래로 교체한다. cards 분기에서 헤딩과 카드 그리드 사이에 다이어그램이 들어간다.

```tsx
import { CaseStudyDiagram } from "@/components/project/CaseStudyDiagram";
import type { CaseStudySection } from "@/content/projects/case-studies";

export function CaseStudyBody({
  sections,
}: {
  sections: readonly CaseStudySection[];
}) {
  return (
    <div className="flex flex-col gap-9">
      {sections.map((section) => (
        <section key={section.heading}>
          {/* 헤딩이 `## 문제` 같은 마크다운 표기 그대로 보이는 게 디자인 의도다. */}
          <h2 className="mb-4 font-mono text-[12.5px] font-normal text-faint">
            {section.heading}
          </h2>

          {"prose" in section ? (
            <p className="max-w-[680px] text-sm leading-[1.9] text-pretty text-muted">
              {section.prose.map((segment, index) =>
                typeof segment === "string" ? (
                  segment
                ) : (
                  <span key={index} className="text-ink">
                    {segment.em}
                  </span>
                ),
              )}
            </p>
          ) : (
            <>
              {/* 그림이 전체 흐름을 먼저 보여주고 카드가 각 단계를 상술한다. */}
              {section.diagram && <CaseStudyDiagram id={section.diagram} />}
              <div
                className={`grid gap-3.5 ${section.columns === 2 ? "md:grid-cols-2" : ""}`}
              >
                {section.cards.map((card) => (
                  <div
                    key={card.title}
                    className={`rounded-md border p-[22px_26px] ${
                      card.accent
                        ? "border-line-accent bg-linear-to-b from-card-hi to-card"
                        : "border-line bg-card"
                    }`}
                  >
                    <strong className="text-[15px]">{card.title}</strong>
                    <p className="mt-2 text-[13px] leading-[1.8] text-muted">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: 케이스 스터디에 연결**

`"ycc-website"` → `## 설교 자동 동기화 — WebSub 푸시` 섹션에 `diagram` 한 줄을 더한다.

```ts
      {
        heading: "## 설교 자동 동기화 — WebSub 푸시",
        diagram: "ycc-websub",
        cards: [
```

- [ ] **Step 10: 전부 초록인지 확인**

```bash
npm run test
npm run typecheck
```

기대: 둘 다 통과. Step 3에서 빨갛던 orphan 테스트가 초록으로 바뀐다.

- [ ] **Step 11: 브라우저 확인**

dev 서버(`npm run dev`)에서 `http://localhost:3000/projects/ycc-website`를 연다.

확인할 것:
- 다이어그램이 보이고 **모든 선 끝에 화살촉**이 있다
- 선이 박스 안에서 시작하거나 허공에서 끝나지 않는다
- 경로 라벨이 선에 가려지지 않는다 (후광이 먹었는지)
- 노드 박스끼리 겹치지 않고, 보조 문구가 박스를 넘치지 않는다
- `WebSub` · `PubSubHubbub` · `QStash` · `HMAC-SHA1` · `timingSafeEqual` 표기가 정확하다

겹치거나 잘리면 `NODES`의 `x`/`y`/`w`/`h`와 `DIAGRAM_META["ycc-websub"]`의 `width`/`height`를 조정한다. 화살표는 따라온다.

> ⚠️ **정정 — 실제로 잘렸다.** `hub`(오른쪽 끝 484)와 `callback`(왼쪽 244... 원안 544)
> 사이 간격이 60px인데 `"Atom XML push"` 라벨이 약 86px이라 양쪽 박스에 먹혀
> `om XML pu`로 보였다. 라벨은 두 접점의 중점에 그려지므로 **간격보다 길면 무조건 잘린다.**
>
> 적용한 값: 오른쪽 열(`callback`·`publish`·`verify`·`db`)을 40px 밀어
> `callback.x` 544 → **584**, `publish.x` 594 → **634**, `verify.x` 544 → **584**,
> `db.x` 594 → **634**. 간격이 100px가 되어 라벨이 들어간다. 남는 오른쪽 여백만큼
> `DIAGRAM_META["ycc-websub"].width`를 940 → **858**로 줄여 좌우 여백을 24px로 맞췄다.
>
> **교훈:** 라벨을 붙인 화살표는 두 노드 간격이 `라벨 길이 + 여유`보다 커야 한다.
> 한국어는 11px 모노에서 글자당 약 10.5px, ASCII는 약 6.6px로 어림하면 된다.

- [ ] **Step 12: 커밋**

```bash
git add src/content/projects src/components/project
git commit -m "feat: 영천중앙교회 WebSub 푸시 아키텍처 다이어그램"
```

---

### Task 5: 영천중앙교회 — QStash 체이닝 다이어그램

두 재시도 메커니즘이 다르다는 것이 이 그림의 핵심이다. 하나로 뭉개지 않는다.

**Files:**
- Create: `src/components/project/diagrams/YccQstash.tsx`
- Modify: `src/content/projects/diagrams.ts`
- Modify: `src/components/project/diagrams/index.ts`
- Modify: `src/content/projects/case-studies.ts`

- [ ] **Step 1: id와 메타 추가**

`src/content/projects/diagrams.ts`의 `DiagramId`를 넓힌다.

```ts
export type DiagramId = "ycc-websub" | "ycc-qstash";
```

`DIAGRAM_META`에 항목을 더한다.

```ts
  "ycc-qstash": {
    title: "AI 요약 파이프라인 — QStash 단계 체이닝과 두 갈래 재시도",
    desc: "ingest-video, fetch-transcript, summarize 세 잡을 QStash 메시지로 이어 붙여 서버리스 실행 시간 제한을 피한다. 모든 잡 입구에서 QStash 서명을 검증한다. 영상 정보나 자막이 준비되지 않으면 QStash 지연 발행으로 30분 뒤 재투입하며 최대 12회 반복한다. 요약 실패는 다음 재시도 시각을 5 곱하기 3의 n 빼기 1 제곱 분으로 DB에 적어 두고 매시간 스위퍼가 최대 3회까지 회수한다. 요약은 CTE 원자적 선점으로 중복 실행을 막는다.",
    width: 940,
    height: 520,
  },
```

> ⚠️ **정정** — 원안의 `desc`는 "5 곱하기 3의 n제곱 분"이었다. 아래 컴포넌트가 그리는
> 노드 라벨은 `5 × 3ⁿ⁻¹ 분`인데 `desc`만 `5 × 3ⁿ`이라, **스크린리더 사용자와 시각
> 사용자가 서로 다른 설명을 듣게 된다**(n=1에서 15분 vs 5분). `desc`는 다이어그램의
> 대체 텍스트이므로 그림과 한 글자도 어긋나면 안 된다. Task 1 정정 블록과 같은 근거다.

- [ ] **Step 2: 다이어그램 컴포넌트**

```tsx
// src/components/project/diagrams/YccQstash.tsx
"use client";

import { DIAGRAM_META } from "@/content/projects/diagrams";
import {
  Arrow,
  DiagramSvg,
  Loop,
  Node,
  nodeMap,
  type DiagramNode,
} from "./primitives";

const META = DIAGRAM_META["ycc-qstash"];

const NODES: DiagramNode[] = [
  {
    id: "ingest",
    x: 24,
    y: 40,
    w: 268,
    h: 96,
    title: "ingest-video",
    notes: [
      "verifyQStash 서명 검증",
      "sermonExists 중복 차단",
      "yt-api /video/info",
      "classifyByTitle → 예배 구분",
    ],
    accent: true,
  },
  {
    id: "transcript",
    x: 24,
    y: 220,
    w: 268,
    h: 96,
    title: "fetch-transcript",
    notes: [
      "verifyQStash 서명 검증",
      "yt-api /subtitles → ko 트랙",
      "timedtext XML 직접 파싱",
      "sermon_transcripts upsert",
    ],
    accent: true,
  },
  {
    id: "summarize",
    x: 24,
    y: 400,
    w: 268,
    h: 84,
    title: "summarize",
    notes: [
      "verifyQStash 서명 검증",
      "WITH claimed AS (UPDATE…RETURNING)",
      "Gemini responseSchema",
    ],
    accent: true,
  },
  {
    id: "sweeper",
    x: 620,
    y: 166,
    w: 230,
    h: 72,
    title: "retry-summaries",
    notes: ["QStash cron 매시간", "경과분 회수 → 재투입"],
  },
  {
    id: "backoff",
    x: 620,
    y: 286,
    w: 230,
    // 정정: 보조 문구가 세 줄이라 다른 노드(두 줄, h=72)보다 한 줄만큼 높다.
    // h를 72로 두면 "최대 3회"가 박스 하단에 붙어 여백이 무너진다.
    h: 86,
    title: "summary_next_retry_at",
    notes: ["5 × 3ⁿ⁻¹ 분", "DB에 다음 시각 기록", "최대 3회"],
  },
  {
    id: "db",
    x: 620,
    y: 406,
    w: 230,
    h: 72,
    title: "Neon",
    notes: ["quick_summary · chapters", "summary_status = ready"],
  },
];

const N = nodeMap(NODES);

export function YccQstash({
  titleId,
  descId,
}: {
  titleId: string;
  descId: string;
}) {
  return (
    <DiagramSvg
      titleId={titleId}
      descId={descId}
      title={META.title}
      desc={META.desc}
      width={META.width}
      height={META.height}
    >
      <Arrow nodes={N} from="ingest" to="transcript" label="QStash 발행" accent />
      <Arrow
        nodes={N}
        from="transcript"
        to="summarize"
        label="QStash 발행"
        accent
      />
      <Arrow nodes={N} from="summarize" to="db" label="ready" accent />
      <Arrow nodes={N} from="summarize" to="backoff" label="실패" dashed />
      <Arrow nodes={N} from="backoff" to="sweeper" label="경과 대기" dashed />
      <Arrow nodes={N} from="sweeper" to="summarize" label="재투입" dashed />
      {/* 고정 30분 재시도(Loop)와 지수 백오프(3노드 점선 사이클)는 서로 다른 메커니즘이다. */}
      <Loop nodes={N} on="ingest" label="영상 미공개 — 30분 후 재시도 ×12" />
      <Loop nodes={N} on="transcript" label="자막 미준비 — 30분 후 재시도 ×12" />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
```

- [ ] **Step 3: 레지스트리 등록**

`src/components/project/diagrams/index.ts`에 import와 항목을 더한다.

```ts
import { YccQstash } from "./YccQstash";
```

```ts
  "ycc-qstash": YccQstash,
```

- [ ] **Step 4: 케이스 스터디에 연결**

`"ycc-website"` → `## AI 요약 파이프라인 — 서버리스 메시지 큐` 섹션에 추가한다.

```ts
      {
        heading: "## AI 요약 파이프라인 — 서버리스 메시지 큐",
        diagram: "ycc-qstash",
        cards: [
```

- [ ] **Step 5: 검증**

```bash
npm run test
npm run typecheck
```

기대: 둘 다 통과.

- [ ] **Step 6: 브라우저 확인**

`http://localhost:3000/projects/ycc-website`에서 두 번째 다이어그램을 본다. Task 4 Step 11 항목에 더해:

- `Loop`의 되돌이 선이 노드 오른쪽으로 나갔다 되돌아오고, 라벨이 오른쪽 노드와 겹치지 않는다
- 두 재시도 표현(고정 30분 Loop / 백오프 3노드 점선 사이클)이 시각적으로 구분된다
- `5 × 3ⁿ⁻¹` 위첨자가 깨지지 않는다
- **다이어그램 두 개가 한 페이지에 있는데 양쪽 다 화살촉이 정상이다** (마커 id 충돌 1차 확인)

- [ ] **Step 7: 커밋**

```bash
git add src/content/projects src/components/project
git commit -m "feat: 영천중앙교회 QStash 체이닝 아키텍처 다이어그램"
```

---

### Task 6: 안강 섬김 — 얼굴 블러 파이프라인 다이어그램

레인 분리 자체가 "왜 감지는 순차이고 업로드는 병렬인가"를 설명한다.

**Files:**
- Create: `src/components/project/diagrams/SumgimBlur.tsx`
- Modify: `src/content/projects/diagrams.ts`
- Modify: `src/components/project/diagrams/index.ts`
- Modify: `src/content/projects/case-studies.ts`

- [ ] **Step 1: id와 메타 추가**

```ts
export type DiagramId = "ycc-websub" | "ycc-qstash" | "sumgim-blur";
```

```ts
  "sumgim-blur": {
    title: "얼굴 자동 블러 업로드 파이프라인",
    desc: "브라우저에서 이미지를 먼저 압축해 업로드 파일과 얼굴 좌표의 기준을 맞춘 뒤 face-api.js로 얼굴을 감지한다. TensorFlow.js 백엔드가 단일 스레드라 감지는 순차로 돈다. 업로드는 Server Action 직렬화를 피해 API Route로 병렬 전송한다. 서버는 세션과 매직바이트를 검증하고 sharp로 EXIF 회전을 보정한 뒤 리사이즈본 기준으로 좌표를 변환해 해당 영역만 블러 처리해 합성한다. 블러본과 원본을 R2에 병렬 업로드하고 메타데이터는 순차로 저장한다.",
    width: 980,
    height: 560,
  },
```

- [ ] **Step 2: 다이어그램 컴포넌트**

```tsx
// src/components/project/diagrams/SumgimBlur.tsx
"use client";

import { DIAGRAM_META } from "@/content/projects/diagrams";
import {
  Arrow,
  DiagramSvg,
  Lane,
  Node,
  nodeMap,
  type DiagramNode,
} from "./primitives";

const META = DIAGRAM_META["sumgim-blur"];

const NODES: DiagramNode[] = [
  {
    id: "pick",
    x: 40,
    y: 58,
    w: 170,
    h: 58,
    title: "파일 선택",
    notes: ["다중 업로드"],
  },
  {
    id: "compress",
    x: 246,
    y: 48,
    w: 220,
    h: 76,
    title: "compressImageFile",
    notes: ["캔버스 축소 (4.5MB 한도)", "감지보다 먼저 — 좌표 기준 일치"],
    accent: true,
  },
  {
    id: "detect",
    x: 502,
    y: 48,
    w: 220,
    h: 76,
    title: "face-api.js",
    notes: ["tinyFaceDetector 0.45", "naturalWidth 스케일 보정"],
    accent: true,
  },
  {
    id: "upload",
    x: 758,
    y: 48,
    w: 194,
    h: 76,
    title: "fetch POST",
    notes: ["/api/upload-photo", "Server Action 직렬화 회피"],
  },
  {
    id: "guard",
    x: 40,
    y: 248,
    w: 226,
    h: 88,
    title: "요청 검증",
    notes: ["Supabase 세션", "folder · MIME · 30MB", "매직바이트 detectImageType"],
  },
  {
    id: "sharp",
    x: 306,
    y: 248,
    w: 226,
    h: 88,
    title: "sharp 전처리",
    notes: [".rotate() EXIF 보정", ".resize(1920).webp(75)"],
  },
  {
    id: "blur",
    x: 572,
    y: 248,
    w: 246,
    h: 88,
    title: "영역 블러 합성",
    notes: ["scaleFaceRegions 좌표 변환", "extract().blur(28)", "composite()"],
    accent: true,
  },
  {
    id: "r2",
    x: 306,
    y: 432,
    w: 246,
    h: 76,
    title: "R2 병렬 업로드",
    notes: ["blurred/{ts}.webp", "original/{ts}.webp"],
    accent: true,
  },
  {
    id: "meta",
    x: 600,
    y: 432,
    w: 226,
    h: 76,
    title: "savePhotoMetadata",
    notes: ["Server Action", "경량 INSERT — 순차"],
  },
];

const N = nodeMap(NODES);

export function SumgimBlur({
  titleId,
  descId,
}: {
  titleId: string;
  descId: string;
}) {
  return (
    <DiagramSvg
      titleId={titleId}
      descId={descId}
      title={META.title}
      desc={META.desc}
      width={META.width}
      height={META.height}
    >
      {/* 레인은 노드보다 먼저 그려야 배경으로 깔린다. */}
      <Lane
        x={20}
        y={18}
        w={950}
        h={124}
        label="브라우저 — Phase 1 순차 (TF.js 단일 스레드) → Phase 2 병렬 (Promise.all)"
      />
      <Lane x={20} y={216} w={818} h={140} label="서버 — API Route" />
      <Lane x={286} y={400} w={560} h={128} label="저장소" />

      <Arrow nodes={N} from="pick" to="compress" accent />
      <Arrow nodes={N} from="compress" to="detect" label="압축본" accent />
      <Arrow nodes={N} from="detect" to="upload" label="좌표[]" accent />
      <Arrow nodes={N} from="upload" to="guard" label="Promise.all" accent />
      <Arrow nodes={N} from="guard" to="sharp" accent />
      <Arrow nodes={N} from="sharp" to="blur" label="얼굴 있음" accent />
      <Arrow nodes={N} from="sharp" to="r2" label="얼굴 0개 — 단순 압축" dashed />
      <Arrow nodes={N} from="blur" to="r2" accent />
      <Arrow nodes={N} from="r2" to="meta" label="url" accent />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
```

- [ ] **Step 3: 레지스트리 등록**

```ts
import { SumgimBlur } from "./SumgimBlur";
```

```ts
  "sumgim-blur": SumgimBlur,
```

- [ ] **Step 4: 케이스 스터디에 연결**

`"ankang-sumgim"` → `## 핵심 엔지니어링 — 얼굴 자동 블러 파이프라인` 섹션에 추가한다.

```ts
      {
        heading: "## 핵심 엔지니어링 — 얼굴 자동 블러 파이프라인",
        diagram: "sumgim-blur",
        cards: [
```

- [ ] **Step 5: 검증**

```bash
npm run test
npm run typecheck
```

기대: 둘 다 통과.

- [ ] **Step 6: 브라우저 확인**

`http://localhost:3000/projects/ankang-sumgim`을 연다. Task 4 Step 11 항목에 더해:

- 레인 배경이 노드 뒤에 깔리고 레인 라벨이 노드에 가리지 않는다
- 레인 경계가 노드를 자르지 않는다
- `face-api.js` · `sharp` · `EXIF` · `webp` · `Promise.all` 표기가 정확하다

> ⚠️ **정정 — 여기도 잘렸다.** `sharp`(오른쪽 끝 532)와 `blur`(왼쪽 572) 간격이 40px인데
> `"얼굴 있음"` 라벨이 약 55px이라 `굴 있`만 보였다. Task 4와 같은 유형이다.
>
> 적용한 값: `blur.x` 572 → **612**(간격 80px). 블러 노드가 오른쪽으로 나가므로
> 서버 레인도 함께 넓힌다 — `<Lane x={20} y={216} w={818} …>` → **`w={858}`**.
> 레인을 안 넓히면 노드가 레인 밖으로 삐져나온다.

- [ ] **Step 7: 커밋**

```bash
git add src/content/projects src/components/project
git commit -m "feat: 안강 섬김 얼굴 블러 파이프라인 아키텍처 다이어그램"
```

---

### Task 7: 월드ENC — 예약 시스템 다이어그램 + 새 섹션

케이스 스터디에서 예약이 관리자 기능 한 줄로만 서술돼 있다. 섹션을 신설해 실제 밀도를 반영한다.

**Files:**
- Create: `src/components/project/diagrams/WorldengReservation.tsx`
- Modify: `src/content/projects/diagrams.ts`
- Modify: `src/components/project/diagrams/index.ts`
- Modify: `src/content/projects/case-studies.ts`

- [ ] **Step 1: id와 메타 추가**

```ts
export type DiagramId =
  | "ycc-websub"
  | "ycc-qstash"
  | "sumgim-blur"
  | "worldeng-reservation";
```

```ts
  "worldeng-reservation": {
    title: "예약 시스템 — 가용 판정 공유와 이중예약 방어",
    desc: "클라이언트 데이트피커는 가용 판정 API로 예약 불가일을 받아 비활성화하고, 서버 액션은 같은 판정 함수로 다시 검증한다. 판정은 공휴일 API와 관리자 휴무 지정, 예약 타입별 요일 규칙을 조합하며 공휴일 API 장애 시에는 통과시킨다. 제출은 요청 제한, Turnstile, 스키마 검증, 6개월 상한, 가용 재검증을 차례로 거쳐 저장된다. 전화 접수는 같은 테이블에 수동 등록으로 합류한다. 확정 예약의 날짜와 시간에는 부분 유니크 인덱스가 걸려 있어 앱 레벨 검사가 원자적이지 않은 D1에서도 이중예약이 최종 차단된다.",
    width: 980,
    height: 540,
  },
```

- [ ] **Step 2: 다이어그램 컴포넌트**

```tsx
// src/components/project/diagrams/WorldengReservation.tsx
"use client";

import { DIAGRAM_META } from "@/content/projects/diagrams";
import {
  Arrow,
  DiagramSvg,
  Node,
  nodeMap,
  type DiagramNode,
} from "./primitives";

const META = DIAGRAM_META["worldeng-reservation"];

const NODES: DiagramNode[] = [
  {
    id: "picker",
    x: 24,
    y: 40,
    w: 226,
    h: 76,
    title: "데이트피커",
    notes: ["GET /api/availability", "예약 불가일 비활성화"],
  },
  {
    id: "rule",
    x: 350,
    y: 26,
    w: 288,
    h: 104,
    title: "getUnavailableReason",
    notes: [
      "공휴일 API (장애 시 fail-open)",
      "day_overrides — 휴무 · 특별영업",
      "타입별 요일 규칙",
    ],
    accent: true,
  },
  {
    id: "form",
    x: 24,
    y: 206,
    w: 226,
    h: 58,
    title: "예약 폼",
    notes: ["타입 · 날짜 · 시간 · 연락처"],
  },
  {
    id: "action",
    x: 350,
    y: 180,
    w: 288,
    h: 118,
    title: "submitReservation",
    notes: [
      "① rate limit — IP 10분 5회",
      "② Turnstile",
      "③ Zod",
      "④ 6개월 상한",
      "⑤ 가용 재검증",
    ],
    accent: true,
  },
  {
    id: "table",
    x: 712,
    y: 194,
    w: 244,
    h: 90,
    title: "D1 reservations",
    notes: ["source = 'web'", "status = 'pending'", "hour = null → 시간 협의"],
  },
  {
    id: "override",
    x: 24,
    y: 366,
    w: 226,
    h: 58,
    title: "관리자 — 휴무 지정",
    notes: ["day_overrides"],
  },
  {
    id: "manual",
    x: 350,
    y: 366,
    w: 288,
    h: 58,
    title: "관리자 — 전화 접수",
    notes: ["source = 'manual'"],
  },
  {
    id: "index",
    x: 712,
    y: 396,
    w: 244,
    h: 104,
    title: "partial unique index",
    notes: [
      "(date, hour) WHERE",
      "status = 'confirmed'",
      "AND hour IS NOT NULL",
      "D1은 check-then-insert 비원자적",
    ],
    accent: true,
  },
];

const N = nodeMap(NODES);

export function WorldengReservation({
  titleId,
  descId,
}: {
  titleId: string;
  descId: string;
}) {
  return (
    <DiagramSvg
      titleId={titleId}
      descId={descId}
      title={META.title}
      desc={META.desc}
      width={META.width}
      height={META.height}
    >
      <Arrow nodes={N} from="picker" to="rule" label="월 단위 조회" />
      <Arrow nodes={N} from="form" to="action" label="제출" accent />
      {/* 이 점선이 요점이다 — 화면에서 막은 규칙을 서버가 같은 함수로 다시 검증한다. */}
      <Arrow nodes={N} from="action" to="rule" label="⑤ 같은 함수 재사용" dashed />
      <Arrow nodes={N} from="action" to="table" label="insert" accent />
      <Arrow nodes={N} from="manual" to="table" label="수동 등록" />
      <Arrow nodes={N} from="override" to="rule" dashed />
      <Arrow nodes={N} from="table" to="index" label="확정 시 슬롯 점유" accent />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
```

- [ ] **Step 3: 레지스트리 등록**

```ts
import { WorldengReservation } from "./WorldengReservation";
```

```ts
  "worldeng-reservation": WorldengReservation,
```

- [ ] **Step 4: 케이스 스터디에 새 섹션 추가**

`worldengco`의 `sections` 배열에서 기존 `## 핵심 작업` 섹션 **뒤에** 아래 섹션을 추가한다. 기존 카드 6장은 그대로 둔다.

```ts
      {
        heading: "## 예약 시스템 — 이중예약 방어",
        diagram: "worldeng-reservation",
        columns: 2,
        cards: [
          {
            title: "가용 판정 로직을 클라이언트·서버가 공유",
            description:
              "공휴일 API·관리자 휴무 지정·예약 타입별 요일 규칙(타사 정비는 토요일만, 자사 A/S·교육은 일요일 제외)을 판정하는 함수 하나를 데이트피커와 서버 액션이 같이 쓴다. 화면에서 막은 날짜를 서버가 다시 검증하므로 규칙이 갈라지지 않는다. 공휴일 API 장애 시에는 fail-open으로 예약 자체가 멈추지 않게 했다.",
            accent: true,
          },
          {
            title: "이중예약 최종 방어선 — 부분 유니크 인덱스",
            description:
              "D1에서는 앱 레벨 check-then-insert가 원자적이지 않아 동시 요청이 같은 슬롯을 통과할 수 있다. 확정 예약에만 걸리는 partial unique index (date, hour) WHERE status='confirmed'로 DB가 마지막을 막는다. '시간 협의'(hour null)는 슬롯을 점유하지 않으므로 조건에서 제외했다.",
            accent: true,
          },
          {
            title: "공개 폼 다층 방어",
            description:
              "요청 제한(IP 슬라이딩 윈도우 10분 5회)을 Turnstile보다 먼저 걸어 불필요한 외부 호출을 줄이고, 이후 스키마 검증·6개월 상한·가용 재검증을 차례로 통과시킨다. 실패는 throw가 아니라 폼 상태로 돌려 입력이 유실되지 않게 했다.",
          },
          {
            title: "전화 접수와 웹 예약을 한 테이블로",
            description:
              "사무실에 걸려 오는 전화 예약을 source='manual'로 같은 테이블에 등록한다. 캘린더가 두 경로를 한 화면에서 보여주므로 운영자가 장부를 이중으로 들고 있을 필요가 없다.",
          },
        ],
      },
```

- [ ] **Step 5: 검증**

```bash
npm run test
npm run typecheck
npm run lint
```

기대: 전부 통과.

- [ ] **Step 6: 브라우저 확인**

`http://localhost:3000/projects/worldengco`를 연다. Task 4 Step 11 항목에 더해:

- 새 섹션 헤딩 `## 예약 시스템 — 이중예약 방어`가 다이어그램 위에 뜬다
- `①`~`⑤` 원문자가 깨지지 않는다
- `Turnstile` · `Zod` · `D1` · `partial unique index` · `day_overrides` · `getUnavailableReason` 표기가 정확하다

- [ ] **Step 7: 커밋**

```bash
git add src/content/projects src/components/project
git commit -m "feat: 월드ENC 예약 시스템 섹션과 이중예약 방어 다이어그램"
```

---

## Phase 3 — 라이트박스

### Task 8: Lightbox 셸

네이티브 `<dialog showModal()>`을 쓰는 이유는 포커스 트랩·ESC·배경 inert·top-layer를 브라우저가 처리하기 때문이다. 직접 만든 오버레이는 포커스 트랩에서 반드시 사고가 난다.

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/project/Lightbox.tsx`

- [ ] **Step 1: `::backdrop` 스타일 추가**

`src/app/globals.css`의 `.prose-scroll` 규칙 **뒤, `@media print` 앞에** 아래를 추가한다.

```css
/* 라이트박스 배경. dialog는 top-layer에 렌더되므로 z-index 경쟁이 없다. */
dialog::backdrop {
  background: rgb(6 8 11 / 0.88);
}

/* 애니메이션을 끄도록 설정한 사용자에게는 페이드를 적용하지 않는다. */
@media (prefers-reduced-motion: no-preference) {
  dialog[open],
  dialog[open]::backdrop {
    animation: lightbox-in 140ms ease-out;
  }
}

@keyframes lightbox-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

- [ ] **Step 2: 구현**

```tsx
// src/components/project/Lightbox.tsx
"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export type LightboxItem =
  | { kind: "image"; src: string; alt: string }
  | { kind: "diagram"; title: string; render: () => ReactNode };

/** 헤더에 표시할 경로/제목 */
function itemLabel(item: LightboxItem): string {
  return item.kind === "image" ? `~${item.src}` : item.title;
}

/** 푸터 캡션 — 새 문안을 만들지 않고 alt/제목을 그대로 쓴다 */
function itemCaption(item: LightboxItem): string {
  return item.kind === "image" ? item.alt : item.title;
}

export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[];
  /** null이면 닫힘 */
  index: number | null;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [actualSize, setActualSize] = useState(false);

  const open = index !== null;
  const item = open ? items[index] : undefined;

  // showModal()/close()는 명령형 API라 open 상태와 직접 동기화한다.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // 장을 넘기면 확대 상태와 스크롤 위치를 초기화한다.
  useEffect(() => {
    setActualSize(false);
    scrollRef.current?.scrollTo(0, 0);
  }, [index]);

  const move = useCallback(
    (delta: number) => {
      if (index === null || items.length < 2) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  };

  // 닫힌 동안에도 dialog 노드는 유지해 showModal 대상이 사라지지 않게 한다.
  if (!item) return <dialog ref={dialogRef} aria-hidden="true" />;

  // 다이어그램은 벡터라 확대 개념이 없다.
  const canZoom = item.kind === "image";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={onKeyDown}
      aria-label={itemLabel(item)}
      // backdrop 색은 globals.css가 정한다 — 여기서 backdrop: 유틸리티를 쓰면 덮어써진다.
      className="m-0 h-dvh max-h-dvh w-dvw max-w-dvw bg-transparent p-0"
    >
      <div className="flex h-full w-full flex-col">
        {/* ── 헤더 ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-rail px-4 py-2.5 font-mono text-[11px]">
          <span className="truncate text-faint">{itemLabel(item)}</span>
          {items.length > 1 && (
            <span className="shrink-0 text-accent">
              [{index + 1}/{items.length}]
            </span>
          )}
          <span className="ml-auto hidden shrink-0 text-ghost sm:inline">
            {items.length > 1 ? "← → 이동 · esc 닫기" : "esc 닫기"}
          </span>
          {canZoom && (
            <button
              type="button"
              onClick={() => setActualSize((v) => !v)}
              aria-pressed={actualSize}
              className={`shrink-0 cursor-pointer rounded border px-2 py-1 ${
                actualSize
                  ? "border-line-accent text-accent"
                  : "border-line text-muted"
              } ${items.length > 1 ? "" : "ml-auto sm:ml-0"}`}
            >
              1:1
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="닫기"
            className="shrink-0 cursor-pointer rounded border border-line px-2 py-1 text-muted"
          >
            ✕
          </button>
        </div>

        {/* ── 콘텐츠 ── */}
        <div
          ref={scrollRef}
          className={`min-h-0 flex-1 overflow-auto bg-page p-4 ${
            actualSize ? "" : "flex items-center justify-center"
          }`}
        >
          {item.kind === "image" ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               "1:1 원본 픽셀 크기"는 next/image로 표현할 수 없다(width/height 필수 →
               종횡비 왜곡). 관리자 화면 글자를 읽는 것이 이 모드의 존재 이유라
               원본을 그대로 받는다. 썸네일 그리드는 그대로 next/image를 쓴다. */
            <img
              src={item.src}
              alt={item.alt}
              className={
                actualSize
                  ? "max-w-none" // 원본 크기 + 컨테이너 스크롤
                  : "max-h-full max-w-full object-contain" // 잘림 없이 전체
              }
            />
          ) : (
            // 폭을 채우되 좌표계보다 좁아지면 컨테이너가 가로 스크롤한다.
            <div className="w-full [&_svg]:h-auto [&_svg]:w-full">
              {item.render()}
            </div>
          )}
        </div>

        {/* ── 푸터 ── */}
        <p className="shrink-0 border-t border-line bg-rail px-4 py-2.5 text-[12px] text-muted">
          {itemCaption(item)}
        </p>
      </div>
    </dialog>
  );
}
```

`onClose`가 `<dialog>`의 네이티브 close 이벤트에 걸려 있으므로 ESC·✕·프로그램적 close가 모두 같은 경로로 상태를 되돌린다. 포커스 복귀도 브라우저가 처리한다 — 모달을 닫으면 열기 전 포커스된 요소로 돌아간다.

> ⚠️ **정정 3건.** 위 코드는 그대로는 `lint`·`typecheck`를 통과하지 못한다.
>
> 1. **`react-hooks/set-state-in-effect`** — 장을 넘길 때 확대를 되돌리는
>    `useEffect(() => { setActualSize(false); … }, [index])`가 규칙 위반이다.
>    effect는 스크롤 초기화(`scrollRef.current?.scrollTo(0, 0)`)만 남기고,
>    확대 해제는 **이벤트 핸들러에서 직접** 한다 — `move()` 안과 close 핸들러 안.
> 2. **`TS18047: 'index' is possibly 'null'`** — 조기 반환 가드가 `if (!item)`만
>    검사하는데, TS는 `item`이 있다고 해서 `index`가 non-null임을 추론하지 못한다.
>    헤더 카운터 `{index + 1}`에서 터진다. 가드를
>    `if (index === null || !item) return …`로 바꿔 `index`도 함께 좁힌다.
> 3. **확대 상태가 잔존한다** — "확대를 장 번호에 묶어 두면 effect 없이 저절로
>    무효가 된다"는 접근(`actualSize = zoomedIndex === index`)은 **틀렸다.**
>    `←`로 확대했던 장에 되돌아오거나, 닫고 같은 장을 다시 열면 조건이 다시 참이
>    되어 확대 상태가 되살아난다. 앞으로 넘기는 것만 테스트하면 통과해 버린다.
>    **평범한 boolean으로 두고 `move()`와 close에서 `setActualSize(false)`** 하는 것이
>    맞다. 닫을 때 반드시 풀어야 재오픈이 fit으로 시작한다.
>
> 정리하면 `const [actualSize, setActualSize] = useState(false)`를 유지하되,
> `move()` 첫 줄에서 `setActualSize(false)`, 그리고 `onClose` 대신
> `handleClose = () => { setActualSize(false); onClose(); }`를 `<dialog onClose>`에 건다.
> 1:1 버튼은 `onClick={() => setActualSize((v) => !v)}` 그대로면 된다.

- [ ] **Step 3: 검증**

```bash
npm run typecheck
npm run lint
```

기대: 둘 다 통과. `no-img-element` 경고는 위 disable 주석으로 억제된다. 다른 규칙에 걸리면 규칙 이름을 확인해 주석을 맞춘다.

- [ ] **Step 4: 커밋**

```bash
git add src/components/project/Lightbox.tsx src/app/globals.css
git commit -m "feat: 스크린샷·다이어그램 공용 라이트박스 셸"
```

---

### Task 9: ShotGallery — 썸네일을 버튼으로

**Files:**
- Create: `src/components/project/ShotGallery.tsx`
- Delete: `src/components/project/CaseStudyShots.tsx`
- Modify: `src/app/projects/[slug]/page.tsx`

> ⚠️ **정정 — 아래 코드는 옛 `CaseStudyShots`를 기준으로 쓰였다. 그대로 쓰면 안 된다.**
>
> 이 계획서를 쓴 뒤 커밋 `8ae319e`가 `CaseStudyShots`를 크게 고쳤는데 그 내용이 반영돼
> 있지 않다. 아래 코드를 그대로 적용하면 **그 커밋이 고친 잘림 버그가 되살아나고
> 모바일 프레임이 모든 상세 페이지에서 사라진다.**
>
> | 항목 | 실제 `CaseStudyShots` | 아래 계획서 코드 | 그대로 쓰면 |
> | --- | --- | --- | --- |
> | 높이 | 고정 없음, 원본 비율 | `h-[240px] md:h-[440px]` + `object-cover` | 1920×917이 좌우 40% 잘림 |
> | props | `{ rows, mobile }` | `{ rows, caption }` | `mobileShot` 미전달 → `MobileFrame` 소멸. `shotsCaption` 필드는 존재하지 않아 항상 undefined |
> | 이미지 | `getScreenshot()` 정적 임포트 + `placeholder="blur"` | `shot.src` 문자열 | blur 플레이스홀더 상실 |
> | 프레임 | `BrowserFrame` — 제목 줄에 `shot.label` | 없음 | 화면 이름 표기 상실 |
>
> 아래 `⤢` 힌트의 주석("그리드에서는 아래쪽이 잘려 있다")도 이제 사실이 아니다. 안 잘린다.
>
> **실제로 적용한 방식:** `CaseStudyShots`를 `ShotGallery`로 `git mv`하고
> **현재 구조를 전부 유지한 채 클릭만 얹었다.** `ROW`(높이 없음)·`BrowserFrame`·
> `MobileFrame`·`getScreenshot`·blur를 그대로 두고, `BrowserFrame`의 **이미지 영역만**
> `<button>`으로 감쌌다(제목 줄은 버튼 밖에 둔다 — 창틀 전체를 감싸면 화면 이름까지
> 접근가능 이름에 섞인다). `<Lightbox>`는 `figure` 끝에 붙인다.
>
> 두 가지가 더 필요했다.
>
> - **`LightboxItem` 이미지 변형에 `path` 필드 추가.** 정적 임포트를 거치면 `src`가
>   해시된 빌드 경로(`/_next/static/media/…`)라 헤더의 `~/screenshots/…` 표기로 쓸 수
>   없다. `src`는 실제 주소(1:1이 원본을 받아야 관리자 화면 글자가 읽힌다),
>   `path`는 표시용으로 나누고 `itemLabel`이 `path`를 쓴다.
> - **평탄 인덱스를 렌더 중 카운터 증가로 구하면 안 된다.** 아래 코드의
>   `let cursor = -1; … cursor += 1;`은 `react-hooks/immutability`에 걸린다
>   (`Cannot reassign 'cursor' after render completes`). 앞선 줄의 장수를 그때그때
>   더하는 순수 계산으로 바꾼다 —
>   `const flatIndexOf = (row, col) => rows.slice(0, row).reduce((n, r) => n + r.length, 0) + col;`
>   한 페이지에 줄이 서너 개뿐이라 비용이 없다.

- [ ] **Step 1: 구현**

기존 `CaseStudyShots`의 `ROW` 상수와 레이아웃을 그대로 옮기고, 셀을 `<div>`에서 `<button>`으로 바꾼다.

```tsx
// src/components/project/ShotGallery.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/project/Lightbox";
import type { Shot } from "@/content/projects/case-studies";

// 한 줄에 몇 장이냐에 따라 높이·그리드·이미지 요청 크기가 정해진다.
const ROW = {
  1: {
    grid: "grid-cols-1",
    height: "h-[240px] md:h-[440px]",
    sizes: "(max-width: 1040px) 100vw, 880px",
  },
  2: {
    grid: "grid-cols-1 sm:grid-cols-2",
    height: "h-[220px] md:h-[340px]",
    sizes: "(max-width: 640px) 100vw, (max-width: 1040px) 50vw, 440px",
  },
  3: {
    grid: "grid-cols-1 sm:grid-cols-3",
    height: "h-[200px] md:h-[260px]",
    sizes: "(max-width: 640px) 100vw, (max-width: 1040px) 33vw, 290px",
  },
} as const;

export function ShotGallery({
  rows,
  caption,
}: {
  rows: Shot[][];
  caption?: string;
}) {
  // 줄 구분 없이 평탄화한 순서가 라이트박스의 탐색 순서다.
  const items: LightboxItem[] = rows
    .flat()
    .map((shot) => ({ kind: "image", src: shot.src, alt: shot.alt }));
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // 줄을 넘어가도 이어지는 평탄 인덱스. 렌더 중에만 쓰는 카운터다.
  let cursor = -1;

  return (
    <figure className="my-10 flex flex-col gap-3.5">
      {rows.map((row, index) => {
        const layout = ROW[Math.min(row.length, 3) as 1 | 2 | 3];
        return (
          <div key={index} className={`grid gap-3.5 ${layout.grid}`}>
            {row.map((shot, column) => {
              cursor += 1;
              const flatIndex = cursor;
              return (
                <button
                  key={shot.src}
                  type="button"
                  onClick={() => setOpenIndex(flatIndex)}
                  aria-label={`크게 보기: ${shot.alt}`}
                  className={`group relative block w-full cursor-pointer overflow-hidden rounded-lg border border-transparent bg-card hover:border-line-accent focus-visible:border-line-accent ${layout.height}`}
                >
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes={layout.sizes}
                    // 첫 장이 이 페이지의 LCP다. 나머지는 기본값(지연 로드).
                    priority={index === 0 && column === 0}
                    className="object-cover object-top"
                  />
                  {/* 그리드에서는 아래쪽이 잘려 있다 — 전체를 보려면 누르라는 신호 */}
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 rounded border border-line bg-rail/90 px-1.5 py-0.5 font-mono text-[11px] text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    ⤢
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
      {caption && (
        <figcaption className="font-mono text-[11px] text-faint">
          {caption}
        </figcaption>
      )}
      <Lightbox
        items={items}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </figure>
  );
}
```

- [ ] **Step 2: 사용처 교체**

`src/app/projects/[slug]/page.tsx`에서 `CaseStudyShots` import를 지우고 아래로 바꾼다.

```tsx
import { ShotGallery } from "@/components/project/ShotGallery";
```

사용부도 바꾼다. 기존 props(`rows`, `caption`)는 동일하다.

```tsx
<ShotGallery rows={study.shotRows} caption={study.shotsCaption} />
```

- [ ] **Step 3: 옛 컴포넌트 삭제**

```bash
git rm src/components/project/CaseStudyShots.tsx
```

- [ ] **Step 4: 잔여 참조 확인**

```bash
npm run typecheck
npm run lint
```

기대: 통과. `CaseStudyShots`를 참조하는 곳이 남아 있으면 typecheck가 잡는다.

- [ ] **Step 5: 브라우저 확인**

`http://localhost:3000/projects/ycc-website`에서:

- 썸네일에 hover 시 보더가 초록으로 바뀌고 우상단 `⤢`가 뜬다
- 클릭하면 라이트박스가 전체 화면으로 열리고 **잘리지 않은 이미지 전체**가 보인다
- `1:1`을 누르면 원본 크기로 커지고 스크롤로 훑을 수 있다 — **관리자 화면 글자가 읽힌다**
- `→`/`←`로 장이 넘어가고 카운터 `[n/N]`이 바뀐다
- `Esc`로 닫히고, 곧바로 Tab을 눌러 보면 포커스가 눌렀던 썸네일 근처에 있다

- [ ] **Step 6: 커밋**

```bash
git add -A src/components/project src/app/projects
git commit -m "feat: 스크린샷 썸네일을 버튼으로 바꾸고 라이트박스 연결"
```

---

### Task 10: 다이어그램에 라이트박스 연결

**Files:**
- Modify: `src/components/project/CaseStudyDiagram.tsx`

- [ ] **Step 1: 확대 버튼과 라이트박스 추가**

Task 4에서 만든 파일 전체를 아래로 교체한다.

```tsx
// src/components/project/CaseStudyDiagram.tsx
"use client";

import { useId, useState } from "react";
import { DIAGRAMS } from "@/components/project/diagrams";
import { Lightbox, type LightboxItem } from "@/components/project/Lightbox";
import { DIAGRAM_META, type DiagramId } from "@/content/projects/diagrams";

export function CaseStudyDiagram({ id }: { id: DiagramId }) {
  const meta = DIAGRAM_META[id];
  const Diagram = DIAGRAMS[id];
  const base = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);

  // 라이트박스 사본은 별도 title/desc id를 쓴다 — 같은 id가 문서에 둘 있으면
  // aria-labelledby가 어느 쪽을 가리키는지 불확실해진다.
  const items: LightboxItem[] = [
    {
      kind: "diagram",
      title: meta.title,
      render: () => (
        <Diagram titleId={`${base}-lb-title`} descId={`${base}-lb-desc`} />
      ),
    },
  ];

  return (
    <figure className="mb-6">
      <div className="relative">
        {/* 축소하지 않고 가로 스크롤한다 — 줄이면 11px 라벨이 안 읽힌다.
            globals.css의 .prose-scroll 규약을 따른다. */}
        <div className="prose-scroll max-w-full rounded-lg border border-line bg-page p-3">
          <Diagram titleId={`${base}-title`} descId={`${base}-desc`} />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`크게 보기: ${meta.title}`}
          className="absolute top-2 right-2 cursor-pointer rounded border border-line bg-rail/90 px-1.5 py-0.5 font-mono text-[11px] text-muted hover:border-line-accent hover:text-accent"
        >
          ⤢
        </button>
      </div>
      <figcaption className="mt-2.5 font-mono text-[11px] text-faint">
        ↑ {meta.title}
      </figcaption>
      <Lightbox
        items={items}
        index={open ? 0 : null}
        onIndexChange={() => {}}
        onClose={() => setOpen(false)}
      />
    </figure>
  );
}
```

- [ ] **Step 2: 브라우저 확인 — 마커 id 충돌 여부**

`http://localhost:3000/projects/ycc-website`에서 다이어그램 확대 버튼을 누른다.

**가장 중요한 확인 항목:** 라이트박스가 열린 상태에서 **배경(인라인)과 라이트박스 양쪽 모두** 화살촉이 정상인지 본다. 한쪽에서 화살촉이 사라졌다면 `useId()` 접두사가 제대로 안 걸린 것이다. 라이트박스를 닫은 뒤 인라인 다이어그램의 화살촉도 다시 확인한다.

그 외:
- 라이트박스에 `1:1` 버튼이 **없다** (벡터라 확대 개념이 없음)
- 카운터 `[1/1]`이 뜨지 않는다 (1장뿐)
- `Esc`로 닫히고 포커스가 확대 버튼으로 돌아간다

- [ ] **Step 3: 검증**

```bash
npm run typecheck
npm run lint
```

기대: 통과.

- [ ] **Step 4: 커밋**

```bash
git add src/components/project/CaseStudyDiagram.tsx
git commit -m "feat: 다이어그램 확대 라이트박스 연결"
```

---

## Phase 4 — 검증

### Task 11: E2E 테스트

**Files:**
- Create: `e2e/diagrams.spec.ts`
- Modify: `e2e/smoke.spec.ts` (필요 시)

- [ ] **Step 1: 기존 E2E가 깨지는지 먼저 확인**

Run: `npm run e2e`
기대: 기존 `smoke.spec.ts`·`resume.spec.ts`가 통과. `CaseStudyShots`의 DOM 구조에 의존하는 셀렉터가 있었다면 여기서 깨진다 — 깨지면 `button[aria-label^="크게 보기:"]`로 갱신한다.

- [ ] **Step 2: E2E 작성**

```ts
// e2e/diagrams.spec.ts
import { expect, test } from "@playwright/test";

const DIAGRAM_PAGES = [
  { slug: "ycc-website", count: 2 },
  { slug: "ankang-sumgim", count: 1 },
  { slug: "worldengco", count: 1 },
];

test.describe("아키텍처 다이어그램", () => {
  for (const { slug, count } of DIAGRAM_PAGES) {
    test(`${slug} — 다이어그램이 접근가능 이름과 함께 렌더된다`, async ({
      page,
    }) => {
      await page.goto(`/projects/${slug}`);
      const diagrams = page.locator('figure svg[role="img"]');
      await expect(diagrams).toHaveCount(count);
      for (let i = 0; i < count; i++) {
        await expect(diagrams.nth(i)).toHaveAttribute("aria-labelledby", /\S/);
        await expect(diagrams.nth(i).locator("title")).not.toBeEmpty();
        await expect(diagrams.nth(i).locator("desc")).not.toBeEmpty();
      }
    });
  }

  test("다이어그램 라이트박스는 1:1 토글이 없다", async ({ page }) => {
    await page.goto("/projects/ycc-website");
    const trigger = page
      .getByRole("button", { name: /^크게 보기: 설교 자동 동기화/ })
      .first();
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "1:1" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("스크린샷 라이트박스", () => {
  test("열기 → 이동 → 1:1 → 닫기 → 포커스 복귀", async ({ page }) => {
    await page.goto("/projects/ycc-website");

    // 다이어그램 확대 버튼과 구분하려고 img를 품은 버튼만 고른다.
    const first = page
      .locator('button[aria-label^="크게 보기:"]')
      .filter({ has: page.locator("img") })
      .first();
    await first.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("[1/")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText("[2/")).toBeVisible();

    const zoom = dialog.getByRole("button", { name: "1:1" });
    await zoom.click();
    await expect(zoom).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(first).toBeFocused();
  });
});

test.describe("반응형", () => {
  for (const { slug } of DIAGRAM_PAGES) {
    test(`${slug} — 375px에서 페이지 본문이 가로 스크롤되지 않는다`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(`/projects/${slug}`);
      // 다이어그램은 자기 컨테이너 안에서만 스크롤해야 한다.
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
```

> ⚠️ **정정 — 위 E2E는 확대 상태 잔존 버그를 놓친다.** `1:1`을 켜고 `ArrowRight`만
> 확인하면, 확대를 장 번호에 묶어 둔 구현(Task 8 정정 3번)이 그대로 통과한다.
> **되돌아오기(`ArrowLeft`)와 닫았다 다시 열기까지 검사해야 한다.**
>
> 실제로 추가한 테스트 두 개.
>
> - `장을 넘기거나 닫았다 열면 1:1이 풀린다` — 확대 → `→`(풀림) → `←`(여전히 풀림) →
>   다시 확대 → `Esc` → 같은 썸네일 재오픈(fit으로 시작) 순으로 본다.
> - `라이트박스를 열어도 marker id가 충돌하지 않는다` — 이 작업의 최대 위험을 눈으로
>   한 번 본 것으로 끝내지 않는다. 라이트박스를 연 상태에서 `<marker>` id 유일성
>   (`new Set(ids).size === ids.length`)과 `marker-end` 참조 무결성(끊긴 참조 0)을
>   함께 검사한다.
>
> 최종 `e2e/diagrams.spec.ts`는 10 tests, 저장소 전체는 30 tests다.

- [ ] **Step 3: E2E 실행**

Run: `npm run e2e`
기대: 전건 PASS.

> 참고: 콜드 캐시에서 `smoke.spec.ts`의 `상세 스크린샷이 … 잘리지 않는다`가 60초
> 타임아웃으로 한 번 깨질 수 있다. dev 서버의 이미지 최적화가 2워커와 경합해서다
> (`playwright.config.ts`의 워커 수 주석에 같은 사연이 적혀 있다). 단독 실행하면 3초에
> 통과한다 — 코드 회귀와 구분하려면 `npx playwright test smoke.spec.ts -g "잘리지 않는다"`로
> 먼저 확인하라.

가로 스크롤 테스트가 깨지면 `.prose-scroll` 컨테이너가 폭을 넘긴 것이다. `CaseStudyDiagram`의 래퍼에 `max-w-full`이 있는지 확인하고, 그래도 넘치면 상위 레이아웃에 `min-w-0`을 더한다(플렉스/그리드 자식은 기본 `min-width: auto`라 축소되지 않는다).

- [ ] **Step 4: 커밋**

```bash
git add e2e
git commit -m "test: 다이어그램·라이트박스 E2E"
```

---

### Task 12: 최종 검증

- [ ] **Step 1: 전체 검사**

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run e2e
```

기대: 전부 통과. `format:check`가 깨지면 `npm run format`을 돌리고 결과를 커밋한다.

> ⚠️ **정정 — `format:check`는 이 작업 이전부터 깨져 있었다.** main에서도 25개 파일이
> 실패했다. 원인은 코드가 아니라 줄바꿈이다 — Windows 체크아웃에서 `core.autocrlf`가
> 작업본을 CRLF로 바꾸는데 prettier는 LF를 기대하고, 저장소에 `.gitattributes`가 없었다.
>
> `* text=auto eol=lf`를 담은 `.gitattributes`를 추가하고 prettier를 한 번 돌려 해결했다
> (별도 커밋). 인덱스는 이미 LF였던 터라 실제 내용 변경은 한 파일뿐이고 나머지는
> 작업본만 LF로 돌아왔다. 이 작업 범위 밖이지만 Task 12가 통과할 수 없어 함께 고쳤다.

- [ ] **Step 2: 프로덕션 빌드**

Run: `npm run build`
기대: 성공. 클라이언트 컴포넌트 경계가 잘못됐으면 여기서 잡힌다.

- [ ] **Step 3: 표기 눈검사**

dev 서버에서 3개 페이지를 열어 아래 표기를 **한 글자씩** 확인한다. 이 작업의 출발점이 라벨 오탈자 우려였다.

| 페이지 | 확인할 표기 |
| --- | --- |
| `/projects/ycc-website` | `WebSub` · `PubSubHubbub` · `QStash` · `HMAC-SHA1` · `timingSafeEqual` · `yt-api` · `timedtext` · `responseSchema` · `5 × 3ⁿ⁻¹` |
| `/projects/ankang-sumgim` | `face-api.js` · `tinyFaceDetector` · `sharp` · `EXIF` · `webp` · `Promise.all` · `R2` |
| `/projects/worldengco` | `Turnstile` · `Zod` · `D1` · `partial unique index` · `day_overrides` · `getUnavailableReason` · `①②③④⑤` |

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: 다이어그램·라이트박스 최종 정리"
```

---

## 완료 기준

- 다이어그램 4장이 3개 프로젝트 페이지에 렌더되고, 모든 라벨이 실제 `<text>`다
- 화살촉이 모든 선 끝에 있고, 라이트박스를 열어도 인라인 쪽 화살촉이 깨지지 않는다
- 스크린샷을 눌러 잘리지 않은 전체를 보고, `1:1`로 관리자 화면 글자를 읽을 수 있다
- `Esc`로 닫으면 포커스가 트리거로 돌아간다
- 375px에서 페이지 본문이 가로 스크롤되지 않는다
- `lint` · `format:check` · `typecheck` · `test` · `e2e` · `build` 전부 통과

**달성 확인 (2026-07-29, 브랜치 `feat/architecture-diagrams`, 커밋 13개)**

전 항목 충족. `lint` · `format:check` · `typecheck` 통과, `test` 51 passed,
`e2e` 30 passed, `build` 성공(18 페이지). 표기 눈검사는 프로덕션 렌더에서 자동 대조해
3개 페이지의 요구 표기 25개가 모두 존재하고 틀린 형태(`5·3ⁿ분`, `3의 n제곱`)는 남아
있지 않음을 확인했다. 라이트박스를 연 상태의 marker id 유일성·참조 무결성도
E2E로 고정했다.

**이 작업 범위 밖으로 남긴 것**

- ~~`public/screenshots/ycc-home.png` 우하단에 "Windows 정품 인증" 워터마크가 있다.
  썸네일에서는 눈에 안 띄었지만 라이트박스 `1:1`에서 선명하게 드러난다. 재촬영이 필요하다.~~
  → **2026-07-29 해소.** 전수 조사해 보니 `ycc-home` 하나가 아니라 **데스크톱 14장 중
  13장**에 워터마크가, 9장에 브라우저 스크롤바가 함께 찍혀 있었다(멀쩡한 건
  `sumgim-blur-gallery` 하나뿐). 사람이 띄운 창을 캡처한 결과라 생길 수밖에 없는 흔적이다.
  13장을 헤드리스로 다시 찍어 교체했다 — 공개 화면 6장은 `scripts/capture-desktop.mjs`가,
  로그인이 필요한 관리자 화면 7장은 사람이 로그인하고 셔터만 눌러 주는
  `scripts/capture-admin.mjs`가 처리한다. 자세한 건 `public/screenshots/README.md`.
- `worldeng-reservation`의 `"확정 시 슬롯 점유"` 라벨은 세로 화살표가 어절 사이 공백을
  관통한다. 후광이 글자를 지키므로 읽히는 데 문제는 없어 그대로 뒀다. 거슬리면
  `Arrow`에 `labelDx`를 추가해 세로 화살표의 라벨을 옆으로 밀면 된다.

---

## 후속 (2026-07-29) — 가로 스크롤 제거와 브랜드 마크

계획 완료 후 실제 화면을 보고 두 가지를 더 고쳤다. 설계 문서의 해당 절에도
개정 블록을 달아 뒀다.

### 뒤집힌 설계 판단 2건

원안의 다음 두 결정은 **틀렸고, 폐기했다.**

1. **"폭에 맞춰 축소하지 않고 `.prose-scroll`로 가로 스크롤한다."**
   좌표계가 858·940·980·980인데 컨테이너 안쪽은 **854px**이라, 모바일이 아니라
   **데스크톱에서 이미 4장 중 3장이 스크롤되고 있었다.** 스크롤 막대가 읽는 흐름을
   끊는다. 이제 svg가 `w-full h-auto`로 컨테이너 폭에 맞춰 스스로 줄어든다.
   `.prose-scroll`은 쓰는 데가 없어져 `globals.css`에서 제거했다.
2. **"다이어그램은 벡터라 확대 개념이 없으므로 `1:1` 버튼을 노출하지 않는다."**
   1번을 적용한 순간 이 판단이 뒤집혔다 — **축소가 생기면 원래 크기로 되돌리는
   수단이 필요해진다.** 375px에서 배율이 0.37이라 11.5px 보조 문구가 4.3px이 된다.
   이제 다이어그램에도 `1:1`이 있고, `viewBox` 폭으로 못 박아 컨테이너가 스크롤한다.
   E2E `다이어그램 라이트박스는 1:1 토글이 없다`는 정반대 테스트로 교체했다.

### 좌표계를 전부 840으로

컨테이너 안쪽 854px 이하로 넣어야 데스크톱에서 축소가 일어나지 않는다. 폭을 줄인
만큼 높이로 갚았다 — 계획을 세울 때 예상하지 못한 부분이다.

| 다이어그램 | 이전 | 이후 | 한 일 |
| --- | --- | --- | --- |
| ycc-websub | 858×470 | 840×490 | 열 간격 압축 |
| ycc-qstash | 940×520 | 840×520 | 오른쪽 열 −40 |
| sumgim-blur | 980×560 | 840×625 | 브라우저 4단계를 2×2로 접음 |
| worldeng-reservation | 980×540 | 840×520 | 3열 재배치 + 전화 접수를 가운데 열로 |

### 브랜드 마크

노드가 외부 제품에 붙어 있으면 제목 왼쪽에 16px 마크를 단다.
`scripts/gen-diagram-logos.mjs`가 simple-icons 16.27.1에서 받아 굽는다 —
**로고 경로를 손으로 그리지 않는다.** 근사치는 진짜 마크 옆에서 바로 티가 난다.

simple-icons에 없는 둘은 원본 이미지를 받아 `logos.ts`의 `MANUAL_LOGOS`에 넣었다.
**색과 치수는 눈으로 짐작하지 않고 원본 PNG 픽셀에서 뽑았다** — PubSubHubbub은
도형 25px·간격 5px·전체 85×25였고, 세로 24 기준 82×24로 환산했다.

TensorFlow.js는 경로만 simple-icons의 공식 TF 글리프를 쓰고 색은 TF.js 원본의
`#FF8500`을 썼다. **JS 배지는 뺐다** — 배지 남색 `#425066`이 카드 배경 대비
2.22:1로 기준(3:1) 미달이라, 어두운 배경에서 배지가 글리프를 베어 문 자국처럼
보인다. 여기서도 색은 재 보고 결정했다.

마크가 정사각이라는 보장이 깨져 `LogoMark`에 `aspect`와 다색 `shapes`를 넣었다.
PubSubHubbub은 aspect 3.42라 16px 높이에서 55px를 차지한다.

### 새로 고정한 회귀 (E2E 30 → 40)

넘침 가드만으로는 부족했다. 이번에 실제로 잡힌 것들이다.

- **데스크톱 축소 회귀** — 좌표계를 854px 너머로 넓히면 글자가 조용히 작아진다.
- **화살표 관통** — 선분 대 노드 사각형 교차(Liang-Barsky). 이 가드가 **기존 결함
  하나를 찾아냈다**: `worldeng-reservation`의 휴무 지정 → rule 대각선이
  `submitReservation` 상자를 **34px 관통**해, 노드가 선을 덮는 바람에 화살표가 중간에
  사라져 보이고 있었다. 계획서 전 과정에서 눈으로도 못 봤던 것이다.
- **브랜드 마크 렌더** — 생성 파일이 비면 노드에 빈 자리만 남는다.

두 가드 모두 일부러 깨뜨려 정확한 메시지로 실패하는지 확인했다
(`1000 → 854px`, `[submitReservation] 선이 34px 파고듦`).

**교훈 하나 더.** 좌표 충돌을 손으로 계산해 판정하려다 두 번 틀렸다. 한 번은
"관통한다"고 적었는데 실제로는 1px을 스칠 뿐이었다(그 주석은 바로잡았다).
**선분 교차는 사람이 암산할 일이 아니다 — 렌더해서 재라.**
