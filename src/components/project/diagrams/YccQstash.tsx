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
    h: 72,
    title: "summary_next_retry_at",
    notes: ["5 × 3ⁿ⁻¹ 분", "DB에 다음 시각 기록"],
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
      <Arrow
        nodes={N}
        from="ingest"
        to="transcript"
        label="QStash 발행"
        accent
      />
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
      <Loop
        nodes={N}
        on="transcript"
        label="자막 미준비 — 30분 후 재시도 ×12"
      />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
