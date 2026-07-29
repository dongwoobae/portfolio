// 프로젝트 상세 페이지 본문. 디자인 핸드오프(design/Project *.dc.html)의 문안을
// 그대로 옮겼다. 문구를 고칠 때는 핸드오프가 아니라 이 파일이 기준이다.

import type { DiagramId } from "@/content/projects/diagrams";

/** 문장 중간 강조는 세그먼트로 나눠 둔다 ({ em }이 본문색으로 뜬다). */
export type ProseSegment = string | { em: string };

export type MetaCell = {
  label: string;
  value?: string;
  /** 값 아래 붙는 작은 보조 문구 */
  note?: string;
  links?: { label: string; href: string }[];
};

/** 브라우저 창 프레임의 제목 줄에 뜨는 화면 이름이 label이다. */
export type Shot = { src: string; alt: string; label: string };

/**
 * 상세 페이지 스크린샷 아래에 기기 프레임으로 붙는 모바일 화면.
 * `scripts/capture-mobile.mjs`가 라이브 사이트를 폭 390px로 찍어 만든다
 * (세로는 화면마다 다르다) — 로그인이 필요한 관리자 화면은 대상이 아니다.
 */
export type MobileShot = { src: string; alt: string; note: string };

export type Card = { title: string; description: string; accent?: boolean };

export type CaseStudySection =
  | { heading: string; prose: ProseSegment[] }
  | { heading: string; diagram?: DiagramId; cards: Card[]; columns?: 2 };

export type CaseStudy = {
  /** 히어로 위 accent 한 줄 (상태 + 맥락) */
  statusLine: string;
  title: string;
  overview: string;
  meta: MetaCell[];
  /** 한 줄에 나란히 놓을 스크린샷끼리 묶는다. 줄당 1~3장. */
  shotRows: Shot[][];
  mobileShot?: MobileShot;
  sections: CaseStudySection[];
};

export const caseStudies: Record<string, CaseStudy> = {
  "modu-campus": {
    statusLine: "WIP · 2026 — 고려대학교 체인지메이커스 선정",
    title: "모두의 캠퍼스",
    overview:
      "고려대학교 장애인·이동약자를 위한 배리어프리 웹 지도. 엘리베이터·경사로·장애인 화장실·점자블록 등 접근성 시설을 지도 기반으로 통합 제공하고, 이동약자 관점의 시설 검색·필터 UX를 설계했습니다.",
    meta: [
      { label: "ROLE", value: "기획 · 설계 · 개발" },
      { label: "PERIOD", value: "2026 — 진행 중" },
      {
        label: "STACK",
        value: "Next.js · Supabase · Leaflet · Cloudflare R2 · Vercel",
        note: "고려대 자체 서버 이관 예정",
      },
      {
        label: "LINKS",
        links: [
          {
            label: "repo ↗",
            href: "https://github.com/dongwoobae/korea-univ-project",
          },
          { label: "live ↗", href: "https://korea-univ-project.vercel.app" },
        ],
      },
    ],
    shotRows: [
      [
        {
          src: "/screenshots/modu-map.png",
          label: "배리어프리 지도 — 한 / EN / 中文",
          alt: "배리어프리 지도 화면 — 캠퍼스 건물과 접근성 시설이 표시된 지도",
        },
      ],
      [
        {
          src: "/screenshots/modu-admin-buildings.png",
          label: "관리자 — 건물 관리",
          alt: "관리자 콘솔의 건물 관리 목록",
        },
        {
          src: "/screenshots/modu-facility-add.png",
          label: "관리자 — 시설 추가",
          alt: "관리자 콘솔의 접근성 시설 추가 화면",
        },
      ],
      [
        {
          src: "/screenshots/modu-building-detail.png",
          label: "건물 상세 — 시설 현황 · 음성 읽기 · 시설 사진",
          alt: "건물 상세 패널 — 시설 현황과 시설 사진",
        },
      ],
    ],
    mobileShot: {
      src: "/screenshots/mobile/modu-campus-mobile.png",
      alt: "모두의 캠퍼스 모바일 화면 — 건물 검색, 시설 필터, 지도 위 접근성 시설 마커",
      note: "캠퍼스를 이동하면서 보는 지도라 모바일이 실사용 화면입니다. 건물 검색·시설 필터·현재 지도 목록을 지도 위에 겹쳐 두어, 화면 전환 없이 한 손으로 조작할 수 있게 배치했습니다.",
    },
    sections: [
      {
        heading: "## 문제",
        prose: [
          "캠퍼스의 접근성 시설 정보는 흩어져 있고, 이동약자가 실제로 이동을 계획할 때 필요한 “이 경로가 휠체어로 갈 수 있는가”라는 질문에 답하는 서비스가 없었습니다. 배리어프리를 정보 나열이 아니라 ",
          { em: "기능으로" },
          " 구현하는 것이 목표였습니다.",
        ],
      },
      {
        heading: "## 핵심 엔지니어링",
        cards: [
          {
            title: "경사도 오버레이 + 법적 기준 시각화",
            description:
              "경로 구간별 경사도를 색상으로 표시하고, 휠체어 접근 법정 기준 1/12을 범례로 명시. 이동약자 관점에서 “갈 수 있는 길”을 판단할 수 있는 정보를 제공.",
          },
          {
            title: "관리자 폴리곤 직접 드로잉",
            description:
              "지도 위에서 건물 폴리곤을 직접 그려 신규 건물을 등록·편집. 단순 CRUD가 아닌 지도 인터랙션 구현.",
          },
          {
            title: "Overpass API 동기화 — 3-서버 순차 폴백",
            description:
              "OpenStreetMap Overpass 서버 3개를 순차 시도해 외부 API 장애에 대응. 소프트 삭제된 건물은 sync가 재추가하지 않도록 충돌 방지 로직 구현.",
          },
          {
            title: "Papago NMT 자동 다국어화",
            description:
              "관리자가 한국어로 입력하면 등록 시점에 en/zh로 자동 번역(Promise.all 병렬) 후 저장 — 한국어 / English / 中文 i18n 제공.",
          },
        ],
      },
    ],
  },

  "ankang-sumgim": {
    statusLine: "LIVE — 첫 수주 · 이후 의뢰 2건의 출발점 · 운영 2026.05 —",
    title: "안강 섬김 노인복지센터",
    overview:
      "실제 고객 의뢰로 구축한 공식 홈페이지 및 운영자 CMS. 공지·사진 게시판·상담문의·구인 안내를 관리하는 실서비스로, 사진 업로드 시 얼굴을 자동 감지해 블러 처리하는 개인정보 보호 파이프라인을 구현했습니다.",
    meta: [
      { label: "ROLE", value: "기획 · 설계 · 개발 · 배포 · 운영" },
      { label: "PERIOD", value: "2026.05 — 운영 중" },
      {
        label: "STACK",
        value:
          "Next.js · TypeScript · Supabase · R2 · Sharp · face-api.js · Tailwind v4",
      },
      {
        label: "LINKS",
        links: [
          {
            label: "repo ↗",
            href: "https://github.com/dongwoobae/ankang-sumgim",
          },
          { label: "live ↗", href: "https://sumgim-welfare.com" },
        ],
      },
    ],
    shotRows: [
      [
        {
          src: "/screenshots/sumgim-home.png",
          label: "공개 홈페이지",
          alt: "안강 섬김 노인복지센터 공개 홈페이지",
        },
      ],
      [
        {
          src: "/screenshots/sumgim-admin-dashboard.png",
          label: "관리자 — 대시보드",
          alt: "운영자 CMS 대시보드",
        },
        {
          src: "/screenshots/sumgim-blur-gallery.png",
          label: "사진 관리 — 얼굴 자동 블러 적용",
          alt: "얼굴 자동 블러가 적용된 사진 관리 화면",
        },
      ],
    ],
    mobileShot: {
      src: "/screenshots/mobile/ankang-sumgim-mobile.png",
      alt: "안강 섬김 복지센터 모바일 홈 — 센터 소개 문구와 전화 걸기 버튼, 운영 지표",
      note: "센터 문의는 대부분 전화로 들어옵니다. 모바일 첫 화면에서 스크롤 없이 전화번호를 누를 수 있게 두고, 운영 연차·서비스 지역 같은 신뢰 지표를 바로 아래 붙였습니다.",
    },
    sections: [
      {
        heading: "## 문제",
        prose: [
          "복지센터는 활동 사진으로 홍보해야 하지만, 게시 사진에 어르신·이용자의 얼굴이 노출되면 개인정보 문제가 됩니다. ",
          { em: "사진 홍보와 개인정보 보호를 동시에" },
          " — 이 요구를 업로드 파이프라인 자체에서 자동으로 해결했습니다.",
        ],
      },
      {
        heading: "## 핵심 엔지니어링 — 얼굴 자동 블러 파이프라인",
        cards: [
          {
            title: "클라이언트 감지 + 서버 블러 분리",
            description:
              "브라우저에서 face-api.js(TinyFaceDetector)로 얼굴 좌표를 감지하고, 서버(sharp)에서 해당 영역만 추출 → 강블러(blur 28) → 원위치 합성. EXIF 회전·리사이즈 스케일을 보정해 좌표를 정확히 매핑.",
            accent: true,
          },
          {
            title: "2-Phase 업로드 파이프라인",
            description:
              "TF.js WebGL 백엔드가 단일 스레드라 얼굴 감지는 순차, R2 업로드는 병렬(Promise.all)로 분리해 다중 업로드 성능 확보. Server Action 직렬화를 피하려 업로드만 API Route로 분리.",
          },
          {
            title: "원본/블러 이중 저장 + 토글",
            description:
              "original/·blurred/ 두 버전을 보관해 사진별 블러 on/off와 수동 블러 영역 편집(fallback)까지 지원.",
          },
          {
            title: "메모리 안정화",
            description:
              "TF.js 텐서 메모리 누수를 objectURL 해제 + GC yield로 완화.",
          },
        ],
      },
      {
        heading: "## 성과",
        prose: [
          "고객 만족과 소개를 통해 후속 프로젝트(영천중앙교회 홈페이지)로 이어졌습니다.",
        ],
      },
    ],
  },

  "ycc-website": {
    statusLine: "LIVE — 첫 프로젝트의 고객 소개로 이어진 후속 의뢰",
    title: "영천중앙교회 홈페이지",
    overview:
      "교회 공식 홈페이지 및 콘텐츠 운영 CMS. 매주 반복되는 설교·주보·갤러리 운영 부담을 줄이기 위해 YouTube 설교 자동 동기화, HWP 주보 구조화, AI 요약·썸네일 생성까지 이벤트 기반 파이프라인으로 자동화했습니다.",
    meta: [
      { label: "ROLE", value: "기획 · 설계 · 개발 · 배포 · 운영" },
      { label: "PERIOD", value: "운영 중" },
      {
        label: "STACK",
        value:
          "Next.js · TypeScript · Neon · Drizzle · Better Auth · R2 · HWP Parser",
      },
      {
        label: "LINKS",
        links: [
          {
            label: "repo ↗",
            href: "https://github.com/dongwoobae/ycc-website",
          },
          { label: "live ↗", href: "https://www.ycjc.kr" },
        ],
      },
    ],
    shotRows: [
      [
        {
          src: "/screenshots/ycc-home.png",
          alt: "영천중앙교회 공개 홈페이지",
          label: "공개 홈페이지",
        },
      ],
      [
        {
          src: "/screenshots/ycc-admin-sermons.png",
          label: "관리자 CMS — 설교 관리 · YouTube 동기화 · AI 요약",
          alt: "관리자 CMS의 설교 관리 화면 — YouTube 동기화와 AI 요약 상태",
        },
      ],
    ],
    mobileShot: {
      src: "/screenshots/mobile/ycc-website-mobile.png",
      alt: "영천중앙교회 모바일 설교 목록 — 예배·설교 히어로, 예배·찬양 탭, 예배 종류 필터와 설교 영상 카드",
      note: "성도 대부분이 휴대폰으로 설교를 다시 봅니다. 예배 종류 필터·검색·정렬을 목록 위에 그대로 올리고, 카드마다 썸네일과 AI 요약 한 줄을 붙여 스크롤만으로 원하는 설교를 찾게 했습니다.",
    },
    sections: [
      {
        heading: "## 설교 자동 동기화 — WebSub 푸시",
        diagram: "ycc-websub",
        cards: [
          {
            title: "폴링 없는 실시간 등록",
            description:
              "채널 피드를 Google PubSubHubbub 허브에 구독. 업로드 발생 시 허브가 Atom 알림을 푸시 → 주기적 폴링 불필요. yt:videoId를 파싱해 QStash ingest-video 잡 발행으로 파이프라인 연결.",
            accent: true,
          },
          {
            title: "콜백 보안 2겹 + 구독 자동 갱신",
            description:
              "구독 검증은 우리 채널 토픽일 때만 hub.challenge 에코, 알림은 X-Hub-Signature(HMAC-SHA1)를 timing-safe 비교로 위조 차단. WebSub 리스 만료는 2일 주기 QStash cron 재구독으로 방지, 푸시 소실분은 매일 채널 최신 영상과 DB를 대조하는 보정 잡으로 주워 담는다.",
          },
        ],
      },
      {
        heading: "## AI 요약 파이프라인 — 서버리스 메시지 큐",
        diagram: "ycc-qstash",
        cards: [
          {
            title: "QStash 단계 체이닝",
            description:
              "Vercel 서버리스(장기 실행 불가) 환경에서 ingest-video → fetch-transcript → summarize를 독립 잡으로 분리해 QStash로 연결. 잡 엔드포인트는 HMAC 서명 검증으로 보호.",
            accent: true,
          },
          {
            title: "동시성 제어 + 서버리스식 재시도",
            description:
              "Postgres CTE UPDATE...RETURNING으로 설교 1건을 원자적 선점해 중복 요약 차단. sleep이 불가능하므로 재시도를 두 갈래로 나눴다 — 영상·자막 미준비는 QStash 지연 발행으로 30분 뒤 재투입(최대 12회), 요약 실패는 다음 시각(5·3ⁿ분)을 DB에 적어 두고 매시간 스위퍼가 회수한다. Gemini responseSchema로 요점·타임스탬프 챕터를 JSON 스키마로 강제.",
          },
        ],
      },
      {
        heading: "## 그 외",
        columns: 2,
        cards: [
          {
            title: "HWP 주보 구조화",
            description:
              "HWP 바이너리를 직접 파싱해 웹에서 구조화 렌더링 — 매주 주보 등록을 업로드 한 번으로 축소.",
          },
          {
            title: "AI 설교 썸네일 생성",
            description:
              "AI가 한글을 못 그리는 문제를 피해 배경만 AI 생성, 글자는 @vercel/og로 코드 합성. 누끼는 자막 밴드 crop + preview 사이즈 처리로 유료 크레딧 0원 설계.",
          },
        ],
      },
    ],
  },

  worldengco: {
    statusLine: "WIP — 소개가 이어져 받은 세 번째 의뢰 · 개발 진행 중",
    title: "월드ENC.CO 홈페이지",
    overview:
      "반려견 목욕차·복지(재가노인·장애인) 이동목욕차 제작 전문업체(2014 설립, ISO9001)의 홈페이지 전면 리모델링. 게시판 중심의 Wix 사이트를 신규 차량 문의·견적 획득(lead-gen) 중심의 카탈로그형 사이트로 새로 구축 중입니다.",
    meta: [
      { label: "ROLE", value: "기획 · 설계 · 개발 · 배포" },
      { label: "PERIOD", value: "2026.07 — 개발 진행 중" },
      {
        label: "STACK",
        value:
          "Next.js 16 · Cloudflare Workers · D1 · Drizzle · Better Auth · Tailwind v4",
      },
      {
        label: "LINKS",
        links: [
          {
            label: "live ↗",
            href: "https://worldengco-website.dongwoobae.workers.dev/",
          },
        ],
        note: "worldengco.com 이관 예정",
      },
    ],
    shotRows: [
      [
        {
          src: "/screenshots/worldeng-home.png",
          label: "공개 홈페이지",
          alt: "월드ENC.CO 공개 홈페이지",
        },
      ],
      [
        {
          src: "/screenshots/worldeng-admin-booking.png",
          label: "관리자 — 예약 관리 · 휴무/영업일 지정",
          alt: "관리자 예약 관리 화면 — 휴무·영업일 지정",
        },
        {
          src: "/screenshots/worldeng-admin-board.png",
          label: "관리자 — 출고차량 게시판",
          alt: "관리자 출고차량 게시판",
        },
        {
          src: "/screenshots/worldeng-admin-staff.png",
          label: "관리자 — 직원 계정 관리",
          alt: "관리자 직원 계정 관리 화면",
        },
      ],
    ],
    mobileShot: {
      src: "/screenshots/mobile/worldengco-mobile.png",
      alt: "월드ENC.CO 모바일 홈 — 제작 소개 문구와 견적 문의·A/S 예약 버튼",
      note: "견적 문의를 받는 것이 이 사이트의 목적입니다. 모바일 첫 화면에서 무엇을 만드는 회사인지 두 줄로 밝히고, 견적 문의와 A/S·교육 예약 버튼을 그 아래 나란히 두어 스크롤 없이 전환되게 했습니다.",
    },
    sections: [
      {
        heading: "## 핵심 작업",
        cards: [
          {
            title: "리드획득형 IA 설계 — 듀얼 트랙",
            description:
              "제품 정보가 빈약한 게시판형 구조를 “관심 → 문의/견적” 동선으로 재설계. 홈에서 반려견/복지 목욕차 두 갈래로 분기해 각 전용 제품 페이지와 맞춤 견적 폼으로 연결.",
            accent: true,
          },
          {
            title: "Wix → 자체 서비스 데이터 이관",
            description:
              "기존 Wix 사이트의 콘텐츠(출고차량 등 게시물)를 이관 스크립트로 자동 임포트 — dry-run으로 검증 후 apply하는 2단계 설계로 안전하게 이전.",
            accent: true,
          },
          {
            title: "운영자 중심 관리자 시스템",
            description:
              "예약 관리(휴무·영업일 캘린더 지정, 전화 접수 수동 등록), 중고·출고차량 게시판, 문의·공지, 직원 계정 관리(입·퇴사 시 계정 생성/삭제·비밀번호 재설정)까지 — 사무실 업무 흐름 그대로 옮긴 CMS.",
          },
          {
            title: "비용 근거 기반 인프라 선택 — Cloudflare Workers",
            description:
              "Vercel 무료 티어는 상업적 사용 금지 → 상업 사용이 허용되고 트래픽 과금이 없는 Cloudflare Workers(OpenNext 어댑터)를 선택. D1 + Drizzle 마이그레이션, Better Auth 인증 구성.",
          },
          {
            title: "Next 16 ↔ OpenNext 비호환 트러블슈팅",
            description:
              "Next 16의 Turbopack 기본 빌드 산출물을 OpenNext가 읽지 못해 배포 후 500 발생 → webpack 빌드 + output: standalone으로 해결하고 배포 스크립트에 고정.",
          },
          {
            title: "CI/CD + 테스트 체계",
            description:
              "GitHub Actions로 lint → Prettier 검사 → 빌드 → main push 시 자동 배포. Vitest 단위 테스트 + Playwright E2E로 회귀 검증.",
          },
        ],
      },
    ],
  },

  hmsu: {
    statusLine: "보건복지부 한의디지털융합사업 과제 — 1인 PM · 개발",
    title: "한약안전사용 플랫폼",
    overview:
      "기존 한의 정보 3만건과 공공데이터 API, 한국한의약진흥원·국가생약정보 등 다기관 제공 데이터를 라벨링·통합한 정보 검색 플랫폼. 사용자 관리 시스템과 검색 플랫폼 구축을 1인 PM·개발로 완주했습니다.",
    meta: [
      { label: "ROLE", value: "1인 PM · 기획 · 개발" },
      { label: "CLIENT", value: "보건복지부 과제 수행" },
      { label: "STACK", value: "Java · JSP · Servlet · Tomcat · MariaDB" },
      {
        label: "LINKS",
        links: [{ label: "live ↗", href: "https://hmsu.kr" }],
      },
    ],
    shotRows: [
      [
        {
          src: "/screenshots/hmsu-home.png",
          label: "공개 메인 화면",
          alt: "한약안전사용 플랫폼 메인 화면",
        },
      ],
    ],
    mobileShot: {
      src: "/screenshots/mobile/hmsu-mobile.png",
      alt: "한약안전사용 플랫폼 모바일 메인 — 처방 검색창과 주요 안내 카드",
      note: "처방 정보를 찾으러 오는 사이트라, 모바일에서도 검색창을 첫 화면 가운데에 두고 자주 찾는 처방을 바로 아래 칩으로 노출했습니다. 안내·문의 진입점은 그다음 순서로 내렸습니다.",
    },
    sections: [
      {
        heading: "## 역할",
        prose: [
          "요구사항 정의부터 데이터 설계, 개발, 기관 커뮤니케이션까지 ",
          { em: "PM과 개발을 혼자 수행" },
          "한 프로젝트입니다. 웹 개발자로 근무하며 첫 실무 과제로 완주했습니다.",
        ],
      },
      {
        heading: "## 핵심 작업",
        cards: [
          {
            title: "공공데이터 3만건+ 라벨링 · 통합",
            description:
              "기존 한의 정보 3만건과 공공데이터 API, 다기관 제공 데이터를 일관된 스키마로 라벨링해 통합 제공.",
            accent: true,
          },
          {
            title: "사용자 관리 + 정보 검색 플랫폼",
            description:
              "사용자 관리 시스템과 통합 데이터 기반 정보 검색 플랫폼을 Java·JSP·Servlet·MariaDB 스택으로 구축.",
          },
        ],
      },
    ],
  },
};
