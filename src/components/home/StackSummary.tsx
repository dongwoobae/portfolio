const STACK_GROUPS = [
  {
    label: "백엔드",
    items: "Java · Spring Boot · NestJS · Node.js · Next.js Server Actions",
    note: "인증·권한, 파이프라인, 동시성 제어를 주로 맡습니다.",
  },
  {
    label: "데이터",
    items: "PostgreSQL · MySQL · Neon · Supabase · Cloudflare D1 · Drizzle ORM",
    note: "BaaS 의존에서 스키마·마이그레이션 직접 관리로 옮겨왔습니다.",
  },
  {
    label: "프론트엔드",
    items: "TypeScript · React · Next.js App Router · Tailwind CSS",
    note: "운영 중인 서비스의 UI를 전부 직접 구현했습니다.",
  },
  {
    label: "인프라 · 운영",
    items: "Cloudflare Workers · R2 · Vercel · Docker · GitHub Actions",
    note: "배포 파이프라인과 크론·큐 운영까지 직접 맡습니다.",
  },
];

export function StackSummary() {
  return (
    <section className="border-b border-line py-16">
      <h2 className="text-2xl font-bold">기술 스택</h2>
      <dl className="mt-8 space-y-6">
        {STACK_GROUPS.map((group) => (
          <div
            key={group.label}
            className="flex flex-col gap-1 sm:flex-row sm:gap-6"
          >
            <dt className="text-sm font-bold sm:w-28 sm:shrink-0">
              {group.label}
            </dt>
            <dd>
              <p className="font-mono text-sm text-ink">{group.items}</p>
              <p className="mt-1 text-sm text-muted">{group.note}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
