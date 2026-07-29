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
    x: 584,
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
    x: 634,
    y: 160,
    w: 200,
    h: 58,
    title: "QStash ingest-video",
    notes: ["yt:videoId 발행"],
    accent: true,
  },
  {
    id: "verify",
    x: 584,
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
    x: 634,
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
