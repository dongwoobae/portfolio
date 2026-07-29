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

const META = DIAGRAM_META["sumgim-blur"];

// 브라우저 단계 4개를 한 줄에 늘어놓으면 912px이라 컨테이너(854px)를 넘긴다.
// 2×2로 접고 세로로 늘렸다 — 축소 렌더로 글자를 깎는 것보다 낫다.
// upload를 왼쪽 아래에 두는 것이 핵심이다: 오른쪽에 두면 guard로 내려가는
// 직선이 detect와 sharp 상자를 스치고 지나간다.
const NODES: DiagramNode[] = [
  {
    id: "pick",
    x: 40,
    y: 66,
    w: 170,
    h: 58,
    title: "파일 선택",
    notes: ["다중 업로드"],
  },
  {
    id: "compress",
    x: 290,
    y: 56,
    w: 250,
    h: 76,
    title: "compressImageFile",
    notes: ["캔버스 축소 (4.5MB 한도)", "감지보다 먼저 — 좌표 기준 일치"],
    accent: true,
  },
  {
    id: "detect",
    x: 290,
    y: 176,
    w: 250,
    h: 76,
    title: "face-api.js",
    notes: ["tinyFaceDetector 0.45", "naturalWidth 스케일 보정"],
    accent: true,
  },
  {
    id: "upload",
    x: 40,
    y: 176,
    w: 200,
    h: 76,
    title: "fetch POST",
    notes: ["/api/upload-photo", "Server Action 직렬화 회피"],
  },
  {
    id: "guard",
    x: 40,
    y: 326,
    w: 226,
    h: 88,
    title: "요청 검증",
    notes: [
      "Supabase 세션",
      "folder · MIME · 30MB",
      "매직바이트 detectImageType",
    ],
  },
  {
    id: "sharp",
    x: 306,
    y: 326,
    w: 208,
    h: 88,
    // 제목이 이미 이름을 들고 있으니 캡션은 켜지 않는다.
    brand: "sharp",
    title: "sharp 전처리",
    notes: [".rotate() EXIF 보정", ".resize(1920).webp(75)"],
  },
  {
    id: "blur",
    x: 580,
    y: 326,
    w: 236,
    h: 88,
    title: "영역 블러 합성",
    notes: ["scaleFaceRegions 좌표 변환", "extract().blur(28)", "composite()"],
    accent: true,
  },
  {
    id: "r2",
    x: 306,
    y: 494,
    w: 246,
    h: 91,
    brand: "cloudflare",
    brandCaption: true,
    title: "R2 병렬 업로드",
    notes: ["blurred/{ts}.webp", "original/{ts}.webp"],
    accent: true,
  },
  {
    id: "meta",
    x: 600,
    y: 494,
    w: 216,
    h: 91,
    brand: "supabase",
    brandCaption: true,
    title: "savePhotoMetadata",
    notes: ["Server Action", "경량 INSERT — 순차"],
  },
];

const N = nodeMap(NODES);

export function SumgimBlur({
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
      {/* 레인은 노드보다 먼저 그려야 배경으로 깔린다. */}
      <Lane
        x={20}
        y={18}
        w={800}
        h={252}
        label="브라우저 — Phase 1 순차 (TF.js 단일 스레드) → Phase 2 병렬 (Promise.all)"
      />
      <Lane x={20} y={296} w={800} h={138} label="서버 — API Route" />
      <Lane x={286} y={464} w={534} h={141} label="저장소" />

      <Arrow nodes={N} from="pick" to="compress" accent />
      <Arrow nodes={N} from="compress" to="detect" label="압축본" accent />
      <Arrow nodes={N} from="detect" to="upload" label="좌표[]" accent />
      <Arrow nodes={N} from="upload" to="guard" label="Promise.all" accent />
      <Arrow nodes={N} from="guard" to="sharp" accent />
      <Arrow nodes={N} from="sharp" to="blur" label="얼굴 있음" accent />
      <Arrow
        nodes={N}
        from="sharp"
        to="r2"
        label="얼굴 0개 — 단순 압축"
        dashed
      />
      <Arrow nodes={N} from="blur" to="r2" accent />
      <Arrow nodes={N} from="r2" to="meta" label="url" accent />
      {NODES.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </DiagramSvg>
  );
}
