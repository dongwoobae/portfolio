"use client";

import { DIAGRAM_META } from "@/content/projects/diagrams";
import {
  Arrow,
  DiagramSvg,
  Node,
  nodeMap,
  type DiagramNode,
} from "./primitives";

const META = DIAGRAM_META["coupon-mall-queue"];

// 세 열은 단계다 — 요청(24) · 큐와 워커(310) · 바깥으로 나가는 경로(596).
// 재시도 되돌이는 워커에 건다. 큐에 걸면 "무엇이 되돌리는지"가 사라진다.
//
// 실패 분류(fail)를 워커 아래가 아니라 오른쪽 열 아래에 둔 이유: 워커 바로
// 아래에 두면 log로 가는 선이 워커 상자를 세로로 관통한다.
const NODES: DiagramNode[] = [
  {
    id: "request",
    x: 24,
    y: 44,
    w: 210,
    h: 76,
    title: "대량 발송 요청",
    notes: ["수신자 목록 · 템플릿", "작업 1건 = 수신자 1명"],
  },
  {
    id: "queue",
    x: 310,
    y: 34,
    w: 230,
    h: 96,
    // 큐 자체가 Redis다. 제목에 이름이 있으니 캡션은 켜지 않는다.
    brand: "redis",
    title: "Redis 큐",
    notes: ["대기 · 지연 · 실패 분리", "중복 적재 차단 키"],
    accent: true,
  },
  {
    id: "worker",
    x: 310,
    y: 214,
    w: 230,
    h: 104,
    title: "워커 — 소비 속도 제어",
    notes: ["발송사 분당 제한 아래로", "동시 실행 수 상한", "지수 백오프"],
    accent: true,
  },
  {
    id: "adapter",
    x: 616,
    y: 214,
    w: 200,
    h: 104,
    title: "채널 어댑터",
    notes: [
      "문자 · 알림톡 · 이메일",
      "규격 차이 흡수",
      "포트 뒤로 발송사 격리",
    ],
  },
  {
    id: "vendor",
    x: 616,
    y: 44,
    w: 200,
    h: 76,
    title: "외부 발송사 API",
    notes: ["분당 요청 제한", "채널마다 다른 응답"],
  },
  {
    id: "fail",
    x: 616,
    y: 396,
    w: 200,
    h: 86,
    title: "실패 분류",
    notes: ["재시도 가능 / 영구", "수신자 단위로 종결"],
    accent: true,
  },
  {
    id: "log",
    x: 310,
    y: 396,
    w: 230,
    h: 86,
    title: "발송 로그",
    notes: ["요청 단위 진행률", "수신자별 최종 상태"],
  },
];

const N = nodeMap(NODES);

export function CouponMallQueue({
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
      <Arrow nodes={N} from="request" to="queue" label="적재" accent />
      <Arrow nodes={N} from="queue" to="worker" label="제한 아래로 소비" />
      <Arrow nodes={N} from="worker" to="adapter" label="발송" accent />
      <Arrow nodes={N} from="adapter" to="vendor" label="채널별 호출" />
      <Arrow nodes={N} from="adapter" to="fail" label="응답 판정" />
      {/* 이 갈래가 요점이다 — 재시도 가능한 것만 큐로 돌아가고,
          영구 실패는 그 수신자만 종결해 배치 전체를 되돌리지 않는다. */}
      <Arrow nodes={N} from="fail" to="log" label="영구 실패" />
      <Arrow nodes={N} from="fail" to="worker" label="재시도 가능" dashed />
      <Arrow nodes={N} from="worker" to="log" label="진행률 갱신" dashed />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
