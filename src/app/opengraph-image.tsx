import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// next/font는 여기서 쓸 수 없다. 한글 폰트를 얹으면 파일이 커지고 실패 지점이
// 늘어나므로 카드 문구는 라틴 문자만 쓴다(satori 기본 폰트로 렌더된다).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.role}`;

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 80px",
        background: "#0f1216",
        color: "#dfe5ec",
      }}
    >
      <div style={{ fontSize: 28, color: "#7ee2a8" }}>$ whoami</div>
      <div style={{ fontSize: 76, fontWeight: 700, marginTop: 20 }}>
        Dongwoo Bae
      </div>
      <div style={{ fontSize: 34, color: "#9aa4b2", marginTop: 16 }}>
        backend-driven fullstack
      </div>
      <div style={{ fontSize: 26, color: "#5b6572", marginTop: 40 }}>
        {site.url.replace(/^https?:\/\//, "")}
      </div>
    </div>,
    size,
  );
}
