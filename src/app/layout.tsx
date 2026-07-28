import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const ibmPlexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-ibm-plex-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.role}`,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  openGraph: {
    title: `${site.name} | ${site.role}`,
    description: site.tagline,
    siteName: site.name,
    locale: "ko_KR",
    type: "website",
    url: site.url,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body
        className={`${ibmPlexSansKr.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: site.name,
              jobTitle: site.role,
              url: site.url,
              email: site.email,
              sameAs: [site.github],
            }),
          }}
        />
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          // Cloudflare Web Analytics. 쿠키를 쓰지 않는 익명 집계라 동의 배너가
          // 필요 없다.
          //
          // 현재 dwoobae.com은 Cloudflare 대시보드의 "Automatic setup"으로
          // 계측 중이다. 프록시가 같은 beacon.min.js를 응답에 직접 주입하므로
          // 이 스크립트와 수집 내용이 완전히 같다.
          //
          // 따라서 NEXT_PUBLIC_CF_BEACON_TOKEN을 채우면 비콘이 두 번 발사돼
          // 조회수가 두 배로 잡힌다. 자동 주입을 끄지 않는 한 이 값은 비워 둔다.
          // 이 경로가 필요한 경우는 사이트가 Cloudflare 프록시를 거치지 않을 때뿐이다.
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({
              token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN,
            })}
          />
        )}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:text-page"
        >
          본문 바로가기
        </a>
        {/* 페이지마다 셸이 달라서(메인은 좌측 레일, 상세는 중앙 1단) 공통 헤더·푸터를
            두지 않는다. #main 앵커는 각 페이지의 <main>이 갖는다. */}
        {children}
      </body>
    </html>
  );
}
