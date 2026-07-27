import { DevMethod } from "@/components/home/DevMethod";
import { GrowthNarrative } from "@/components/home/GrowthNarrative";
import { Hero } from "@/components/home/Hero";
import { StackSummary } from "@/components/home/StackSummary";
import { ProjectCard } from "@/components/project/ProjectCard";
import { getFeaturedProjects } from "@/lib/projects";

export default function HomePage() {
  const featured = getFeaturedProjects();

  return (
    <main className="mx-auto max-w-4xl px-6">
      <Hero />
      <DevMethod />
      <StackSummary />
      <GrowthNarrative />

      <section className="py-16">
        <h2 className="text-2xl font-bold">대표 케이스 스터디</h2>
        <div className="mt-8 space-y-6">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}
