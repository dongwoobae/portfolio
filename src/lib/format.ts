import type { ProjectStatus } from "@/content/schema";

export type PeriodInput = {
  start: string;
  end?: string;
  note?: string;
};

export function formatPeriod({ start, end, note }: PeriodInput): string {
  const base = `${start} ~ ${end ?? "진행 중"}`;
  return note ? `${base} (${note})` : base;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  operating: "운영 중",
  "in-progress": "진행 중",
  completed: "완료",
};

export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status];
}
