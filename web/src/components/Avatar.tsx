import type { CSSProperties } from "react";

export function Avatar({
  url,
  initial,
  color,
  size,
  style,
}: {
  url?: string | null;
  initial: string;
  color: string;
  size: number;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    color: "#FFF",
    background: color,
    overflow: "hidden",
    flexShrink: 0,
    fontSize: Math.round(size * 0.38),
    ...style,
  };

  if (url) {
    return (
      <div style={base}>
        <img
          src={url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return <div style={base}>{initial}</div>;
}
