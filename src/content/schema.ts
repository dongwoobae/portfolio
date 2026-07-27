import { z } from "zod";

export const projectStatusSchema = z.enum([
  "operating",
  "in-progress",
  "completed",
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectMetaSchema = z.object({
  // URL slug — 같은 이름의 MDX 파일이 src/content/projects/에 있어야 한다.
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug는 소문자·숫자·하이픈만 사용한다"),
  // 착수 순서. 성장 서사가 이 순서에 의존하므로 중복되면 빌드를 깬다.
  order: z.number().int().positive(),
  title: z.string().min(1),
  // 목록 카드 한 줄 요약
  summary: z.string().min(1),
  periodStart: z.string().regex(/^\d{4}\.\d{2}$/, "YYYY.MM 형식"),
  periodEnd: z
    .string()
    .regex(/^\d{4}\.\d{2}$/, "YYYY.MM 형식")
    .optional(),
  periodNote: z.string().optional(),
  status: projectStatusSchema,
  role: z.string().min(1),
  stack: z.array(z.string()).min(1),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  commits: z.number().int().nonnegative().optional(),
  // 홈에 노출할 대표 케이스 스터디 여부
  featured: z.boolean(),
  // 케이스 스터디 본문이 준비된 프로젝트만 상세 페이지를 생성한다.
  hasCaseStudy: z.boolean(),
});

export type ProjectMeta = z.infer<typeof projectMetaSchema>;
