"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AdminShell({
  teamId,
  teamName,
  children,
}: {
  teamId: string;
  teamName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  function tabStyle(active: boolean) {
    return {
      background: active ? "#2B2118" : "#FFFFFF",
      color: active ? "#FFFFFF" : "#7A6A55",
      border: "2px solid #FFE3B3",
      borderRadius: 999,
      padding: "7px 18px",
      fontWeight: 700,
      fontSize: 14,
      textDecoration: "none",
    };
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#FFF7EC",
        color: "#2B2118",
        padding: "24px 32px 64px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>
            إدارة الفريق — {teamName}
          </div>
          <div style={{ fontSize: 13, color: "#9A8A73", fontWeight: 600 }}>
            متاحة لصاحب الفريق فقط
          </div>
        </div>
        <Link
          href={`/t/${teamId}`}
          style={{
            background: "#FFFFFF",
            border: "2px solid #FFE3B3",
            borderRadius: 999,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 14,
            color: "#2B2118",
            textDecoration: "none",
          }}
        >
          ← العودة للفريق
        </Link>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <Link
          href={`/t/${teamId}/admin/users`}
          style={tabStyle(pathname === `/t/${teamId}/admin/users`)}
        >
          👥 الأعضاء
        </Link>
        <Link
          href={`/t/${teamId}/admin/tasks`}
          style={tabStyle(pathname === `/t/${teamId}/admin/tasks`)}
        >
          📋 تقييمات المهام
        </Link>
      </div>

      {children}
    </div>
  );
}
