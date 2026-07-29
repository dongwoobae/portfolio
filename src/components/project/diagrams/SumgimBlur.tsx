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

const NODES: DiagramNode[] = [
  {
    id: "pick",
    x: 40,
    y: 58,
    w: 170,
    h: 58,
    title: "파일 선택",
    notes: ["다중 업로드"],
  },
  {
    id: "compress",
    x: 246,
    y: 48,
    w: 220,
    h: 76,
    title: "compressImageFile",
    notes: ["캔버스 축소 (4.5MB 한도)", "감지보다 먼저 — 좌표 기준 일치"],
    accent: true,
  },
  {
    id: "detect",
    x: 502,
    y: 48,
    w: 220,
    h: 76,
    title: "face-api.js",
    notes: ["tinyFaceDetector 0.45", "naturalWidth 스케일 보정"],
    accent: true,
  },
  {
    id: "upload",
    x: 758,
    y: 48,
    w: 194,
    h: 76,
    title: "fetch POST",
    notes: ["/api/upload-photo", "Server Action 직렬화 회피"],
  },
  {
    id: "guard",
    x: 40,
    y: 248,
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
    y: 248,
    w: 226,
    h: 88,
    title: "sharp 전처리",
    notes: [".rotate() EXIF 보정", ".resize(1920).webp(75)"],
  },
  {
    id: "blur",
    x: 612,
    y: 248,
    w: 246,
    h: 88,
    title: "영역 블러 합성",
    notes: ["scaleFaceRegions 좌표 변환", "extract().blur(28)", "composite()"],
    accent: true,
  },
  {
    id: "r2",
    x: 306,
    y: 432,
    w: 246,
    h: 76,
    title: "R2 병렬 업로드",
    notes: ["blurred/{ts}.webp", "original/{ts}.webp"],
    accent: true,
  },
  {
    id: "meta",
    x: 600,
    y: 432,
    w: 226,
    h: 76,
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
        w={950}
        h={124}
        label="브라우저 — Phase 1 순차 (TF.js 단일 스레드) → Phase 2 병렬 (Promise.all)"
      />
      <Lane x={20} y={216} w={858} h={140} label="서버 — API Route" />
      <Lane x={286} y={400} w={560} h={128} label="저장소" />

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
