import type { MetadataRoute } from "next";
import { getCaseStudyProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.url,
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    ...getCaseStudyProjects().map((project) => ({
      url: `${site.url}/projects/${project.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
