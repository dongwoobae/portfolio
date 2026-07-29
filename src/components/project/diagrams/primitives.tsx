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
// 보조 문구 11.5px에 맞춘 행간. 13이면 한글 받침이 아랫줄에 닿는다.
const NOTE_LINE = 14;

/** 노드 보조 문구·경로 라벨 공통 크기. 페이지 본문(13px)보다 한 단계 작다. */
const SMALL = 11.5;

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
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-tertiary)" />
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
        // 레인은 배경 묶음이라 노드(faint)보다 옅어야 위계가 선다. 의미는
        // 아래 라벨이 지므로 테두리 자체는 3:1을 요구하지 않는다.
        stroke="var(--color-ghost)"
        strokeDasharray="3 4"
      />
      <text
        x={x + 14}
        y={y + 20}
        className="font-mono"
        fontSize={SMALL}
        fill="var(--color-tertiary)"
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
        stroke={accent ? "var(--color-accent)" : "var(--color-faint)"}
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
          fontSize={SMALL}
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
      fontSize={SMALL}
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
        stroke={accent ? "var(--color-accent)" : "var(--color-tertiary)"}
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
        stroke="var(--color-tertiary)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
        markerEnd={`url(#${prefix}-head)`}
      />
      <text
        x={node.x + node.w + out + 8}
        y={node.y + node.h / 2 + 4}
        className="font-mono"
        fontSize={SMALL}
        fill="var(--color-muted)"
      >
        {label}
      </text>
    </g>
  );
}
