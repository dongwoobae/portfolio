import type { Metadata } from "next";
import { ProjectCard } from "@/components/project/ProjectCard";
import { getProjectsInOrder } from "@/lib/projects";

export const metadata: Metadata = {
  title: "프로젝트",
  description:
    "실제 의뢰를 받아 설계·개발·운영한 서비스들. 착수 순으로 정렬했습니다.",
};

export default function ProjectsPage() {
  const projects = getProjectsInOrder();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold">프로젝트</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        실제 의뢰를 받아 설계·개발·운영한 서비스들입니다. 앞 프로젝트에서
        부족했던 것을 다음 프로젝트에서 고쳐온 순서라, 착수 순으로 정렬했습니다.
      </p>

      <div className="mt-12 space-y-6">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </main>
  );
}
