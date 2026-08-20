"use client";

import { DIAGRAM_META } from "@/content/projects/diagrams";
import {
  Arrow,
  DiagramSvg,
  Lane,
  Node,
  nodeMap,
  type DiagramNode,
} from "./primitives";

const META = DIAGRAM_META["coupon-mall-infra"];

// 레인이 이 그림의 주장이다 — 앱·캐시·DB가 전부 두 영역에 같은 모양으로 놓여
// 있다는 것. 그래서 계층별 화살표(앱→캐시, 앱→DB)는 그리지 않는다. 레인 안에
// 나란히 있다는 배치가 같은 말을 하고, 화살표를 더하면 세로 짝 관계가 묻힌다.
//
// 남긴 세로 화살표 둘이 요점이다: 주 노드가 죽었을 때 무엇이 대신 서는가.
//
// 앞선 배치에서는 DB를 레인 밖 오른쪽에 한 덩이로 두었는데, 위 레인의 앱에서
// DB로 가는 선이 아래 레인을 관통했다. 다중 가용영역 DB는 실제로도 영역마다
// 인스턴스가 있으므로 레인 안으로 넣는 편이 사실에도 가깝다.
const LANE_A = { x: 250, y: 24, w: 566, h: 150, label: "가용영역 A" };
const LANE_B = { x: 250, y: 210, w: 566, h: 150, label: "가용영역 B" };

const NODES: DiagramNode[] = [
  {
    id: "guard",
    x: 24,
    y: 30,
    w: 200,
    h: 110,
    title: "방어 — 어디까지 둘지",
    notes: [
      "네트워크 계층 기본 보호",
      "웹 방화벽 요청량 제한",
      "상위 서비스 제외",
    ],
    accent: true,
  },
  {
    id: "user",
    x: 24,
    y: 180,
    w: 200,
    h: 64,
    title: "사용자",
    notes: ["담당자 · 거래처"],
  },
  {
    id: "alb",
    x: 24,
    y: 280,
    w: 200,
    h: 96,
    title: "로드밸런서",
    notes: ["두 영역에 노드", "헬스체크로 격리"],
    accent: true,
  },
  {
    id: "appA",
    x: 268,
    y: 56,
    w: 178,
    h: 96,
    brand: "nestjs",
    title: "앱 서버 #1",
    notes: ["프론트 · 백엔드 동거", "백엔드 외부 미노출"],
  },
  {
    id: "cacheA",
    x: 462,
    y: 56,
    w: 168,
    h: 96,
    brand: "redis",
    title: "캐시 — 주",
    notes: ["분산 락 주체"],
  },
  {
    id: "dbA",
    x: 646,
    y: 56,
    w: 170,
    h: 96,
    title: "DB — 주",
    notes: ["쓰기 수용"],
  },
  {
    id: "appB",
    x: 268,
    y: 242,
    w: 178,
    h: 96,
    brand: "nestjs",
    title: "앱 서버 #2",
    notes: ["동형 구성", "1대만 남아도 전량"],
  },
  {
    id: "cacheB",
    x: 462,
    y: 242,
    w: 168,
    h: 96,
    brand: "redis",
    title: "캐시 — 복제",
    notes: ["승격 대기"],
  },
  {
    id: "dbB",
    x: 646,
    y: 242,
    w: 170,
    h: 96,
    title: "DB — 대기",
    notes: ["동기 복제"],
  },
];

const N = nodeMap(NODES);

export function CouponMallInfra({
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
      <Lane {...LANE_A} />
      <Lane {...LANE_B} />
      <Arrow nodes={N} from="user" to="alb" label="요청" accent />
      <Arrow nodes={N} from="alb" to="appA" accent />
      <Arrow nodes={N} from="alb" to="appB" label="분산" accent />
      {/* 캐시가 분산 락의 주체라 주 노드 정지는 발송 경합 제어 상실이다.
          복제본만 두는 것과 자동 장애 조치를 켜는 것은 다르다. */}
      <Arrow
        nodes={N}
        from="cacheA"
        to="cacheB"
        label="자동 장애 조치"
        dashed
      />
      <Arrow nodes={N} from="dbA" to="dbB" label="자동 절체" dashed />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
