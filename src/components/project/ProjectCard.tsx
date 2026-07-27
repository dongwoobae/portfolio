import Link from "next/link";
import { StatusBadge } from "@/components/project/StatusBadge";
import type { ProjectMeta } from "@/content/schema";
import { formatPeriod } from "@/lib/format";

export function ProjectCard({ project }: { project: ProjectMeta }) {
  const period = formatPeriod({
    start: project.periodStart,
    end: project.periodEnd,
    note: project.periodNote,
  });

  return (
    <article className="bg-surface rounded-lg border border-line p-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={project.status} />
        <span className="font-mono text-xs text-faint">{period}</span>
      </div>

      <h2 className="mt-3 text-lg font-bold">
        {project.hasCaseStudy ? (
          <Link
            href={`/projects/${project.slug}`}
            className="hover:text-accent"
          >
            {project.title}
          </Link>
        ) : (
          project.title
        )}
      </h2>

      <p className="mt-2 leading-relaxed text-muted">{project.summary}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="bg-accent-soft rounded px-2 py-0.5 font-mono text-xs text-accent"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        {project.hasCaseStudy && (
          <Link
            href={`/projects/${project.slug}`}
            className="hover:text-accent-hover font-bold text-accent"
          >
            케이스 스터디 →
          </Link>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            className="text-muted hover:text-ink"
            rel="noreferrer"
            target="_blank"
          >
            라이브 ↗
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            className="text-muted hover:text-ink"
            rel="noreferrer"
            target="_blank"
          >
            저장소 ↗
          </a>
        )}
      </div>
    </article>
  );
}
