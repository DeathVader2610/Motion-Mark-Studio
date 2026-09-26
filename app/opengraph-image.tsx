import { ImageResponse } from "next/og";
export const alt =
  "Motion Mark Studio — Stories in motion. Brands that leave a mark.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#151812",
        color: "#edf0e4",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 70,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 22, letterSpacing: 4 }}>
        MOTION MARK STUDIO / JAMSHEDPUR
      </div>
      <div
        style={{
          fontSize: 86,
          lineHeight: 1.04,
          letterSpacing: -5,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span>Stories in motion.</span>
        <span>Brands that leave a mark.</span>
      </div>
      <div style={{ fontSize: 20, color: "#a5ad97" }}>
        STRATEGY · FILM · PHOTOGRAPHY · SOCIAL · DESIGN
      </div>
    </div>,
    size,
  );
}
