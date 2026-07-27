import { StatusBadge } from "@/components/project/StatusBadge";
import type { ProjectMeta } from "@/content/schema";
import { formatPeriod } from "@/lib/format";

export function ProjectMetaBar({ project }: { project: ProjectMeta }) {
  const period = formatPeriod({
    start: project.periodStart,
    end: project.periodEnd,
    note: project.periodNote,
  });

  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <StatusBadge status={project.status} />

      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-bold text-faint">기간</dt>
          <dd className="mt-1 font-mono text-sm">{period}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-faint">역할</dt>
          <dd className="mt-1 text-sm">{project.role}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-faint">커밋</dt>
          <dd className="mt-1 font-mono text-sm">
            {project.commits !== undefined ? `${project.commits}건` : "—"}
          </dd>
        </div>
      </dl>

      <ul className="mt-5 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            className="rounded bg-accent px-4 py-2 text-sm font-bold text-page hover:bg-accent-hover"
            rel="noreferrer"
            target="_blank"
          >
            라이브 사이트 보기 ↗
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            className="rounded border border-line px-4 py-2 text-sm font-bold hover:border-ink"
            rel="noreferrer"
            target="_blank"
          >
            저장소 ↗
          </a>
        )}
      </div>
    </div>
  );
}
