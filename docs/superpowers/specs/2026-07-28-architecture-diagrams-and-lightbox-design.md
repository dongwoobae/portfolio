# 케이스 스터디 아키텍처 다이어그램 · 이미지 라이트박스 설계

작성일: 2026-07-28

## 배경

프로젝트 상세 페이지는 개요 → 메타 → 스크린샷 → 산문/카드 섹션 구조다. 파이프라인성 작업(WebSub 푸시, QStash 단계 체이닝, 얼굴 블러 2-Phase 업로드)은 카드 본문의 문장으로만 설명되고 있어, 읽는 사람이 머릿속에서 흐름을 재구성해야 한다.

또한 스크린샷 그리드는 `object-cover object-top`으로 상단만 보여 준다. 이미지 아래쪽이 잘려 있고, 관리자 화면처럼 정보 밀도가 높은 스크린샷은 축소 상태에서 글자를 읽을 수 없다. 확대해서 볼 수단이 없다.

이 문서는 (1) 아키텍처 다이어그램 4장과 (2) 스크린샷·다이어그램 공용 라이트박스를 정의한다.

이전 스펙 `2026-07-28-resume-and-contact-design.md`의 "범위 밖"에서 예고한 작업이며, 거기서 정한 원칙 — 이미지 생성 모델을 쓰지 않고 SVG를 직접 작성한다 — 을 그대로 따른다.

## 목표

- 파이프라인성 작업을 그림 한 장으로 먼저 보여 주고, 기존 카드가 각 단계를 상술하는 구조를 만든다.
- 다이어그램의 모든 라벨이 실제 `<text>`로 렌더된다. 오탈자·글자 뭉개짐이 구조적으로 불가능하다.
- 화살표 시작·끝점을 사람이 좌표로 적지 않는다. 노드 위치에서 계산한다.
- 스크린샷 전체를 잘림 없이 볼 수 있고, 원본 픽셀 크기로 확대해 글자를 읽을 수 있다.
- 다이어그램이 사이트 팔레트 토큰과 폰트를 상속한다. 색을 하드코딩하지 않는다.

## 범위 밖

- 모두의 캠퍼스 · 한약안전사용 플랫폼 다이어그램. Overpass 3-서버 순차 폴백은 일반적인 재시도 패턴이라 그림으로 얻는 것이 적고, 한약안전사용 플랫폼은 케이스 스터디 정보량 자체가 적다.
- 자유 확대/팬(휠 줌·드래그 팬·더블클릭 확대). 라이트박스는 fit ↔ 1:1 두 상태만 갖는다.
- 다이어그램 자동 레이아웃 엔진. 4장 규모에서 과잉이다.
- 인쇄용 다이어그램 스타일. `/resume`만 인쇄 규격을 갖고 프로젝트 상세는 대상이 아니다.

---

## 선행 제약 — 코드를 읽고 그린다

다이어그램 4장은 **각 프로젝트의 실제 코드를 읽은 뒤에** 그린다. 케이스 스터디 산문은 요약이라 단계 이름·순서·분기가 실제 구현과 다를 수 있다. 산문만 보고 그리면 사이트가 사실과 다른 구조를 주장하게 된다.

읽을 저장소(모두 로컬 작업 디렉터리에 있다):

| 다이어그램 | 저장소 | 확인할 것 |
| --- | --- | --- |
| ycc-websub | `ycc-website` | WebSub 콜백 라우트 경로, 구독 검증 조건, 서명 헤더·알고리즘, QStash 잡 이름, 재구독 cron, 백필 경로 |
| ycc-qstash | `ycc-website` | 잡 엔드포인트 경로와 실제 체이닝 순서, 선점 쿼리, 백오프 지연 계산식, Gemini 스키마 호출 지점 |
| sumgim-blur | `ankang-sumgim` | 감지가 도는 위치, 업로드 라우트가 Server Action인지 API Route인지, sharp 파이프라인 순서, R2 키 프리픽스, 토글 플래그 컬럼 |
| worldeng-lead | `worldengco-website` | 홈 분기 링크 구조, 견적/문의 폼 제출 경로, 예약 테이블 스키마, 관리자 캘린더·수동 등록 경로, Wix 이관 스크립트의 dry-run/apply 플래그 |

코드에서 확인한 사실과 기존 케이스 스터디 문장이 어긋나면, **다이어그램을 문장에 맞추지 말고 문장 수정을 별도로 보고한다.** 임의로 케이스 스터디 문안을 고치지 않는다.

---

## Phase 1 — 다이어그램

### 1-1. 데이터 모델

`src/content/projects/case-studies.ts`의 cards 변형에 옵셔널 필드 하나를 추가한다. prose 변형은 건드리지 않는다.

```ts
export type DiagramId =
  | "ycc-websub"
  | "ycc-qstash"
  | "sumgim-blur"
  | "worldeng-lead";

export type CaseStudySection =
  | { heading: string; prose: ProseSegment[] }
  | { heading: string; diagram?: DiagramId; cards: Card[]; columns?: 2 };
```

`CaseStudyBody`는 `section.diagram`이 있을 때 헤딩과 카드 그리드 사이에 `<CaseStudyDiagram id={section.diagram} />`을 렌더한다. 그림이 전체 흐름을 보여 주고 카드가 각 단계를 상술하는 순서다.

### 1-2. 파일 구조

```
src/components/project/
  CaseStudyDiagram.tsx       figure 셸 · 가로 스크롤 · figcaption · 라이트박스 트리거
  diagrams/
    primitives.tsx           Node · Arrow · Lane · marker defs · 좌표 상수
    YccWebsub.tsx
    YccQstash.tsx
    SumgimBlur.tsx
    WorldengLead.tsx
    index.ts                 DIAGRAMS 레지스트리
    registry.test.ts
```

`DiagramId`는 콘텐츠 쪽(`case-studies.ts`)이 소유한다. `diagrams/index.ts`가 그 타입을 import해 `Record<DiagramId, ComponentType>`로 레지스트리를 선언하므로, id를 추가하고 컴포넌트를 안 만들면 타입 검사에서 걸린다. 의존 방향은 컴포넌트 → 콘텐츠 한 방향이다.

### 1-3. 프리미티브 — 화살표가 어긋나지 않는 이유

노드는 그리드 좌표 `(col, row)`로만 선언한다. 픽셀 좌표는 `primitives.tsx`의 상수(칸 폭·높이·간격)에서 계산된다.

```
node(col, row) → { x, y, w, h }   // 한 곳에서만 계산
Arrow from={"hub"} to={"callback"} label="Atom push"
   → 두 노드의 박스에서 접점을 구해 d 속성을 만든다
```

`x1="240" y1="80"` 같은 좌표를 손으로 적는 코드는 두지 않는다. 노드를 옮기면 화살표가 따라온다.

- 화살촉은 `<defs><marker>` 한 벌을 공유한다. 다이어그램마다 재정의하지 않는다.
- 경로 종류는 세 가지로 제한한다: 주 흐름(accent 실선), 보조 흐름(line 실선), 되돌이/재시도(line 점선).
- 라벨은 경로 중점 위에 배경 사각형과 함께 놓아 선 위에서 읽히게 한다.

### 1-4. 시각 규격

| 요소 | 값 |
| --- | --- |
| 노드 배경 / 보더 | `var(--color-card)` / `var(--color-line)` |
| 강조 노드 | `var(--color-card-hi)` / `var(--color-line-accent)` |
| 주 경로 · 강조 텍스트 | `var(--color-accent)` |
| 노드명 | sans 13px, `var(--color-ink)` |
| 경로 라벨 · 보조 문구 | mono 11px, `var(--color-muted)` |
| 레인 라벨 | mono 11px, `var(--color-faint)` |

색은 전부 CSS 변수로 참조한다. 인라인 SVG라 팔레트를 바꾸면 다이어그램도 따라 바뀐다. 폰트도 페이지 폰트를 상속하므로 SVG 안에 폰트를 임베드하지 않는다.

본문 텍스트로 쓰는 색은 `var(--color-muted)` 이상만 사용한다. `faint`·`ghost`는 `globals.css` 주석대로 장식용 라벨 전용이다.

### 1-5. 반응형

다이어그램은 `viewBox` 고정 좌표계를 갖고, 컨테이너에서 `min-width`를 유지한 채 `.prose-scroll`(이미 `globals.css`에 있는 규약)로 가로 스크롤한다. 폭에 맞춰 축소하지 않는다 — 축소하면 11px 라벨이 읽히지 않는다.

`min-width`는 다이어그램별로 실제 콘텐츠 폭에 맞춰 정한다. 페이지 본문은 가로 스크롤되지 않는다.

### 1-6. 다이어그램 4장

각 항목의 내용은 **코드 확인 후 확정**한다. 아래는 그릴 대상과 강조점이다.

**ycc-websub** — 영천중앙교회 `## 설교 자동 동기화 — WebSub 푸시`

주 흐름: YouTube 채널 업로드 → PubSubHubbub 허브 → 콜백 라우트 → videoId 파싱 → QStash 잡 발행.
콜백 노드에 두 갈래 검증을 명시한다: 구독 검증(토픽 일치 시에만 challenge 에코)과 알림 검증(`X-Hub-Signature` HMAC-SHA1 timing-safe 비교).
보조 흐름 둘: QStash cron → 리스 만료 전 재구독, 재생목록 순회 백필 → 누락분 보완.

**ycc-qstash** — 영천중앙교회 `## AI 요약 파이프라인 — 서버리스 메시지 큐`

주 흐름: ingest-video → fetch-transcript → summarize → DB 반영. 각 잡 입구에 HMAC 서명 검증 표시.
강조 둘: 원자적 선점(CTE `UPDATE ... RETURNING`)으로 중복 요약 차단, 실패 시 QStash 지연 발행으로 지수 백오프하는 되돌이 경로(점선).

**sumgim-blur** — 안강 섬김 `## 핵심 엔지니어링 — 얼굴 자동 블러 파이프라인`

레인 3개로 나눈다: 브라우저 / 서버 / 저장소. 레인 분리 자체가 "왜 감지는 순차이고 업로드는 병렬인가"를 설명한다.
브라우저: 파일 선택 → face-api.js TinyFaceDetector 순차 감지(WebGL 단일 스레드) → 좌표 배열.
서버: 업로드 라우트 → sharp EXIF 회전 보정 → 영역 extract → blur → 원위치 합성.
저장소: `original/`·`blurred/` 병렬 업로드, 사진별 블러 on/off 토글.

**worldeng-lead** — 월드ENC.CO `## 핵심 작업`

리드 획득 동선: 홈 → 반려견 목욕차 / 복지 이동목욕차 듀얼 트랙 분기 → 각 제품 페이지 → 맞춤 견적 폼 → 저장.
관리자 쪽에서 예약 캘린더(휴무·영업일 지정)와 전화 접수 수동 등록이 같은 예약 데이터로 합류하는 지점을 표시한다.
좌측 보조 흐름: Wix 게시물 → 이관 스크립트 dry-run → apply → 저장.

한 장에 IA 재설계와 예약 시스템이 같이 설명된다. Cloudflare Workers 배포 구성은 그리지 않는다 — 박스 3개짜리라 정보량이 없다.

---

## Phase 2 — 라이트박스

### 2-1. 구현 기반

네이티브 `<dialog>` + `showModal()`을 쓴다. ESC 닫기, 포커스 트랩, 배경 inert, top-layer 렌더가 전부 브라우저 기본 동작이다. 직접 구현한 오버레이는 포커스 트랩에서 거의 반드시 문제가 생긴다.

배경 어둡게는 `::backdrop`으로 처리한다.

### 2-2. 셸

```
┌──────────────────────────────────────────────────────┐
│ ~/screenshots/ycc-admin-sermons.png   [2/3]  1:1   ✕ │
├──────────────────────────────────────────────────────┤
│                                                      │
│                    콘텐츠 영역                         │
│                                                      │
├──────────────────────────────────────────────────────┤
│ 관리자 CMS — 설교 관리 (YouTube 동기화·AI 요약 상태)      │
└──────────────────────────────────────────────────────┘
```

헤더는 모노. 경로는 `faint`, 카운터와 활성 버튼은 `accent`. 사이트의 터미널 톤을 그대로 쓴다.
푸터 캡션은 이미지의 `alt`(스크린샷) 또는 다이어그램 제목을 그대로 쓴다. 캡션 문안을 새로 만들지 않는다.

### 2-3. 두 가지 표시 모드

| 모드 | 동작 |
| --- | --- |
| fit (기본) | `object-contain`으로 뷰포트 안에 전체를 넣는다. 썸네일에서 잘려 있던 아래쪽이 여기서 보인다. |
| 1:1 | 원본 픽셀 크기로 렌더하고 컨테이너를 스크롤한다. 관리자 화면 글자를 읽는 수단이다. 모바일에서도 이 모드로 훑는다. |

헤더의 `1:1` 버튼으로 토글한다. 1:1로 전환하면 스크롤 위치는 좌상단에서 시작한다.

다이어그램은 벡터라 확대 개념이 없다. `1:1` 버튼을 노출하지 않고, 라이트박스 폭을 꽉 채워 렌더한다. 좁은 화면에서는 컨테이너 가로 스크롤로 본다.

### 2-4. 탐색

한 프로젝트의 스크린샷 전체가 하나의 갤러리다. `shotRows`를 평탄화한 순서를 인덱스로 쓴다.

- `←` / `→` 키와 헤더 카운터 `[2/3]`로 이동한다.
- 이동하면 표시 모드는 fit으로 초기화한다.
- 다이어그램은 단독으로 열린다. 스크린샷 갤러리와 섞지 않는다 — 성격이 다른 콘텐츠다.

### 2-5. 썸네일 어포던스

현재 스크린샷 셀은 `<div>`라 키보드로 도달할 수 없다. `<button>`으로 바꾼다.

- hover·focus 시 보더가 `var(--color-line-accent)`로 바뀌고 우상단에 모노 `⤢` 뱃지가 뜬다.
- `aria-label`은 `크게 보기: {alt}`.
- 그리드 썸네일 자체는 지금의 `object-cover object-top`을 유지한다. 격자 정렬이 무너지지 않고, "전체를 보려면 눌러라"가 라이트박스의 역할이다.

다이어그램도 같은 방식으로 누르면 열린다. `CaseStudyDiagram`의 figure에 확대 버튼을 둔다.

### 2-6. 컴포넌트 경계

```
src/components/project/
  Lightbox.tsx        "use client" — dialog · 키보드 · fit/1:1 · 카운터 (공용)
  ShotGallery.tsx     "use client" — 썸네일 그리드 + Lightbox 연결
  CaseStudyShots.tsx  → ShotGallery로 대체(삭제)
  CaseStudyDiagram.tsx "use client" — figure + 확대 버튼 + Lightbox 연결
```

`Lightbox`는 아이템 배열을 받는다.

```ts
type LightboxItem =
  | { kind: "image"; src: string; alt: string }
  | { kind: "diagram"; id: DiagramId; title: string };
```

`kind`에 따라 헤더 버튼 구성과 콘텐츠 렌더만 갈라진다. 셸·키보드·포커스 처리는 공유한다.

케이스 스터디 데이터(`case-studies.ts`)와 페이지는 서버 컴포넌트로 유지한다. 클라이언트 경계는 위 세 파일까지만 내려간다. 다이어그램 SVG 컴포넌트는 순수 프레젠테이션이라 어느 쪽에서 렌더돼도 무방하다.

### 2-7. 접근성

- `<dialog>`에 `aria-labelledby`로 헤더의 파일명/제목을 연결한다.
- 닫으면 포커스가 열었던 트리거 버튼으로 돌아간다.
- `←/→`, `Esc` 키 안내를 헤더에 모노 힌트로 표시한다.
- `prefers-reduced-motion: reduce`이면 페이드/트랜지션을 적용하지 않는다. `globals.css`가 이미 같은 원칙으로 스크롤 애니메이션을 다룬다.
- 다이어그램 SVG는 `role="img"` + `aria-labelledby` → `<title>`/`<desc>`. `<desc>`에는 흐름을 문장으로 서술한다. 스크린리더 사용자에게는 이 문장이 다이어그램의 전부다.

---

## 테스트

기존 `meta.test.ts` · `assets.test.ts`의 빌드타임 검증 패턴을 따른다.

| 대상 | 검증 |
| --- | --- |
| `diagrams/registry.test.ts` | `case-studies.ts`에 쓰인 모든 `diagram` id가 `DIAGRAMS` 레지스트리에 존재한다. 레지스트리에 있는데 어디서도 안 쓰이는 항목도 잡는다. |
| 다이어그램 렌더 스모크 | 4장 각각이 비어 있지 않은 `<title>`과 `<desc>`를 갖는다. |
| `Lightbox` | 열림 시 dialog가 modal이고, `Esc`로 닫히며, 닫힌 뒤 포커스가 트리거로 복귀한다. `←/→`로 인덱스가 순환한다. |
| `ShotGallery` | 썸네일이 button이고 `aria-label`을 갖는다. |
| E2E (Playwright) | 프로젝트 상세에서 썸네일 클릭 → 라이트박스 열림 → `1:1` 토글 → `Esc` 닫힘. 다이어그램이 있는 3개 페이지에서 다이어그램이 렌더된다. |

기존 E2E가 `CaseStudyShots`의 DOM 구조에 의존한다면 함께 갱신한다.

## 검증

- `npm run lint`, 포매팅 검사, `vitest`, `playwright` 전부 통과.
- 다이어그램 3개 페이지를 실제로 열어 라벨 오탈자와 화살표 접점을 눈으로 확인한다. 특히 `WebSub`, `PubSubHubbub`, `QStash`, `face-api.js`, `sharp` 표기.
- 모바일 폭(375px)에서 페이지 본문이 가로로 스크롤되지 않는지 확인한다. 스크롤은 다이어그램 컨테이너 안에서만 일어나야 한다.
