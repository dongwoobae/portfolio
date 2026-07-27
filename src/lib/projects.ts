import { projects } from "@/content/projects/meta";
import type { ProjectMeta } from "@/content/schema";

export function getProjectsInOrder(): ProjectMeta[] {
  return [...projects].sort((a, b) => a.order - b.order);
}

export function getProjectBySlug(slug: string): ProjectMeta | undefined {
  return projects.find((project) => project.slug === slug);
}

/**
 * 상세 페이지 하단의 이전/다음. 목록 순서를 그대로 따르고,
 * 양 끝은 다음 프로젝트 대신 목록(홈)으로 빠진다.
 */
export function getAdjacentProjects(slug: string): {
  previous?: ProjectMeta;
  next?: ProjectMeta;
} {
  const ordered = getProjectsInOrder();
  const index = ordered.findIndex((project) => project.slug === slug);
  if (index < 0) return {};
  return { previous: ordered[index - 1], next: ordered[index + 1] };
}
