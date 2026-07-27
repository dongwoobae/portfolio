import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectMetaBar } from "@/components/project/ProjectMetaBar";
import { getCaseStudyProjects, getProjectBySlug } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCaseStudyProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !project.hasCaseStudy) notFound();

  const { default: Body } = await import(`@/content/projects/${slug}.mdx`);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-4 leading-relaxed text-muted">{project.summary}</p>

      <div className="mt-8">
        <ProjectMetaBar project={project} />
      </div>

      <article className="mt-12">
        <Body />
      </article>
    </main>
  );
}
