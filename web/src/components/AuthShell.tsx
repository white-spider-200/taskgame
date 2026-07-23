import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#FFF7EC",
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: "100%",
          background: "#FFF",
          border: "2px solid #FFE3B3",
          borderRadius: 22,
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Logo size={42} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#2B2118" }}>{title}</div>
            <div style={{ fontSize: 13.5, color: "#9A8A73", fontWeight: 500 }}>{subtitle}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  type,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontWeight: 700, fontSize: 14.5, color: "#2B2118" }}>{label}</label>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#2B2118",
          background: "#FFF7EC",
          border: "2px solid #FFE3B3",
          borderRadius: 14,
          padding: "12px 16px",
          outline: "none",
        }}
      />
    </div>
  );
}

export function AuthFooter({
  prompt,
  href,
  linkText,
}: {
  prompt: string;
  href: string;
  linkText: string;
}) {
  return (
    <p style={{ marginTop: 18, textAlign: "center", fontWeight: 600 }}>
      {prompt} <Link href={href}>{linkText}</Link>
    </p>
  );
}
