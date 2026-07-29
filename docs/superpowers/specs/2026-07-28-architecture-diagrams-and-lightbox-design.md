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

## 코드 확인 결과 (2026-07-28 완료)

아래 제약에 따라 3개 저장소를 읽었다. 확인된 사실과 문안 불일치는 이 절이 기준이다.

### 영천중앙교회

- 감지: `POST /api/youtube/websub` — `X-Hub-Signature`(`sha1=`) HMAC-SHA1 + `timingSafeEqual`. `<at:deleted-entry>`는 무시. `GET`은 `hub.topic`이 채널 토픽일 때만 `hub.challenge` 에코, 아니면 404.
- 영상·채널 데이터: **RapidAPI yt-api** — `/video/info`(단건), `/channel/videos`(보정). YouTube Data API v3가 아니다.
- 자막: yt-api `/subtitles` → 한국어 트랙 URL → **YouTube timedtext XML 직접 fetch**(429/5xx는 지수 백오프 4회) → 파싱. 호스트가 `youtube-transcript3`면 `/api/transcript`로 분기.
- 잡 체인: `ingest-video → fetch-transcript → summarize`, 전부 `verifyQStash`(Upstash Receiver) 서명 검증.
- 예배 분류: 재생목록 소속이 아니라 **제목 기반 `classifyByTitle`**.
- 재시도: ingest·transcript는 **QStash delay 고정 30분 × 최대 12회**. summarize 실패는 `computeNextRetry = 5 × 3^(n-1)`분을 DB `summary_next_retry_at`에 저장하고 **매시간 `retry-summaries` 스위퍼**가 재투입.
- 선점: `WITH claimed AS (UPDATE ... RETURNING ...)` CTE.
- 자막 저장: `sermon_transcripts` 위성 테이블 upsert. summarize는 DB에서 읽는다.
- 스케줄: `websub-renew` 2일마다 / `retry-summaries` 매시간 / `reconcile-sermons` 매일 / `analytics-rollup` 매일.
- 보정: `reconcileSermons`는 채널 최신 영상 목록과 DB를 대조해 누락분을 in-process로 직접 등록한다. **재생목록 순회가 아니다.**

**문안 불일치 2건 — Phase 0에서 정정한다.**

1. `"누락분은 재생목록 순회 백필로 보완"` → 채널 최신 영상 ↔ DB 대조 보정.
2. `"QStash 지연 발행(delay)으로 지수 백오프(5·3ⁿ분) 구현"` → 두 메커니즘이 섞였다. delay 발행은 고정 30분 재시도, 5·3ⁿ 백오프는 DB + 매시간 스위퍼.

### 안강 섬김

- Phase 1(브라우저, 순차 — TF.js WebGL/WASM 단일 스레드): `compressImageFile`(캔버스 축소, Vercel 본문 4.5MB 한도 대응)을 **먼저** 수행해 업로드 파일과 얼굴 좌표의 기준 이미지를 일치시킨다 → `face-api.js tinyFaceDetector`(`scoreThreshold: 0.45`) → `naturalWidth/width` 스케일 보정.
- 메모리: `img.src = ""` + `revokeObjectURL` + `setTimeout(0)` GC yield.
- Phase 2(병렬): `Promise.all` → `fetch POST /api/upload-photo`. Server Action은 React 큐로 직렬화되므로 API Route를 쓴다. DB 저장(`savePhotoMetadata`)은 경량 INSERT라 **순차**.
- 서버 검증 순서: Supabase 세션 → folder 화이트리스트 정규식 → MIME 화이트리스트(HEIC 제외 — Vercel sharp에 HEVC 디코더 없음)·30MB → **매직바이트 `detectImageType`**(`file.type`은 위조 가능) → `faceRegions` 검증(배열·50개 이하).
- sharp: `.rotate()`(EXIF) → `.resize(1920, inside).webp(75)` → `scaleFaceRegions`(원본→리사이즈본 좌표 변환, 경계 클램프, 4px 이하 제외) → `extract().blur(28)` → `composite()`.
- 저장: `Promise.all`로 `{folder}/blurred/{ts}.webp` + `{folder}/original/{ts}.webp`. 얼굴 0개면 단순 압축 1건만.

문안 불일치 없음.

### 월드ENC.CO

- 듀얼 트랙: `/products/pet`, `/products/welfare`. 문의는 `inquiries.type = pet | welfare | etc`.
- 예약 폼 `submitReservation` 방어 순서: **rate limit(IP 슬라이딩, 10분 5회) → Turnstile → Zod → 6개월 상한 → 서버 가용 재검증 → insert**. 실패는 throw가 아니라 `FormState` 반환(폼 입력 유실 방지).
- 가용 판정 `getUnavailableReason`를 **클라이언트 데이트피커와 서버 액션이 같은 함수로 공유**. 공휴일 API 장애 시 fail-open.
- 규칙: `external_repair`는 토요일만, `self_as`·`training`은 일요일 제외. `day_overrides`(`closed`/`open`)가 공휴일보다 우선.
- `GET /api/availability?year&month&type` — 월 단위 비활성 날짜 계산. 외부 공휴일 API 쿼터 방어로 연도 ±1년 제한.
- 예약 타입 3종: 자사 차량 A/S · 타사 차량 정비(토요일) · 운영 교육. 시간 슬롯 08~17, `hour = null`이면 "시간 협의".
- `source: web | manual` — 전화 접수 수동 등록이 같은 테이블에 합류. `status: pending → confirmed | rejected | done`.
- **이중예약 최종 방어선**: partial unique index `(date, hour) WHERE status = 'confirmed' AND hour IS NOT NULL`. D1에서 앱 레벨 check-then-insert가 원자적이지 않기 때문.
- Wix 이관: `scripts/wix-delivery-import.mjs` — 기본 dry-run, `--apply`에는 `--local|--remote` 필수.

**문안 불일치는 없으나 과소 서술이다.** 예약이 관리자 기능 한 줄로만 적혀 있다. Phase 1에서 `## 예약 시스템 — 이중예약 방어` 섹션을 신설한다.

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

## Phase 0 — 문안 정정 (선행)

다이어그램이 실코드를 그리므로, 같은 섹션의 카드 문장이 코드와 다르면 그림과 글이 서로 다른 주장을 하게 된다. 다이어그램보다 먼저 고친다. 대상은 `src/content/projects/case-studies.ts`의 `ycc-website` 두 문장이며, 위 "코드 확인 결과 → 영천중앙교회"의 불일치 2건이다.

정정 범위는 이 두 문장으로 한정한다. 다른 프로젝트의 문안은 건드리지 않는다.

---

## Phase 1 — 다이어그램

### 1-1. 데이터 모델

`src/content/projects/case-studies.ts`의 cards 변형에 옵셔널 필드 하나를 추가한다. prose 변형은 건드리지 않는다.

```ts
export type DiagramId =
  | "ycc-websub"
  | "ycc-qstash"
  | "sumgim-blur"
  | "worldeng-reservation";

export type CaseStudySection =
  | { heading: string; prose: ProseSegment[] }
  | { heading: string; diagram?: DiagramId; cards: Card[]; columns?: 2 };
```

`CaseStudyBody`는 `section.diagram`이 있을 때 헤딩과 카드 그리드 사이에 `<CaseStudyDiagram id={section.diagram} />`을 렌더한다. 그림이 전체 흐름을 보여 주고 카드가 각 단계를 상술하는 순서다.

### 1-2. 파일 구조

```
src/content/projects/
  diagrams.ts                DiagramId + DIAGRAM_META(제목·설명·크기) — 순수 데이터
  diagrams.test.ts           레지스트리 ↔ 사용처 정합성
src/components/project/
  CaseStudyDiagram.tsx       figure 셸 · figcaption · 라이트박스 트리거
  diagrams/
    geometry.ts              순수 좌표 계산 (화살표 접점·박스)
    geometry.test.ts
    primitives.tsx           DiagramSvg · Node · Arrow · Loop · Lane
    YccWebsub.tsx
    YccQstash.tsx
    SumgimBlur.tsx
    WorldengReservation.tsx
    index.ts                 DIAGRAMS: Record<DiagramId, ComponentType>
```

`DiagramId`와 `DIAGRAM_META`는 콘텐츠 쪽(`src/content/projects/diagrams.ts`)이 소유한다. `diagrams/index.ts`가 그 타입을 import해 `Record<DiagramId, ComponentType>`로 레지스트리를 선언하므로, id를 추가하고 컴포넌트를 안 만들면 **타입 검사에서 걸린다**. 의존 방향은 컴포넌트 → 콘텐츠 한 방향이다.

좌표 계산(`geometry.ts`)을 JSX(`primitives.tsx`)에서 분리하는 이유는 아래 "테스트" 절의 제약 때문이다 — 순수 함수만 단위 테스트할 수 있다.

### 1-3. 프리미티브 — 화살표가 어긋나지 않는 이유

각 다이어그램은 노드를 `{ id, x, y, w, h, title, notes }` 배열로 선언한다. 노드 **위치는 사람이 정하지만, 화살표 기하는 전부 파생**된다.

```
Arrow from="hub" to="callback" label="Atom push"
   → anchor(hub, callback) · anchor(callback, hub)로 두 박스의 접점을 구해 d를 만든다
```

`x1="240" y1="80"` 같은 좌표를 손으로 적는 코드는 두지 않는다. 노드를 옮기면 화살표가 따라온다. `anchor()`는 두 박스 중심을 잇는 방향의 지배 축을 판정해 마주 보는 변 위의 점을 반환하므로, 어떤 배치에서도 선이 박스 안에서 시작하거나 허공에서 끝나지 않는다.

- 경로 종류는 세 가지로 제한한다: 주 흐름(accent 실선), 보조 흐름(line 실선), 되돌이/재시도(line 점선).
- 되돌이 경로는 `Loop`가 노드 오른쪽으로 빠져나갔다 되돌아오는 경로를 그린다. 재시도 표현 전용이다.
- 경로 라벨은 배경 사각형 대신 `paint-order: stroke` + 페이지 배경색 stroke로 후광을 준다. 라벨 폭을 추정해 사각형을 그리면 반드시 어긋난다.

**마커 id는 반드시 인스턴스마다 유니크해야 한다.** 라이트박스가 열리면 같은 다이어그램이 문서에 두 벌 존재하고, `<marker id="arrow">`가 중복되면 `url(#arrow)`가 먼저 나온 쪽으로 붙어 화살촉이 사라지거나 엉뚱하게 그려진다. `DiagramSvg`가 `useId()`로 접두사를 만들어(콜론 제거) 컨텍스트로 내려주고, `Arrow`·`Loop`가 그것을 참조한다.

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

**브랜드 마크 (2026-07-29 추가)**

노드가 외부 제품에 붙어 있을 때 제목 왼쪽에 16px 마크를 단다. 사이트 팔레트를 벗어나는 유일한 색이며, 그래서 규칙이 필요하다.

- **경로 데이터는 짓지 않는다.** `scripts/gen-diagram-logos.mjs`가 simple-icons 16.27.1에서 받아 `logos.generated.ts`로 굽는다. 손으로 그린 근사치는 진짜 마크들 옆에서 바로 티가 난다.
- **simple-icons에 없으면 `MANUAL_LOGOS`에 넣되, 지어내지는 않는다.** 원본 이미지가 있을 때만 넣고 **색·치수는 원본 픽셀에서 뽑는다** — 눈으로 짐작하면 반드시 어긋난다. 현재 두 건이 있다.
  - `pubsubhubbub` — 초록 정사각·노랑 원·분홍 정사각. 원본(264×200)에서 도형 25px·간격 5px·전체 85×25를 재서 세로 24 기준 `24 / 5 / 24 / 5 / 24 = 82`로 환산했다. 도형마다 색이 달라 단일 경로로는 표현할 수 없다.
  - `tensorflowjs` — 경로는 simple-icons의 공식 TensorFlow 글리프, 색은 TF.js 원본에서 뽑은 `#FF8500`. **JS 배지는 뺐다**: 배지 남색 `#425066`은 카드 배경 대비 2.22:1로 기준 미달이라 어두운 배경에서 글리프를 베어 문 자국처럼 보이고, 16px에서 안의 글자도 읽히지 않는다.
- **마크가 정사각이라는 보장은 없다.** `LogoMark.aspect`(가로/세로)가 제목 들여쓰기를 정한다. PubSubHubbub은 3.42라 16px 높이에서 55px 폭을 차지하므로, 그 노드는 제목을 짧게 두고 이름을 캡션이 진다.
- **색 대비.** 마크는 그래픽 객체라 카드 배경(`#12161c`) 대비 3:1이 필요하다. 현재 9종 전부 4.5 이상이다(최저 YouTube 4.54, Google Gemini 4.61).
- **캡션.** `brandCaption`을 켜면 마크가 가리키는 브랜드 이름이 제목 아래 한 줄로 붙는다(`CAPTION_LINE = 15`만큼 노드 `h`를 키워야 한다). 제목의 이름과 마크의 브랜드가 **다를 때만** 켠다 — QStash에 Upstash, R2에 Cloudflare처럼 소유 관계를 알려 줄 때다. `sharp 전처리`처럼 제목이 이미 이름이면 끈다.
- 캡션 글자는 브랜드 색이 아니라 `tertiary`로 적는다. 색은 마크가 지고, 글자는 4.5:1을 보장받는 편이 낫다.

**접근성 주의.** `svg[role="img"]`는 내부 요소를 보조기술에 노출하지 않는다. 마크만 이름을 지는 노드(`ycc-websub`의 YouTube 채널은 제목이 `채널`뿐이다)는 **`DIAGRAM_META.desc`가 그 브랜드 이름을 반드시 말해야 한다.** 마크를 추가하거나 제목에서 브랜드명을 빼면 `desc`를 같이 고친다.

### 1-5. 반응형

> **개정 (2026-07-29)** — 아래 원안(가로 스크롤)은 **폐기했다.** 실제로 붙여 보니
> 데스크톱에서까지 스크롤 막대가 생겨 읽는 흐름이 끊긴다. 현재 방식은 반대다.

다이어그램은 `viewBox` 고정 좌표계를 갖되 `width`/`height` 속성 없이 `w-full h-auto`로 **컨테이너 폭에 맞춰 스스로 축소된다.** 어떤 화면에서도 가로 스크롤이 생기지 않는다.

축소의 대가는 두 갈래로 치른다.

- **데스크톱에서는 축소가 아예 일어나지 않게 한다.** 좌표계 폭을 컨테이너 안쪽(`960 − 80(px-10 좌우) − 24(p-3 좌우) − 2(border) = 854px`) 이하로 잡는다. 네 장 모두 **840**이라 배율은 1.017 — 오히려 미세하게 확대된다. 이 불변식은 E2E(`데스크톱에서 축소 없이 렌더된다`)가 지킨다.
- **좁은 화면에서는 라이트박스의 `1:1` 토글이 읽는 경로다.** 375px에서는 배율이 0.37까지 떨어져 11.5px 보조 문구가 4.3px이 된다 — 인라인 렌더는 "전체 구조를 보는 지도"고, 글자를 읽으려면 ⤢로 열어 원본 크기로 훑는다.

좌표계를 854px 안에 넣으려면 폭 대신 높이를 쓴다. `sumgim-blur`는 브라우저 단계 4개를 한 줄(912px)에 늘어놓을 수 없어 2×2로 접었고, 그래서 560 → 625로 길어졌다.

`.prose-scroll`은 이 변경으로 쓰는 데가 없어져 `globals.css`에서 제거했다.

### 1-6. 다이어그램 4장

내용은 위 "코드 확인 결과"가 근거다. 라벨 표기는 코드의 실제 이름을 쓴다.

**ycc-websub** — 영천중앙교회 `## 설교 자동 동기화 — WebSub 푸시`

주 흐름: `YouTube 채널` → `PubSubHubbub 허브` --Atom XML push--> `POST /api/youtube/websub` --`yt:videoId`--> `QStash ingest-video 발행`.
콜백 노드에 검증을 명시한다: `X-Hub-Signature` HMAC-SHA1 timing-safe 비교, `<at:deleted-entry>` 무시.
별도 노드로 구독 검증 경로: `GET /api/youtube/websub` — `hub.topic` 일치 시에만 `hub.challenge` 에코, 불일치는 404.
보조 흐름 둘(점선): `QStash cron 2일` → `websub-renew` → 허브 재구독, `QStash cron 매일` → `reconcile-sermons` → yt-api `/channel/videos` ↔ DB 대조 → 누락분 직접 등록.

**ycc-qstash** — 영천중앙교회 `## AI 요약 파이프라인 — 서버리스 메시지 큐`

주 흐름: `ingest-video` → `fetch-transcript` → `summarize` → `Neon`. 각 노드에 `verifyQStash` 표시.
`ingest-video` 보조 문구: `sermonExists` 중복 차단, yt-api `/video/info`, `classifyByTitle`.
`fetch-transcript` 보조 문구: yt-api `/subtitles` → timedtext XML 직접 파싱, `sermon_transcripts` upsert.
`summarize` 보조 문구: `WITH claimed AS (UPDATE ... RETURNING)` 원자적 선점, Gemini `responseSchema`.
되돌이 경로 3개: `ingest-video`·`fetch-transcript`는 각각 `Loop`로 **QStash delay 고정 30분 × 12회**, `summarize` 실패는 `summary_next_retry_at = 5 × 3^(n-1)분` → `QStash cron 매시간 retry-summaries` 노드에서 되돌아오는 점선.

두 재시도 메커니즘이 다르다는 것이 이 그림의 핵심이다. 하나로 뭉개지 않는다.

**sumgim-blur** — 안강 섬김 `## 핵심 엔지니어링 — 얼굴 자동 블러 파이프라인`

레인 3개: 브라우저 / 서버 / 저장소. 레인 분리 자체가 "왜 감지는 순차이고 업로드는 병렬인가"를 설명한다.
브라우저 Phase 1(레인 라벨에 `순차 — TF.js 단일 스레드`): `파일 선택` → `compressImageFile` → `face-api.js tinyFaceDetector (0.45)` → `좌표[] naturalWidth 보정`. 압축이 감지보다 **먼저**라는 순서가 중요하다(업로드 파일과 좌표의 기준 이미지 일치).
브라우저 Phase 2(레인 라벨에 `병렬 — Promise.all`): `fetch POST /api/upload-photo`. 노드 보조 문구로 `Server Action은 React 큐 직렬화 → API Route`.
서버: `Supabase 세션` → `folder·MIME·30MB` → `매직바이트 detectImageType` → `sharp .rotate() EXIF` → `.resize(1920).webp(75)` → `scaleFaceRegions 좌표 변환·클램프` → `extract().blur(28) → composite()`.
저장소: `blurred/{ts}.webp`·`original/{ts}.webp` 병렬 업로드 → `savePhotoMetadata (순차)`.
분기(점선): 얼굴 0개 → 단순 압축 1건만.

**worldeng-reservation** — 월드ENC.CO `## 예약 시스템 — 이중예약 방어` (신설 섹션)

좌측: `클라이언트 데이트피커` --`GET /api/availability`--> `getUnavailableReason`.
`getUnavailableReason` 노드 보조 문구: 공휴일 API(장애 시 fail-open) · `day_overrides` · 타입별 요일 규칙.
중앙 주 흐름: `예약 폼` → `submitReservation` → `D1 reservations (source='web', status='pending')`.
`submitReservation`은 방어 순서를 번호로 나열한다: ① rate limit(IP 슬라이딩 10분 5회) ② Turnstile ③ Zod ④ 6개월 상한 ⑤ 가용 재검증.
⑤에서 `getUnavailableReason`으로 가는 점선 — **클라이언트와 같은 함수를 재사용**한다는 것이 요점이다.
합류: `관리자 전화 접수` --`source='manual'`--> 같은 테이블. `관리자 day_overrides 지정` --점선--> `getUnavailableReason`.
하단: `확정(status='confirmed')` → `partial unique index (date, hour)`. 보조 문구: `D1은 check-then-insert가 원자적이지 않다 — 최종 방어선`.

Cloudflare Workers 배포 구성과 Wix 이관은 그리지 않는다. 전자는 박스 3개짜리라 정보량이 없고, 후자는 기존 카드 문장으로 충분하다.

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

> **개정 (2026-07-29)** — 원안은 "다이어그램은 벡터라 확대 개념이 없으므로 `1:1`
> 버튼을 노출하지 않는다"였다. 인라인 다이어그램이 컨테이너 폭에 맞춰 축소되도록
> 바꾸면서 이 판단이 뒤집혔다 — **축소가 생긴 순간 원래 크기로 되돌리는 수단이
> 필요해진다.** 벡터라서 확대가 무의미한 게 아니라, 벡터라서 확대해도 선명하다.

다이어그램도 스크린샷과 같은 `1:1` 토글을 쓴다. 다만 기준이 픽셀이 아니라 좌표계다.

| 모드 | 동작 |
| --- | --- |
| fit (기본) | 라이트박스 폭을 채우되 좌표계의 2배를 넘지 않는다. 넓은 모니터에서 13px 제목이 30px로 부풀면 다이어그램이 아니라 포스터가 된다. |
| 1:1 | 폭을 `viewBox` 폭으로 못 박고 넘치는 만큼 컨테이너가 스크롤한다. 좁은 화면에서 라벨을 읽는 경로가 이것이다. |

`LightboxItem`의 다이어그램 변형이 `width`(좌표계 폭)를 함께 들고 다니는 이유가 이 모드다.

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

**제약**: `vitest.config.ts`가 `include: ["src/**/*.test.ts"]`(`.tsx` 제외) + `environment: "node"`다. jsdom도 testing-library도 없다. **이 작업으로 새 테스트 의존성을 추가하지 않는다.** 따라서 컴포넌트 렌더·상호작용은 vitest가 아니라 Playwright가 검증한다. `<dialog showModal()>`·포커스·top-layer는 jsdom 에뮬레이션이 부실해 실제 브라우저 검증이 더 정확하기도 하다.

단위 테스트(`.ts`, 기존 `meta.test.ts`·`assets.test.ts` 패턴):

| 대상 | 검증 |
| --- | --- |
| `content/projects/diagrams.test.ts` | `case-studies.ts`에 쓰인 모든 `diagram` id가 `DIAGRAM_META`에 존재한다. `DIAGRAM_META`에 있는데 어디서도 안 쓰이는 항목도 잡는다. 모든 항목의 `title`·`desc`가 비어 있지 않고 `width`·`height`가 양수다. |
| `diagrams/geometry.test.ts` | `anchor()`가 항상 박스 경계 위의 점을 반환한다. 수평으로 나란한 두 박스면 오른쪽 변 중점을 반환한다. 수직이면 아래 변 중점. 대각선 배치에서도 반환점이 박스 밖으로 나가지 않는다. |

타입 검사가 나머지를 맡는다. `DIAGRAMS: Record<DiagramId, ComponentType>`이므로 id를 추가하고 컴포넌트를 안 만들면 `npm run typecheck`가 깨진다. 런타임 테스트로 중복 검증하지 않는다.

E2E(Playwright, `e2e/`):

| 대상 | 검증 |
| --- | --- |
| 다이어그램 렌더 | 다이어그램이 있는 3개 프로젝트 페이지에서 해당 `svg[role="img"]`가 보이고 접근가능 이름이 비어 있지 않다. |
| 스크린샷 라이트박스 | 썸네일 클릭 → dialog 열림 → 헤더에 파일명·카운터 표시 → `→`로 다음 장 이동 → `1:1` 토글 → `Esc` 닫힘 → 포커스가 원래 썸네일로 복귀. |
| 다이어그램 라이트박스 | 다이어그램 확대 버튼 클릭 → dialog 열림 → `1:1`로 전환하면 렌더 폭이 `viewBox` 폭과 같아짐 → `Esc` 닫힘 → 포커스 복귀. |
| 가로 스크롤 회귀 | 375px 뷰포트에서 `document.documentElement.scrollWidth <= clientWidth`. |
| 데스크톱 축소 회귀 | 1280px에서 모든 `svg[role="img"]`의 렌더 폭이 `viewBox` 폭 이상. 좌표계를 854px 너머로 넓히면 글자가 조용히 작아지므로 여기서 막는다. |
| 노드 문구 넘침 | 노드 `<text>`의 `getBBox()`가 박스 우측 8px·하단 4px 여백을 남긴다. 좌표는 타입 검사도 단위 테스트도 통과하므로 실제 렌더에서 재는 수밖에 없다. |
| 화살표 관통 | 선분 대 노드 사각형 교차(Liang-Barsky). 화살표가 무관한 노드를 파고들면 노드가 나중에 그려져 선이 상자 뒤로 사라진다. |
| 브랜드 마크 | 마크 `<path>`의 `d`가 비어 있지 않고 `fill`이 hex다. 생성 파일이 비면 노드에 빈 자리만 남는다. |

기존 `e2e/smoke.spec.ts`가 `CaseStudyShots`의 DOM 구조에 의존한다면 함께 갱신한다.

## 검증

- `npm run lint`, 포매팅 검사, `vitest`, `playwright` 전부 통과.
- 다이어그램 3개 페이지를 실제로 열어 라벨 오탈자와 화살표 접점을 눈으로 확인한다. 특히 `WebSub`, `PubSubHubbub`, `QStash`, `face-api.js`, `sharp` 표기.
- 모바일 폭(375px)에서 페이지 본문이 가로로 스크롤되지 않는지 확인한다. 스크롤은 다이어그램 컨테이너 안에서만 일어나야 한다.
