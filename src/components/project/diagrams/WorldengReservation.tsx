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
      <Arrow
        nodes={N}
        from="action"
        to="rule"
        label="⑤ 같은 함수 재사용"
        dashed
      />
      <Arrow nodes={N} from="action" to="table" label="insert" accent />
      <Arrow nodes={N} from="manual" to="table" label="수동 등록" />
      <Arrow nodes={N} from="override" to="rule" dashed />
      <Arrow
        nodes={N}
        from="table"
        to="index"
        label="확정 시 슬롯 점유"
        accent
      />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
