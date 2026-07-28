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
      "다중 인스턴스 전제로 애플리케이션을 무상태 설계. 인스턴스 간 세션이 공유되지 않으므로 인증은 JWT로, 발행·발송 경합 제어는 Redis(ElastiCache) 분산 락으로 처리.",
      "AWS 이중화 인프라를 설계·기안 — EC2 2대를 가용영역 2곳에 분산하고 ALB·NAT·RDS Multi-AZ·ElastiCache 2노드까지 단일 장애점을 제거.",
      "무중단 배포 파이프라인 구성 — CI가 빌드한 산출물을 CodeDeploy가 1대씩 교체하고, 로드밸런서 대상 해제·복귀와 배포 실패 시 롤백을 자동화.",
      "공격 표면 축소 — BFF 구조로 백엔드를 외부에 노출하지 않고, 첨부파일은 presigned URL로 브라우저와 스토리지가 직접 주고받도록 설계.",
    ],
    메디케이시스템: [
      "한약안전사용플랫폼을 1인 담당으로 기획·개발·운영까지 단독 수행.",
      "공공데이터 3만 건 이상을 수집·정제해 일관된 스키마로 통합하고, 한방 스마트 검색·첩약·한약 제제 3종 검색으로 제공.",
      "논문·한의학 고전·연구서적·통계 자료실과 정보 오류 개선 요청 창구를 운영자 관점에서 구성.",
      "외부 기관 데이터 제공 협의와 공문 대응을 개발과 병행해 직접 처리.",
      "Java·JSP·Servlet·Tomcat·MariaDB 스택으로 구축.",
    ],
  },
  // 케이스 스터디 본문에서 이력서 분량에 맞게 추린 것. 프로젝트가 무엇인지는
  // case-studies의 overview가 설명하므로 여기에는 해결한 문제만 담는다.
  projectCases: {
    "ycc-website": [
      "폴링 없는 실시간 등록 — YouTube 채널 피드를 PubSubHubbub 허브에 구독해 업로드 시점에 푸시를 받는다. 주기적 폴링이 필요 없다.",
      "콜백 보안 2겹 — 구독 검증은 우리 채널 토픽일 때만 응답하고, 알림은 HMAC-SHA1을 timing-safe 비교로 검증해 위조를 차단.",
      "QStash 단계 체이닝 — 장기 실행이 불가능한 서버리스에서 자막 수집·AI 요약을 독립 잡으로 분리해 연결.",
      "동시성 제어와 서버리스식 백오프 — Postgres CTE로 설교 1건을 원자적으로 선점해 중복 요약을 막고, sleep 대신 지연 발행으로 지수 백오프를 구현.",
    ],
    "ankang-sumgim": [
      "클라이언트 감지·서버 블러 분리 — 브라우저에서 얼굴 좌표를 감지하고 서버에서 해당 영역만 강블러 후 원위치에 합성. EXIF 회전 좌표를 보정.",
      "2-Phase 업로드 파이프라인 — 단일 스레드인 얼굴 감지는 순차로, 스토리지 업로드는 병렬로 분리해 다중 업로드 성능을 확보.",
      "원본/블러 이중 저장 — 사진별 블러 on/off와 수동 영역 편집까지 지원하는 fallback 설계.",
    ],
    "modu-campus": [
      "경사도 오버레이와 법정 기준 시각화 — 경로 구간별 경사도를 색상으로 표시하고 휠체어 접근 법정 기준 1/12을 범례로 명시.",
      "Overpass API 3-서버 순차 폴백 — 외부 API 장애에 대응하고, 소프트 삭제된 건물이 동기화로 되살아나지 않도록 충돌을 방지.",
      "Papago NMT 자동 다국어화 — 관리자가 한국어로 입력하면 등록 시점에 en/zh로 병렬 번역해 저장.",
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
