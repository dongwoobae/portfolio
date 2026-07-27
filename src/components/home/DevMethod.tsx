export function DevMethod() {
  return (
    <section className="border-b border-line py-16">
      <h2 className="text-2xl font-bold">AI로 빠르게, 테스트로 확실하게</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        Claude Code 같은 AI 도구를 적극적으로 씁니다. 코드가 빨리 나올수록
        중요한 건 &ldquo;무엇을 왜 만드는가&rdquo;와 &ldquo;원하는 동작이
        유지되는가&rdquo;라고 생각합니다. 그래서 원하는 동작을 단위 테스트와
        E2E로 고정하고, CI 게이트를 통과해야만 배포되게 만듭니다.
      </p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="bg-surface rounded-lg border border-line p-5">
          <dt className="text-sm font-bold">동작 고정</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            Vitest 단위 테스트와 PGlite 인프로세스 DB 통합 테스트로 파이프라인
            로직을 검증합니다.
          </dd>
        </div>
        <div className="bg-surface rounded-lg border border-line p-5">
          <dt className="text-sm font-bold">회귀 방지</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            Playwright E2E로 관리자 업로드·인증 같은 핵심 흐름을 브라우저에서
            반복 검증합니다.
          </dd>
        </div>
        <div className="bg-surface rounded-lg border border-line p-5">
          <dt className="text-sm font-bold">배포 게이트</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">
            GitHub Actions가 lint·타입체크·테스트를 모두 통과해야 배포합니다. 이
            사이트도 같습니다.
          </dd>
        </div>
      </dl>
    </section>
  );
}
