import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudyBody } from "@/components/project/CaseStudyBody";
import { CaseStudyShots } from "@/components/project/CaseStudyShots";
import { caseStudies } from "@/content/projects/case-studies";
import { projects } from "@/content/projects/meta";
import { getAdjacentProjects, getProjectBySlug } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies[slug];
  if (!study) return {};

  return { title: study.title, description: study.overview };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  const study = caseStudies[slug];
  if (!project || !study) notFound();

  const { previous, next } = getAdjacentProjects(slug);

  return (
    <main id="main" className="min-h-screen bg-page">
      <div className="mx-auto max-w-[960px] px-5 pb-20 md:px-10">
        <div className="flex items-center justify-between gap-4 border-b border-line py-[22px] font-mono">
          <Link href="/" className="text-[12.5px] text-tertiary">
            ← cd ~/dongwoobae
          </Link>
          <span className="text-xs text-faint">projects/{project.slug}</span>
        </div>

        <header className="pt-12 pb-10 md:pt-15">
          <p className="mb-4 font-mono text-[12.5px] text-accent">
            {study.statusLine}
          </p>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] md:text-[40px]">
            {study.title}
          </h1>
          <p className="mt-[18px] max-w-[620px] text-[15.5px] leading-[1.85] text-pretty text-muted">
            {study.overview}
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-6 border-y border-line py-6 text-[13px] md:grid-cols-4">
          {study.meta.map((cell) => (
            <div key={cell.label}>
              <dt className="mb-1.5 font-mono text-[10.5px] text-faint">
                {cell.label}
              </dt>
              <dd>
                {cell.value}
                {cell.links?.map((link, index) => (
                  <span key={link.href}>
                    {index > 0 && " · "}
                    <a href={link.href} className="text-accent">
                      {link.label}
                    </a>
                  </span>
                ))}
                {cell.note && (
                  <span className="block text-[11.5px] text-faint">
                    {cell.note}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <CaseStudyShots rows={study.shotRows} caption={study.shotsCaption} />

        <CaseStudyBody sections={study.sections} />

        <nav
          aria-label="다른 프로젝트"
          className="mt-14 flex items-center justify-between gap-4 border-t border-line pt-[26px] font-mono text-[12.5px]"
        >
          {previous ? (
            <Link href={`/projects/${previous.slug}`} className="text-tertiary">
              ← 이전: {previous.title}
            </Link>
          ) : (
            <Link href="/" className="text-tertiary">
              ← 목록으로
            </Link>
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="text-right text-accent"
            >
              다음: {next.title} →
            </Link>
          ) : (
            <Link href="/" className="text-right text-accent">
              목록으로 →
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}
