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

// 세 열은 행위자다 — 방문자 화면(24) · 서버 로직(310) · D1(596).
// 전화 접수는 관리자 일이지만 웹 예약과 같은 테이블에 쓰는 서버 경로라 가운데
// 열에 둔다. 왼쪽 아래에 두면 table로 가는 직선이 submitReservation 상자의
// 오른쪽 아래 모서리를 1px쯤 스친다 — 관통은 아니지만 굳이 스칠 이유가 없다.
//
// 이 다이어그램의 실제 결함은 휴무 지정 쪽이었다. 아래쪽(y 366)에 두면 rule로
// 올라가는 대각선이 submitReservation을 34px 관통해, 노드가 선을 덮는 바람에
// 화살표가 중간에 사라져 보였다. 위로 올려 짧은 대각선으로 만들어 해결했다.
const NODES: DiagramNode[] = [
  {
    id: "picker",
    x: 24,
    y: 30,
    w: 200,
    h: 76,
    title: "데이트피커",
    notes: ["GET /api/availability", "예약 불가일 비활성화"],
  },
  {
    id: "rule",
    x: 310,
    y: 24,
    w: 225,
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
    y: 246,
    w: 200,
    h: 58,
    title: "예약 폼",
    notes: ["타입 · 날짜 · 시간 · 연락처"],
  },
  {
    id: "action",
    x: 310,
    y: 190,
    w: 225,
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
    x: 596,
    y: 205,
    w: 235,
    h: 105,
    // D1이 Cloudflare 제품이라는 사실 자체가 이 다이어그램의 전제다 —
    // 마지막 방어선을 DB에 맡길 수 있는지가 여기서 갈린다.
    brand: "cloudflare",
    brandCaption: true,
    title: "D1 reservations",
    notes: ["source = 'web'", "status = 'pending'", "hour = null → 시간 협의"],
  },
  {
    id: "override",
    x: 24,
    y: 150,
    w: 200,
    h: 58,
    title: "관리자 — 휴무 지정",
    notes: ["day_overrides"],
  },
  {
    id: "manual",
    x: 310,
    y: 390,
    w: 225,
    h: 58,
    title: "관리자 — 전화 접수",
    notes: ["source = 'manual'"],
  },
  {
    id: "index",
    x: 596,
    y: 390,
    w: 235,
    h: 104,
    // 같은 마크를 두 번 쓴다 — 오른쪽 열이 통째로 D1이라는 뜻이다.
    // 이름은 위 노드가 이미 달았으므로 캡션은 켜지 않는다.
    brand: "cloudflare",
    title: "partial unique index",
    notes: [
      "(date, hour) WHERE",
      "status = 'confirmed'",
      "AND hour IS NOT NULL",
      "check-then-insert 비원자적",
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
