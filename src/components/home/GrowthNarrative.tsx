const MILESTONES = [
  { project: "모두의 캠퍼스", start: "2026.04", daysToCi: 87 },
  { project: "안강 섬김", start: "2026.05", daysToCi: 73 },
  { project: "영천중앙교회", start: "2026.06", daysToCi: 16 },
  { project: "특장차 제작업체", start: "2026.07", daysToCi: 0 },
];

export function GrowthNarrative() {
  return (
    <section className="border-b border-line py-16">
      <h2 className="text-2xl font-bold">진행하면서 배운 것</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        처음부터 잘한 건 아닙니다. 첫 프로젝트는 CI를 붙이는 데 석 달이 걸렸고,
        그동안 무엇이 깨지는지 모른 채 고쳤습니다. 프로젝트를 거듭할수록 검증
        체계를 먼저 세우게 됐고, 네 번째 프로젝트는{" "}
        <strong className="font-bold text-ink">시작하는 날 CI부터</strong>{" "}
        만들었습니다.
      </p>

      <div className="prose-scroll mt-8">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            프로젝트별 CI 도입까지 걸린 기간
          </caption>
          <thead>
            <tr>
              <th className="border-b border-line px-3 py-2 text-left font-bold">
                프로젝트
              </th>
              <th className="border-b border-line px-3 py-2 text-left font-bold">
                착수
              </th>
              <th className="border-b border-line px-3 py-2 text-right font-bold">
                CI 구축까지
              </th>
            </tr>
          </thead>
          <tbody>
            {MILESTONES.map((milestone) => (
              <tr key={milestone.project}>
                <td className="border-b border-line px-3 py-2">
                  {milestone.project}
                </td>
                <td className="border-b border-line px-3 py-2 font-mono text-muted">
                  {milestone.start}
                </td>
                <td className="border-b border-line px-3 py-2 text-right font-mono">
                  {milestone.daysToCi === 0 ? (
                    <strong className="font-bold text-accent">당일</strong>
                  ) : (
                    `${milestone.daysToCi}일`
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
