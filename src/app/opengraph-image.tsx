import { ImageResponse } from "next/og";
import { SITE } from "@/lib/config/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#c9a55a";

/** Social share card: logo lockup on near-black. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #000 0%, #141416 100%)",
          color: "#f5f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28, letterSpacing: 18, fontSize: 96, fontWeight: 600, textTransform: "uppercase" }}>
          <span style={{ color: "#f5f5f7" }}>Gun</span>
          <svg width="40" height="110" viewBox="0 0 24 64">
            <path d="M12 2c3.2 4.6 5 9.8 5 15.5V22H7v-4.5C7 11.8 8.8 6.6 12 2z" fill={GOLD} />
            <path d="M7 22h10v30H7z" fill="none" stroke="#f5f5f7" strokeWidth="2.2" />
            <path d="M6 52h12M6 56h12" stroke="#f5f5f7" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M7 58h10v3H7z" fill="#f5f5f7" />
          </svg>
          <span style={{ color: GOLD }}>Spa</span>
        </div>
        <div style={{ width: 640, height: 6, background: GOLD, marginTop: 28 }} />
        <div style={{ display: "flex", gap: 14, marginTop: 26, fontSize: 34, fontWeight: 600, letterSpacing: 6, textTransform: "uppercase" }}>
          <span>Ready? Aim.</span>
          <span style={{ color: GOLD }}>Relax!</span>
        </div>
        <div style={{ marginTop: 40, fontSize: 24, color: "#a1a1a6" }}>{`A private shooting club in ${SITE.address.neighborhood}`}</div>
      </div>
    ),
    { ...size },
  );
}
