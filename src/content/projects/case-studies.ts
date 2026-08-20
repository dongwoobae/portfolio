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

/**
 * 저장소를 공개하지 않는 프로젝트에서 판단이 드러나는 최소 단위만 발췌해
 * 싣는다. 실행 가능한 완전본이 아니다.
 *
 * caption은 출처(파일 경로)나 무엇을 자른 것인지, lang은 코드 위에 뜨는
 * 라벨이다. 하이라이팅은 하지 않으므로 lang이 렌더에 관여하는 곳은 없다.
 */
export type CodeBlock = { lang: string; caption: string; code: string };

export type CaseStudySection =
  | { heading: string; prose: ProseSegment[] }
  | { heading: string; diagram?: DiagramId; cards: Card[]; columns?: 2 }
  | { heading: string; code: CodeBlock };

export type CaseStudy = {
  /** 히어로 위 accent 한 줄 (상태 + 맥락) */
  statusLine: string;
  title: string;
  overview: string;
  meta: MetaCell[];
  /**
   * 한 줄에 나란히 놓을 스크린샷끼리 묶는다. 줄당 1~3장.
   * 공개할 수 있는 화면이 없는 케이스에는 없다.
   */
  shotRows?: Shot[][];
  mobileShot?: MobileShot;
  sections: CaseStudySection[];
};

export const caseStudies: Record<string, CaseStudy> = {
  "coupon-b2b-mall": {
    statusLine: "WIP · 2026 — 재직 중 담당 · 오픈 준비",
    title: "모바일 쿠폰 B2B 오픈몰",
    overview:
      "엑셀 집행신청서를 주고받으며 수작업으로 처리하던 모바일 쿠폰 B2B 거래를 온라인 서비스로 전환하는 프로젝트입니다. 기획·프론트엔드와 요구사항을 조율하며 회원·발송·견적서·장바구니 도메인의 API와 데이터 구조를 설계하고, 운영 배포용 인프라를 결재 문서로 기안했습니다.",
    meta: [
      { label: "ROLE", value: "백엔드 설계 · 개발 · 인프라 기안" },
      { label: "PERIOD", value: "2026.04 — 오픈 준비 중" },
      {
        label: "STACK",
        value: "NestJS · TypeORM · MySQL · Redis · AWS",
      },
    ],
    sections: [
      {
        heading: "## 문제",
        prose: [
          "거래가 엑셀 파일을 주고받는 방식으로 돌아가고 있었습니다. 집행신청서를 받아 담당자가 옮겨 적고, 발송 결과를 다시 파일로 회신하는 흐름이라 건수가 늘수록 사람이 병목이 됩니다. 이 흐름을 그대로 화면으로 옮기면 수작업만 온라인으로 옮겨질 뿐이라, ",
          { em: "무엇을 자동화하고 무엇을 사람이 확인해야 하는지" },
          "부터 나눠야 했습니다.",
          " 사내에는 이미 같은 성격의 발송 시스템이 있었지만 담당자만 쓰는 폐쇄형이었고, 새로 만드는 쪽은 거래처가 직접 들어오는 오픈몰입니다. ",
          { em: "같은 기능이어도 전제가 다르다는 것" },
          "이 이 프로젝트에서 구조를 가르는 지점이었습니다.",
        ],
      },
      {
        heading: "## 대량 발송 큐 — 설계",
        diagram: "coupon-mall-queue",
        columns: 2,
        cards: [
          {
            title: "폴링에서 큐로 — 전제가 달라졌다",
            description:
              "먼저 운영하던 사내 발송 시스템은 데이터베이스를 주기적으로 훑는 방식이었습니다. 발송 전용 서버였고 담당자만 쓰는 폐쇄형이라 지연이 문제가 되지 않았습니다. 오픈몰은 거래처 요청과 발송 처리가 같은 서버에서 만나므로, 훑는 부하가 서비스 응답으로 번지지 않도록 큐를 Redis로 분리했습니다.",
            accent: true,
          },
          {
            title: "제한 아래로 소비 속도를 맞춘다",
            description:
              "발송사가 분당 요청 수를 제한합니다. 수신자 한 명을 작업 한 건으로 쪼개 큐에 넣고, 워커가 그 제한 아래로 꺼내는 속도와 동시 실행 수를 함께 묶었습니다. 요청 건수가 늘어도 초과 호출로 거절당하지 않고 큐 길이로 흡수됩니다.",
            accent: true,
          },
          {
            title: "실패를 수신자 단위로 격리한다",
            description:
              "발송사 응답을 재시도 가능한 사유와 영구 실패로 나눕니다. 재시도 가능한 것만 지수 백오프로 큐에 되돌리고, 영구 실패는 그 수신자만 종결합니다. 한 명이 실패했다고 배치 전체를 되돌리면 이미 받은 사람에게 중복이 나가기 때문입니다.",
          },
          {
            title: "채널 차이를 어댑터가 흡수한다",
            description:
              "문자·알림톡·이메일은 규격도 응답 코드도 다릅니다. 발송사를 포트 뒤로 두고 채널별 어댑터가 차이를 흡수하게 해, 큐와 워커는 채널을 모르는 채로 같은 코드를 씁니다. 발송사를 바꿔도 어댑터만 갈아 끼웁니다.",
          },
        ],
      },
      {
        heading: "## 발송 결과 정합화",
        columns: 2,
        cards: [
          {
            title: "보낸 것과 도착한 것은 다르다",
            description:
              "발송사에 요청을 넘긴 시점에는 결과를 알 수 없습니다. 요청 적재와 결과 확인을 분리하고, 폴러가 발송사 결과를 읽어 자체 로그를 종결 상태로 수렴시킵니다. 화면이 보는 상태와 실제 도달 여부가 어긋나지 않게 하는 것이 목적입니다.",
            accent: true,
          },
          {
            title: "모르는 것을 실패로 뭉개지 않는다",
            description:
              "결과가 오지 않는 경우를 실패로 처리하면 재발송이 남발됩니다. 발송사가 아직 가져가지 않은 상태와 양쪽 어디에도 기록이 없는 상태를 따로 두고, 각각 다른 임계 시간을 넘겼을 때만 개입 대상으로 올립니다.",
            accent: true,
          },
          {
            title: "결과가 오기 전에 판정하지 않는다",
            description:
              "적재 직후 조회하면 아직 처리되지 않은 건을 실패로 오인합니다. 큐에서 결과로 넘어가는 데 걸리는 시간을 실측해 최소 대기 나이를 두고, 그보다 어린 건은 아예 조회 대상에서 뺐습니다.",
          },
          {
            title: "외부 의존 없이 개발·테스트한다",
            description:
              "발송사 연동을 포트와 어댑터로 나누고 스텁 모드를 두어, 개발과 테스트에서는 발송사 접속 없이 같은 코드 경로를 탑니다. 발송 파라미터에 개인정보가 실리므로 쿼리 로깅은 환경별로 차단했습니다.",
          },
        ],
      },
      {
        heading: "## 운영 인프라 — 무엇을 뺐고 왜인가",
        diagram: "coupon-mall-infra",
        columns: 2,
        cards: [
          {
            title: "상위 방어 서비스를 제외한 근거",
            description:
              "기본 네트워크 계층 보호가 대량 트래픽 공격을 막고, 정상 접속을 가장한 애플리케이션 계층 폭주는 웹 방화벽의 요청량 제한으로 완화됩니다. 이를 넘는 대규모 표적 공격은 상위 서비스가 필요하지만 고정비가 현 서비스 규모에 맞지 않아 제외했습니다. 대신 그 경우 수동 차단이 필요하다는 한계를 기안에 함께 적었습니다.",
            accent: true,
          },
          {
            title: "빠진 것을 적는 것이 기안의 일이다",
            description:
              "결재 문서에 구성과 비용만 담으면 읽는 사람은 무엇을 못 막는지 알 수 없습니다. 장애 유형별로 자동 복구되는 것과 사람이 개입해야 하는 것, 복구까지 걸리는 시간을 나눠 적어 판단에 필요한 재료를 함께 올렸습니다.",
            accent: true,
          },
          {
            title: "이중화는 배치까지가 설계다",
            description:
              "서버를 두 대로 늘려도 같은 가용영역에 두면 그 데이터센터가 멈출 때 동시에 멈춥니다. 앱 서버와 데이터베이스, 캐시를 모두 가용영역 두 곳에 나눠 배치했습니다. 캐시는 분산 락의 주체라 주 노드가 멈추면 발송 경합 제어를 잃으므로 자동 장애 조치까지 켰습니다.",
          },
          {
            title: "공격 표면을 줄여 둔다",
            description:
              "프론트엔드가 백엔드 호출을 서버 측에서 대행하는 구조라 백엔드를 외부에 노출하지 않았습니다. 첨부파일은 브라우저와 스토리지가 서명된 URL로 직접 주고받아 서버를 거치지 않습니다. 다만 이는 방어 계층의 추가일 뿐 백엔드 자체의 인증·권한을 대체하지 않습니다.",
          },
        ],
      },
    ],
  },
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
        {
          src: "/screenshots/modu-slope.png",
          label: "경사도 오버레이 — 법적 기준 1/12(8.33%) 표시",
          alt: "경사도 오버레이를 켠 배리어프리 지도 — 보행로 경사가 구간별 색으로 구분되고 범례에 법적 기준선이 함께 표시된 화면",
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
        {
          src: "/screenshots/modu-polygon-draw.png",
          label: "관리자 — 건물 폴리곤 직접 드로잉",
          alt: "관리자 콘솔의 건물 폴리곤 드로잉 화면 — 지도 위에 꼭짓점을 찍어 건물 외곽선을 그리는 중이고 Finish · Remove Last Vertex · Cancel 도구가 떠 있는 상태",
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
              "지도 위에서 건물 외곽선을 직접 그려 신규 건물을 등록·편집. 꼭짓점 단위로 수정하고 좌표를 저장해, 도면 없이도 운영자가 건물 경계를 잡을 수 있다.",
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
      [
        {
          src: "/screenshots/sumgim-calculator.png",
          label: "본인부담금 계산기 — 등급 · 이용 시간 · 월 횟수",
          alt: "본인부담금 계산기 화면 — 장기요양 등급과 1회 이용 시간, 월 이용 횟수를 넣어 월 예상 본인부담금이 산출된 결과",
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
        diagram: "sumgim-blur",
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
          "소개만으로는 보호자의 신뢰를 얻기 어려워 실제 이용으로 이어지는 경우가 적었지만, 홈페이지에서 센터와 운영 정보를 확인한 보호자가 당일 저녁 이용을 결정한 첫 사례가 발생했습니다. 이후 홈페이지를 보고 직접 찾아오는 상담 고객과 요양보호사 채용 문의도 이어졌습니다.",
          "고객 만족과 소개를 통해 영천중앙교회와 월드ENC.CO 홈페이지, 두 건의 후속 의뢰로 이어졌습니다.",
        ],
      },
    ],
  },

  "ycc-website": {
    statusLine: "LIVE — 첫 프로젝트의 고객 소개로 이어진 후속 의뢰",
    title: "영천중앙교회 홈페이지",
    overview:
      "교회 공식 홈페이지 및 콘텐츠 운영 CMS. 매주 반복되는 설교·주보·갤러리 운영 부담을 줄이기 위해 YouTube 설교 자동 동기화와 AI 요약·썸네일 생성을 자동화하고, 주보는 주요 내용 카드와 PDF 이미지로 한눈에 볼 수 있게 구성했습니다.",
    meta: [
      { label: "ROLE", value: "기획 · 설계 · 개발 · 배포 · 운영" },
      { label: "PERIOD", value: "운영 중" },
      {
        label: "STACK",
        value: "Next.js · TypeScript · Neon · Drizzle · Better Auth · R2",
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
          src: "/screenshots/ycc-sermon-detail.png",
          label: "설교 상세 — AI 요약 · 글자 크기 조절",
          alt: "공개 설교 상세 화면 — 설교 영상과 AI가 생성한 빠른 요약, 글자 크기를 키우고 줄이는 버튼",
        },
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
              "Postgres CTE UPDATE...RETURNING으로 설교 1건을 원자적 선점해 중복 요약 차단. sleep이 불가능하므로 재시도를 두 갈래로 나눴다 — 영상·자막 미준비는 QStash 지연 발행으로 30분 뒤 재투입(최대 12회), 요약 실패는 다음 시각(5·3ⁿ⁻¹분)을 DB에 적어 두고 매시간 스위퍼가 최대 3회까지 회수한다. Gemini responseSchema로 요점·타임스탬프 챕터를 JSON 스키마로 강제.",
          },
        ],
      },
      {
        heading: "## 그 외",
        columns: 2,
        cards: [
          {
            title: "주보 등록 — 자동화보다 정확성",
            description:
              "HWP 자동 파싱을 구현했지만 실제 문서를 검수하며 정확도 한계를 확인해 운영자에게 공유했고, 운영자도 기능이 난해해 쓰기 어렵다는 의견을 전달. 운영자와 사용성을 함께 검토한 결과 자동화 유지보다 직접 입력이 안정적이라고 판단해, 주요 내용 카드 + PDF 이미지 열람 구조로 전환.",
          },
          {
            title: "AI 설교 썸네일 생성",
            description:
              "AI가 한글을 못 그리는 문제를 피해 배경만 AI 생성, 글자는 @vercel/og로 코드 합성. 누끼는 자막 밴드 crop + preview 사이즈 처리로 유료 크레딧 0원 설계.",
          },
          {
            title: "소식 예약 게시 — 서버리스 스케줄링",
            description:
              "노출 여부는 항상 DB 조건(publishedAt ≤ now)이 결정하고, QStash 지연 콜백은 공개 시각에 캐시 재검증만 수행. 콜백이 멱등이라 예약을 바꿔도 기존 메시지를 취소할 필요가 없고, 발행 실패 시 ISR이 백스톱으로 동작한다.",
          },
          {
            title: "관리 목록 UX",
            description:
              "등록 버튼 위치 통일, 제목 클릭 시 공개 페이지 새 창, 삭제 확인 모달 — 운영자가 매주 쓰는 화면의 마찰을 줄이는 개선을 운영하며 계속 반영.",
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
        {
          src: "/screenshots/worldeng-reserve.png",
          label: "A/S·교육 예약 — 가용 날짜 판정",
          alt: "공개 예약 요청 화면 — 예약 유형 선택과 희망 날짜 달력, 예약할 수 없는 날짜는 비활성으로 표시된 상태",
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
      {
        heading: "## 예약 시스템 — 이중예약 방어",
        diagram: "worldeng-reservation",
        columns: 2,
        cards: [
          {
            title: "가용 판정 로직을 클라이언트·서버가 공유",
            description:
              "공휴일 API·관리자 휴무 지정·예약 타입별 요일 규칙(타사 정비는 토요일만, 자사 A/S·교육은 일요일 제외)을 판정하는 함수 하나를 데이트피커와 서버 액션이 같이 쓴다. 화면에서 막은 날짜를 서버가 다시 검증하므로 규칙이 갈라지지 않는다. 공휴일 API 장애 시에는 fail-open으로 예약 자체가 멈추지 않게 했다.",
            accent: true,
          },
          {
            title: "이중예약 최종 방어선 — 부분 유니크 인덱스",
            description:
              "D1에서는 앱 레벨 check-then-insert가 원자적이지 않아 동시 요청이 같은 슬롯을 통과할 수 있다. 확정 예약에만 걸리는 partial unique index (date, hour) WHERE status='confirmed'로 DB가 마지막을 막는다. '시간 협의'(hour null)는 슬롯을 점유하지 않으므로 조건에서 제외했다.",
            accent: true,
          },
          {
            title: "공개 폼 다층 방어",
            description:
              "요청 제한(IP 슬라이딩 윈도우 10분 5회)을 Turnstile보다 먼저 걸어 불필요한 외부 호출을 줄이고, 이후 스키마 검증·6개월 상한·가용 재검증을 차례로 통과시킨다. 실패는 throw가 아니라 폼 상태로 돌려 입력이 유실되지 않게 했다.",
          },
          {
            title: "전화 접수와 웹 예약을 한 테이블로",
            description:
              "업체는 웹 예약을 열어도 전화 접수를 계속 쓴다. 두 경로를 별도 시스템으로 나누지 않고 전화 예약을 source='manual'로 같은 테이블에 등록해, 운영자가 캘린더 하나에서 전체 일정을 관리하고 장부를 이중으로 들지 않게 했다.",
          },
        ],
      },
      {
        heading: "## 발췌 — 가용 판정 공유",
        code: {
          lang: "typescript",
          caption: "src/lib/availability.ts — 시그니처와 핵심 분기",
          code: `/**
 * 클라이언트(데이트피커 비활성)·서버(Server Action 재검증) 공용 판정.
 * 반환 null = 예약 가능.
 *
 * holidays가 비면(공휴일 API 장애) 공휴일 차단 없이 통과시킨다 —
 * 판정을 못 한다고 접수를 통째로 막지는 않는다.
 */
export function getUnavailableReason(opts: {
  type: ReservationType;
  date: string; // "YYYY-MM-DD"
  today: string;
  holidays: ReadonlySet<string>;
  overrides: ReadonlyMap<string, OverrideKind>; // 관리자 휴무·특별영업 지정
}): UnavailableReason | null {
  const { type, date, today, holidays, overrides } = opts;

  if (date <= today) return "past"; // 오늘 포함 — 공개 접수는 내일부터
  if (date > maxReservationDate(today)) return "too_far";

  const wd = weekdayOf(date);
  if (type === "external_repair") {
    if (wd !== 6) return "weekday"; // 타사 정비는 토요일만
  } else if (wd === 0 || wd === 6) {
    return "weekday";
  }

  // 관리자 지정이 공휴일 판정을 이긴다 — 공휴일에 여는 날이 있다.
  const override = overrides.get(date);
  if (override === "closed") return "closed";
  if (holidays.has(date) && override !== "open") return "holiday";

  return null;
}

// 화면과 서버가 같은 함수를 각자 부른다 — 규칙이 두 벌로 갈라지지 않는다.
//   components/date-picker.tsx    → 달력에서 그 날짜를 비활성화
//   service/reserve/actions.ts    → 제출 시 서버에서 다시 판정`,
        },
      },
      {
        heading: "## 발췌 — 이중예약 최종 방어선",
        code: {
          lang: "sql",
          caption: "migrations/ — 확정 예약 슬롯 유니크 제약",
          code: `-- 앱 레벨 check-then-insert는 D1에서 원자적이지 않다. 두 요청이 같은 빈
-- 슬롯을 동시에 통과할 수 있어, 마지막 방어선을 DB 제약으로 내린다.
CREATE UNIQUE INDEX reservations_confirmed_slot_uq
  ON reservations (date, hour)
  WHERE status = 'confirmed' AND hour IS NOT NULL;

-- 확정된 예약만 슬롯을 점유한다. 대기·반려 건과 시간 미정("시간 협의",
-- hour IS NULL)은 조건에서 빠져 같은 날짜에 여러 건이 공존한다.`,
        },
      },
    ],
  },

  hmsu: {
    statusLine: "LIVE · 5개년 국가 R&D 과제 3년차 — 플랫폼 구축",
    title: "한약안전사용 플랫폼",
    overview:
      "보건복지부·과기정통부 한의디지털융합기술개발사업의 5개년 과제 ‘빅데이터에 기반한 한약 안전 사용 플랫폼’으로 구축한 공식 웹서비스. 한국한의약진흥원·국가생약정보 등 기관마다 흩어져 있던 한약 데이터 3만건+를 수집·정제해 통합 검색으로 묶고, 사용자 관리 시스템까지 함께 구축했습니다.",
    meta: [
      { label: "ROLE", value: "1인 PM · 기획 · 데이터 · 개발" },
      {
        label: "PERIOD",
        value: "2024.11 — 2025.07",
        note: "데이터 설계 후 2025 상반기 개발",
      },
      {
        label: "STACK",
        value: "Java · JSP · Servlet · Tomcat · MariaDB",
        note: "사내 공통 라이브러리 기반",
      },
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
        {
          src: "/screenshots/hmsu-search.png",
          label: "첩약 검색 — 기준처방코드로 정리된 목록",
          alt: "첩약 검색 화면 — 기준처방분류코드와 기준처방코드, 첩약대상질환코드가 붙은 처방 목록",
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
        heading: "## 문제",
        prose: [
          "한약 정보는 제공 기관마다 분류 체계와 형식이 달라 한자리에서 찾을 수 없었고, ",
          { em: "같은 이름이 같은 약재도 아니었습니다" },
          " — ‘갈근’만 해도 기원 식물이 다른 A·B·C로 나뉩니다. 이름만 보고 외부 자료를 이어 붙이면 다른 식물의 성분·약리 정보가 붙습니다. 데이터를 모으는 일과, 모은 데이터를 무엇에 이어 어떤 화면으로 꺼내 줄지 정하는 일이 함께 필요했습니다.",
        ],
      },
      {
        heading: "## 역할",
        prose: [
          "요구사항 정의와 데이터 설계·개발을 담당하며, ",
          {
            em: "한국한의약진흥원 등 외부 기관과 데이터 제공 범위와 형식을 협의",
          },
          "했습니다. 기관마다 분류와 형식이 다른 자료를 서비스에서 쓸 수 있는 구조로 정리하고, 검색·상세 화면까지 연결했습니다.",
        ],
      },
      {
        heading: "## 핵심 작업",
        cards: [
          {
            title: "한약 데이터 3만건+ 수집 · 정제 · 통합",
            description:
              "공공데이터와 다기관 제공 자료에서 한약 제제 정보를 모아 허가 상태·의약품 분류·성분까지 일관된 스키마로 정제해 적재.",
          },
          {
            title: "공공데이터 API 연동 — 어디까지 같은 약재로 볼지",
            description:
              "약재 상세에서 국가생약정보 API로 성분·약리와 HPLC·HPTLC·관능검사해설서 감별 자료를, 전통지식포탈에서 IPC 특허 분류 코드를 붙인다. 만 건 단위인 원천 데이터에 견줘 기관 제공 자료는 많아야 천 건대, 적으면 수십 건이라 1:1로 떨어지지 않는다. 학명·라틴명을 대조해 이을 범위를 정하고, 기원 식물이 갈라지는 갈근 A·B·C는 약전 생약명 단위로 묶어 같은 자료를 보여주는 선까지 내려왔다. 자료가 없는 항목은 화면에서 숨긴다.",
            accent: true,
          },
          {
            title: "원천 데이터를 검색 화면으로",
            description:
              "쌓여만 있던 약재·처방·병증 데이터를 어떤 기준으로 묶어 어떻게 보여줄지 기획·설계. 검색 3종과 통합검색으로 꺼내고, 약재 하나에서 그 약재가 들어가는 처방·관련 병증·효능·출전 고전과 논문, 전통의학정보포털 원문까지 이어지도록 연결.",
          },
          {
            title: "자료실 · 운영 창구",
            description:
              "논문·한의학 고전·연구서적·통계자료를 유형별 조회 구조로 구성하고, 정보 오류·개선요청 창구를 붙여 이용자 신고가 운영자에게 닿는 경로를 마련.",
          },
          {
            title: "기존 사내 환경과의 호환",
            description:
              "스택을 새로 고르는 프로젝트가 아니라 사내 공통 라이브러리와 JSP/Servlet 기반 구조 안에서 구현. 기존 시스템과의 호환을 지키면서 신규 검색·자료 기능을 추가.",
          },
        ],
      },
      {
        heading: "## 결과",
        prose: [
          "검색 3종과 자료실, 오류 개선 창구를 하나의 플랫폼으로 묶었습니다. 서비스는 hmsu.kr로 공개되어 현재도 운영 중입니다.",
        ],
      },
    ],
  },
};
