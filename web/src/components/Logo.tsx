type LogoProps = {
  size?: number;
  className?: string;
};

/** Brand mark: tilted coral tile with Arabic م */
export function Logo({ size = 38, className }: LogoProps) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: "#FF6B57",
        display: "grid",
        placeItems: "center",
        color: "#FFF",
        fontWeight: 800,
        fontSize: Math.round(size * 0.53),
        transform: "rotate(-6deg)",
        boxShadow: `0 ${Math.max(2, Math.round(size * 0.08))}px 0 #E04B38`,
        flexShrink: 0,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      م
    </div>
  );
}
