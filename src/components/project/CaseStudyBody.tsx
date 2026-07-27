import type { CaseStudySection } from "@/content/projects/case-studies";

export function CaseStudyBody({
  sections,
}: {
  sections: readonly CaseStudySection[];
}) {
  return (
    <div className="flex flex-col gap-9">
      {sections.map((section) => (
        <section key={section.heading}>
          {/* 헤딩이 `## 문제` 같은 마크다운 표기 그대로 보이는 게 디자인 의도다. */}
          <h2 className="mb-4 font-mono text-[12.5px] font-normal text-faint">
            {section.heading}
          </h2>

          {"prose" in section ? (
            <p className="max-w-[680px] text-sm leading-[1.9] text-pretty text-muted">
              {section.prose.map((segment, index) =>
                typeof segment === "string" ? (
                  segment
                ) : (
                  <span key={index} className="text-ink">
                    {segment.em}
                  </span>
                ),
              )}
            </p>
          ) : (
            <div
              className={`grid gap-3.5 ${section.columns === 2 ? "md:grid-cols-2" : ""}`}
            >
              {section.cards.map((card) => (
                <div
                  key={card.title}
                  className={`rounded-md border p-[22px_26px] ${
                    card.accent
                      ? "border-line-accent bg-linear-to-b from-card-hi to-card"
                      : "border-line bg-card"
                  }`}
                >
                  <strong className="text-[15px]">{card.title}</strong>
                  <p className="mt-2 text-[13px] leading-[1.8] text-muted">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
