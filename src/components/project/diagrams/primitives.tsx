"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { anchor, loopPath, midpoint, type Box } from "./geometry";
import { LOGOS, type LogoId } from "./logos";

/** 다이어그램이 선언하는 노드. 위치는 사람이 정하고 화살표 기하는 파생된다. */
export type DiagramNode = Box & {
  id: string;
  title: string;
  /**
   * 이 노드가 곧 그 제품일 때만 붙인다. "이 노드가 저 제품을 호출한다" 정도로
   * 마크를 달기 시작하면 어느 상자가 남의 서비스인지 구분이 사라진다.
   */
  brand?: LogoId;
  /**
   * 마크가 가리키는 브랜드 이름을 제목 아래 캡션으로 적는다. 제목에 이미 그
   * 이름이 있으면 켜지 마라 — QStash(Upstash)처럼 마크의 브랜드와 제목의
   * 이름이 다를 때만 정보가 는다.
   */
  brandCaption?: boolean;
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

/** 노드 안쪽 좌우 여백 */
const PAD = 14;
const TITLE_DY = 22;
const NOTE_TOP = 38;
// 보조 문구 11.5px에 맞춘 행간. 13이면 한글 받침이 아랫줄에 닿는다.
const NOTE_LINE = 14;

/** 브랜드 마크 한 변. 원본 좌표계는 24×24라 이 값으로 축척한다. */
const MARK = 16;
/** 마크와 제목 사이 간격 */
const MARK_GAP = 8;
/** 브랜드 캡션이 밀어내는 높이. 이 캡션을 켠 노드는 h를 그만큼 키워야 한다. */
const CAPTION_LINE = 15;

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
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        preserveAspectRatio="xMidYMid meet"
        // width/height 속성을 주지 않고 컨테이너 폭에 맞춘다 — 어떤 화면에서도
        // 가로 스크롤이 생기지 않는 대신 좁은 화면에서는 글자가 함께 줄어든다.
        // 그래서 라이트박스에 원본 크기 토글이 있다: 모바일에서 읽는 경로는 그쪽이다.
        // viewBox 좌표계는 배율과 무관하므로 라벨 위치는 어디서나 같다.
        className="block h-auto w-full"
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
        x={x + PAD}
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
  const { x, y, w, h, title, notes = [], accent, brand, brandCaption } = node;
  const mark = brand ? LOGOS[brand] : undefined;
  const caption = mark && brandCaption ? mark.title : undefined;
  const noteTop = y + NOTE_TOP + (caption ? CAPTION_LINE : 0);
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
      {mark && (
        // 마크는 장식이 아니라 정보지만, svg 전체가 role="img"라 내부 요소는
        // 보조기술에 노출되지 않는다. 마크만 이름을 지는 노드(YouTube처럼 제목에
        // 브랜드명이 없는 경우)는 <desc>가 그 이름을 반드시 말해야 한다.
        <g
          transform={`translate(${x + PAD} ${y + TITLE_DY - 13}) scale(${MARK / 24})`}
        >
          <path d={mark.path} fill={mark.hex} />
        </g>
      )}
      <text
        x={x + PAD + (mark ? MARK + MARK_GAP : 0)}
        y={y + TITLE_DY}
        fontSize={13}
        fill={accent ? "var(--color-accent)" : "var(--color-ink)"}
      >
        {title}
      </text>
      {caption && (
        // 브랜드 색이 아니라 tertiary로 적는다 — 마크가 색을 지고, 글자는
        // 배경 대비 4.5:1을 보장받는 쪽이 낫다.
        <text
          x={x + PAD}
          y={y + NOTE_TOP}
          className="font-mono"
          fontSize={SMALL}
          fill="var(--color-tertiary)"
        >
          {caption}
        </text>
      )}
      {notes.map((note, i) => (
        <text
          key={i}
          x={x + PAD}
          y={noteTop + i * NOTE_LINE}
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
