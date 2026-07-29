"use client";

import { useId } from "react";
import { DIAGRAMS } from "@/components/project/diagrams";
import { DIAGRAM_META, type DiagramId } from "@/content/projects/diagrams";

export function CaseStudyDiagram({ id }: { id: DiagramId }) {
  const meta = DIAGRAM_META[id];
  const Diagram = DIAGRAMS[id];
  const base = useId().replace(/:/g, "");

  return (
    <figure className="mb-6">
      {/* 축소하지 않고 가로 스크롤한다 — 줄이면 11px 라벨이 안 읽힌다.
          globals.css의 .prose-scroll 규약을 따른다. */}
      <div className="prose-scroll max-w-full rounded-lg border border-line bg-page p-3">
        <Diagram titleId={`${base}-title`} descId={`${base}-desc`} />
      </div>
      <figcaption className="mt-2.5 font-mono text-[11px] text-faint">
        ↑ {meta.title}
      </figcaption>
    </figure>
  );
}
