import { z } from "zod";

// 목록 행 오른쪽 끝 배지. 상태 enum에서 유도하지 않는다 —
// 한약안전사용은 "완료"가 아니라 역할("1인 PM")을 배지로 쓴다(디자인).
export const projectBadgeSchema = z.object({
  label: z.string().min(1),
  tone: z.enum(["accent", "muted"]),
});

// 여기 있는 값은 전부 메인 목록 행에 그려진다. 상세 페이지 본문은
// src/content/projects/case-studies.ts가 slug로 물고 있다.
export const projectMetaSchema = z.object({
  // URL slug이자 상세 페이지 상단 `projects/<slug>` 표기
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug는 소문자·숫자·하이픈만 사용한다"),
  // 착수 순서. 목록 정렬과 상세 페이지의 이전/다음 네비가 이 순서를 따른다.
  order: z.number().int().positive(),
  // 목록 행에 쓰는 짧은 이름. 상세 h1은 이보다 길 수 있다.
  title: z.string().min(1),
  summary: z.string().min(1),
  // 목록 행의 모노 스택 표기. 배열이 아니라 표시 문자열 그대로 둔다.
  stackLine: z.string().min(1),
  badge: projectBadgeSchema,
  // 행 hover 시 우하단에 뜨는 미리보기 이미지
  preview: z
    .string()
    .regex(/^\/screenshots\/[a-z0-9-]+\.png$/, "/screenshots/*.png 경로"),
});

export type ProjectMeta = z.infer<typeof projectMetaSchema>;

// 랜딩의 `$ git log --career` 행이자 이력서의 경력·학력 원천.
// 이력서는 경력과 학력을 분리해 싣기 때문에 kind로 갈라 쓴다.
export const careerItemSchema = z.object({
  period: z.string().min(1),
  kind: z.enum(["job", "education"]),
  current: z.boolean(),
  title: z.string().min(1),
  description: z.string().min(1),
});

export type CareerItem = z.infer<typeof careerItemSchema>;

// 이력서에만 있는 값. 경력·스택·대표 프로젝트는 home.ts를 재사용하므로 여기 없다.
export const resumeSchema = z.object({
  summary: z.array(z.string().min(1)).length(3),
  // key는 home.ts career의 title과 일치해야 한다(resume.test.ts가 검증).
  achievements: z.record(z.string(), z.array(z.string().min(1)).min(2)),
  // 대표 프로젝트의 문제 해결 케이스. key는 home.ts highlights의 slug와 일치해야 한다.
  // 프로젝트가 무엇인지는 case-studies의 overview가 설명하고, 여기에는 그 안에서
  // 무엇을 풀었는지만 이력서용으로 짧게 다시 쓴다.
  projectCases: z.record(z.string(), z.array(z.string().min(1)).min(2)),
  education: z
    .array(
      z.object({
        period: z.string().min(1),
        school: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(1),
  certificates: z
    .array(z.object({ name: z.string().min(1), date: z.string().min(1) }))
    .min(1),
  languages: z
    .array(z.object({ name: z.string().min(1), score: z.string().min(1) }))
    .min(1),
});

export type Resume = z.infer<typeof resumeSchema>;
