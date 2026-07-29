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

// 좌표계 폭은 CaseStudyDiagram 컨테이너 안쪽(854px)을 넘지 않는다 — 넘기면
// 데스크톱에서 축소 렌더되어 11.5px 보조 문구가 10px 아래로 떨어진다.
const NODES: DiagramNode[] = [
  {
    id: "yt",
    x: 24,
    y: 30,
    w: 170,
    h: 58,
    // 마크가 곧 이름이다 — 여기서만은 브랜드명을 글자로 적지 않는다.
    brand: "youtube",
    title: "채널",
    notes: ["설교 영상 업로드"],
  },
  {
    id: "hub",
    x: 250,
    y: 30,
    w: 210,
    h: 58,
    title: "PubSubHubbub 허브",
    notes: ["pubsubhubbub.appspot.com"],
  },
  {
    id: "callback",
    x: 560,
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
    x: 600,
    y: 160,
    w: 210,
    // 브랜드 캡션 한 줄만큼 기본 높이(58)보다 크다.
    h: 73,
    // QStash는 Upstash의 제품이라 제목의 이름과 마크의 브랜드가 다르다 — 캡션이 는다.
    brand: "upstash",
    brandCaption: true,
    title: "QStash ingest-video",
    notes: ["yt:videoId 발행"],
    accent: true,
  },
  {
    id: "verify",
    x: 560,
    y: 282,
    w: 250,
    h: 72,
    title: "GET /api/youtube/websub",
    notes: ["hub.topic 일치 → challenge 에코", "불일치 → 404"],
  },
  {
    id: "renew",
    x: 250,
    y: 282,
    w: 210,
    h: 72,
    title: "websub-renew",
    notes: ["QStash cron 2일", "리스 만료 전 재구독"],
  },
  {
    id: "reconcile",
    x: 250,
    y: 392,
    w: 210,
    h: 72,
    title: "reconcile-sermons",
    notes: ["QStash cron 매일", "yt-api /channel/videos"],
  },
  {
    id: "db",
    x: 600,
    y: 384,
    w: 210,
    h: 87,
    brand: "neon",
    brandCaption: true,
    title: "sermons",
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
      <Arrow
        nodes={N}
        from="callback"
        to="publish"
        label="videoId 파싱"
        accent
      />
      <Arrow nodes={N} from="renew" to="hub" label="재구독" dashed />
      <Arrow nodes={N} from="hub" to="verify" label="구독 검증" dashed />
      <Arrow
        nodes={N}
        from="reconcile"
        to="db"
        label="푸시 소실분 보정"
        dashed
      />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
