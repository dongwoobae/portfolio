"use client";

import { useId, useState } from "react";
import { DIAGRAMS } from "@/components/project/diagrams";
import { Lightbox, type LightboxItem } from "@/components/project/Lightbox";
import { DIAGRAM_META, type DiagramId } from "@/content/projects/diagrams";

export function CaseStudyDiagram({ id }: { id: DiagramId }) {
  const meta = DIAGRAM_META[id];
  const Diagram = DIAGRAMS[id];
  const base = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);

  // 라이트박스 사본은 별도 title/desc id를 쓴다 — 같은 id가 문서에 둘 있으면
  // aria-labelledby가 어느 쪽을 가리키는지 불확실해진다.
  const items: LightboxItem[] = [
    {
      kind: "diagram",
      title: meta.title,
      render: () => (
        <Diagram titleId={`${base}-lb-title`} descId={`${base}-lb-desc`} />
      ),
    },
  ];

  return (
    <figure className="mb-6">
      <div className="relative">
        {/* 축소하지 않고 가로 스크롤한다 — 줄이면 11px 라벨이 안 읽힌다.
            globals.css의 .prose-scroll 규약을 따른다. */}
        <div className="prose-scroll max-w-full rounded-lg border border-line bg-page p-3">
          <Diagram titleId={`${base}-title`} descId={`${base}-desc`} />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`크게 보기: ${meta.title}`}
          className="absolute top-2 right-2 cursor-pointer rounded border border-line bg-rail/90 px-1.5 py-0.5 font-mono text-[11px] text-muted hover:border-line-accent hover:text-accent"
        >
          ⤢
        </button>
      </div>
      <figcaption className="mt-2.5 font-mono text-[11px] text-faint">
        ↑ {meta.title}
      </figcaption>
      <Lightbox
        items={items}
        index={open ? 0 : null}
        onIndexChange={() => {}}
        onClose={() => setOpen(false)}
      />
    </figure>
  );
}
