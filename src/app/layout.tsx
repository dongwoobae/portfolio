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
