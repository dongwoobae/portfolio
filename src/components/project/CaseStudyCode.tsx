import type { CodeBlock } from "@/content/projects/case-studies";

/**
 * 발췌 코드 블록. 프레임은 CaseStudyDiagram과 같은 값을 쓴다 — 본문에서
 * 그림과 코드가 같은 종류의 첨부물로 읽혀야 한다.
 *
 * 신택스 하이라이팅을 넣지 않는다. 라이브러리 하나가 번들에 더해질 만큼
 * 얻는 게 없고, 발췌는 판단이 보이는 몇 줄이라 색 없이도 읽힌다.
 */
export function CaseStudyCode({ block }: { block: CodeBlock }) {
  return (
    <figure className="mb-6">
      <div className="overflow-hidden rounded-lg border border-line bg-page">
        <div className="flex items-center justify-between gap-4 border-b border-line px-3 py-2 font-mono text-[11px] text-faint">
          <span className="truncate">{block.caption}</span>
          <span className="shrink-0 text-ghost">{block.lang}</span>
        </div>
        {/* 코드는 줄바꿈이 의미를 해치므로 넘치면 접지 않고 가로로 흘린다. */}
        <div className="overflow-x-auto p-3">
          <pre className="font-mono text-[12.5px] leading-[1.75] text-muted">
            <code>{block.code}</code>
          </pre>
        </div>
      </div>
    </figure>
  );
}
