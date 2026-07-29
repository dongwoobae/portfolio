// 다이어그램의 신원(id)과 접근성 텍스트·좌표계 크기. 순수 데이터라 컴포넌트를 import하지 않는다.
// SVG 컴포넌트 레지스트리는 src/components/project/diagrams/index.ts에 있고,
// Record<DiagramId, ComponentType>이라 여기 id를 추가하고 컴포넌트를 안 만들면 타입 검사가 깨진다.

export type DiagramId =
  "ycc-websub" | "ycc-qstash" | "sumgim-blur" | "worldeng-reservation";

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
    desc: "YouTube 채널에 영상이 올라오면 PubSubHubbub 허브가 Atom XML을 콜백으로 푸시한다. 콜백은 X-Hub-Signature를 HMAC-SHA1로 timing-safe 검증한 뒤 videoId를 파싱해 Upstash QStash에 ingest-video 잡을 발행한다. 구독 검증 요청은 채널 토픽이 일치할 때만 challenge를 에코한다. 별도로 2일 주기 cron이 구독을 재갱신하고, 매일 cron이 채널 최신 영상을 Neon의 sermons 테이블과 대조해 푸시 소실분을 보정 등록한다.",
    width: 840,
    height: 490,
  },
  "ycc-qstash": {
    title: "AI 요약 파이프라인 — QStash 단계 체이닝과 두 갈래 재시도",
    desc: "ingest-video, fetch-transcript, summarize 세 잡을 QStash 메시지로 이어 붙여 서버리스 실행 시간 제한을 피한다. 모든 잡 입구에서 QStash 서명을 검증한다. 영상 정보나 자막이 준비되지 않으면 QStash 지연 발행으로 30분 뒤 재투입하며 최대 12회 반복한다. 요약 실패는 다음 재시도 시각을 5 곱하기 3의 n 빼기 1 제곱 분으로 DB에 적어 두고 매시간 스위퍼가 최대 3회까지 회수한다. 요약은 CTE 원자적 선점으로 중복 실행을 막고, 요약 본문은 Google Gemini가 responseSchema로 강제된 JSON으로 만들어 Neon의 sermons 테이블에 저장한다.",
    width: 840,
    height: 520,
  },
  "sumgim-blur": {
    title: "얼굴 자동 블러 업로드 파이프라인",
    desc: "브라우저에서 이미지를 먼저 압축해 업로드 파일과 얼굴 좌표의 기준을 맞춘 뒤 face-api.js로 얼굴을 감지한다. TensorFlow.js 백엔드가 단일 스레드라 감지는 순차로 돈다. 업로드는 Server Action 직렬화를 피해 API Route로 병렬 전송한다. 서버는 세션과 매직바이트를 검증하고 sharp로 EXIF 회전을 보정한 뒤 리사이즈본 기준으로 좌표를 변환해 해당 영역만 블러 처리해 합성한다. 블러본과 원본을 Cloudflare R2에 병렬 업로드하고 메타데이터는 Supabase에 순차로 저장한다.",
    width: 840,
    height: 635,
  },
  "worldeng-reservation": {
    title: "예약 시스템 — 가용 판정 공유와 이중예약 방어",
    desc: "클라이언트 데이트피커는 가용 판정 API로 예약 불가일을 받아 비활성화하고, 서버 액션은 같은 판정 함수로 다시 검증한다. 판정은 공휴일 API와 관리자 휴무 지정, 예약 타입별 요일 규칙을 조합하며 공휴일 API 장애 시에는 통과시킨다. 제출은 요청 제한, Turnstile, 스키마 검증, 6개월 상한, 가용 재검증을 차례로 거쳐 저장된다. 전화 접수는 같은 테이블에 수동 등록으로 합류한다. 확정 예약의 날짜와 시간에는 부분 유니크 인덱스가 걸려 있어 앱 레벨 검사가 원자적이지 않은 Cloudflare D1에서도 이중예약이 최종 차단된다.",
    width: 840,
    height: 520,
  },
};
