import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-muted">
        <p className="font-bold text-ink">{site.name}</p>
        <p className="mt-2">{site.role}</p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href={`mailto:${site.email}`} className="hover:text-ink">
              {site.email}
            </a>
          </li>
          <li>
            <a href={site.github} className="hover:text-ink">
              GitHub
            </a>
          </li>
        </ul>
        <p className="mt-8 text-xs text-faint">
          이 사이트는 Next.js를 OpenNext로 번들해 Cloudflare Workers에
          배포합니다.{" "}
          <a
            href={`${site.repoUrl}/blob/main/.github/workflows/ci.yml`}
            className="underline underline-offset-2 hover:text-muted"
          >
            배포 파이프라인 보기
          </a>
        </p>
      </div>
    </footer>
  );
}
