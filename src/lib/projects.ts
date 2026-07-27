import { projects } from "@/content/projects/meta";
import type { ProjectMeta } from "@/content/schema";

export function getProjectsInOrder(): ProjectMeta[] {
  return [...projects].sort((a, b) => a.order - b.order);
}

export function getFeaturedProjects(): ProjectMeta[] {
  return getProjectsInOrder().filter((project) => project.featured);
}

export function getCaseStudyProjects(): ProjectMeta[] {
  return getProjectsInOrder().filter((project) => project.hasCaseStudy);
}

export function getProjectBySlug(slug: string): ProjectMeta | undefined {
  return projects.find((project) => project.slug === slug);
}
