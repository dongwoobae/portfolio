import { resumeSchema, type Resume } from "@/content/schema";

// 이력서에만 있는 값. 경력 기간·회사명은 home.ts의 career를,
// 대표 프로젝트는 home.ts의 highlights를, 스택은 stackLines를 재사용한다.
// achievements의 키는 career 항목의 title과 정확히 일치해야 한다.
const raw = {
  summary: [
    "기획부터 배포·운영까지 혼자 책임지는 백엔드 중심 풀스택 개발자입니다.",
    "실사용자가 있는 서비스 2건을 직접 수주해 설계·개발하고 현재 운영 중입니다.",
    "WebSub 이벤트 파이프라인, 얼굴 자동 블러, 서버리스 잡 체이닝처럼 운영 부담을 줄이는 문제를 코드로 풉니다.",
  ],
  achievements: {
    모바일이앤엠애드: [
      "이팝콘 다이렉트(오픈몰) 백엔드 개발.",
      "AWS 서버 구성을 설계하고 배포 파이프라인을 구축.",
    ],
    메디케이시스템: [
      "한약안전사용플랫폼을 1인 담당으로 기획·개발·운영까지 단독 수행.",
      "공공데이터 3만 건 이상을 수집·정제해 통합 검색 기반으로 구성.",
      "외부 기관 데이터 제공 협의와 공문 대응을 개발과 병행해 직접 처리.",
      "Spring Boot·NestJS·Next.js를 실무에 적용.",
    ],
  },
  education: [
    {
      period: "2024.03–2024.09",
      school: "네이버클라우드 데브옵스 과정",
      detail: "클라우드 기반 웹 개발자 과정 수료",
    },
    {
      period: "2015.03–2022.08",
      school: "고려대학교 안암캠퍼스",
      detail: "지구환경과학과 학사",
    },
  ],
  certificates: [
    { name: "NAVER CLOUD PLATFORM Certified Professional", date: "2024.08" },
    { name: "NAVER CLOUD PLATFORM Certified Associate", date: "2024.08" },
    { name: "컴퓨터활용능력 1급 필기", date: "2022.04" },
  ],
  languages: [{ name: "TOEIC", score: "825 (2022.04)" }],
};

// 빌드타임 검증 — 형식이 틀리면 여기서 빌드가 깨진다.
export const resume: Resume = resumeSchema.parse(raw);
