import type { ProjectStatus } from "@/content/schema";
import { statusLabel } from "@/lib/format";

const STYLES: Record<ProjectStatus, string> = {
  operating: "bg-live/10 text-live",
  "in-progress": "bg-warn/10 text-warn",
  completed: "bg-line text-muted",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${STYLES[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}
