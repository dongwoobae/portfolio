// 다이어그램의 신원(id)과 접근성 텍스트·좌표계 크기. 순수 데이터라 컴포넌트를 import하지 않는다.
// SVG 컴포넌트 레지스트리는 src/components/project/diagrams/index.ts에 있고,
// Record<DiagramId, ComponentType>이라 여기 id를 추가하고 컴포넌트를 안 만들면 타입 검사가 깨진다.

export type DiagramId = "ycc-websub" | "ycc-qstash";

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
    width: 858,
    height: 470,
  },
  "ycc-qstash": {
    title: "AI 요약 파이프라인 — QStash 단계 체이닝과 두 갈래 재시도",
    desc: "ingest-video, fetch-transcript, summarize 세 잡을 QStash 메시지로 이어 붙여 서버리스 실행 시간 제한을 피한다. 모든 잡 입구에서 QStash 서명을 검증한다. 영상 정보나 자막이 준비되지 않으면 QStash 지연 발행으로 30분 뒤 재투입하며 최대 12회 반복한다. 요약 실패는 다음 재시도 시각을 5 곱하기 3의 n제곱 분으로 DB에 적어 두고 매시간 스위퍼가 회수한다. 요약은 CTE 원자적 선점으로 중복 실행을 막는다.",
    width: 940,
    height: 520,
  },
};
