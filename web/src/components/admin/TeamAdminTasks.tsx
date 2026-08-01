"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { starsStr } from "@/lib/format";
import type { AdminMemberDTO, AdminTaskDTO } from "@/lib/admin";

const STATUS_LABELS: Record<string, string> = {
  running: "قيد التنفيذ",
  review: "بانتظار التقييم",
  done: "مكتملة",
  expired: "منتهية الصلاحية",
};

const SORT_OPTIONS = [
  ["newest", "الأحدث أولًا"],
  ["lowest", "الأقل تقييمًا أولًا"],
  ["highest", "الأعلى تقييمًا أولًا"],
] as const;
type SortOption = (typeof SORT_OPTIONS)[number][0];

export function TeamAdminTasks({
  tasks,
  members,
}: {
  tasks: AdminTaskDTO[];
  members: AdminMemberDTO[];
}) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const categories = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category))),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      if (memberFilter !== "all" && t.ownerId !== memberFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.ownerName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    if (sort === "lowest") {
      return [...filtered].sort((a, b) => (a.avgStars ?? -1) - (b.avgStars ?? -1));
    }
    if (sort === "highest") {
      return [...filtered].sort((a, b) => (b.avgStars ?? -1) - (a.avgStars ?? -1));
    }
    return filtered;
  }, [tasks, search, memberFilter, categoryFilter, statusFilter, sort]);

  return (
    <section>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>
        تقييمات المهام ({filteredTasks.length} من {tasks.length})
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بعنوان المهمة أو اسم العضو..."
          style={{
            flex: "1 1 220px",
            minWidth: 200,
            padding: "8px 14px",
            borderRadius: 999,
            border: "2px solid #FFE3B3",
            fontFamily: "inherit",
            fontSize: 13,
            background: "#FFFFFF",
            color: "#2B2118",
          }}
        />

        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "2px solid #FFE3B3",
            fontFamily: "inherit",
            fontSize: 13,
            background: "#FFFFFF",
            color: "#2B2118",
          }}
        >
          <option value="all">كل الأعضاء</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "2px solid #FFE3B3",
            fontFamily: "inherit",
            fontSize: 13,
            background: "#FFFFFF",
            color: "#2B2118",
          }}
        >
          <option value="all">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "2px solid #FFE3B3",
            fontFamily: "inherit",
            fontSize: 13,
            background: "#FFFFFF",
            color: "#2B2118",
          }}
        >
          <option value="all">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "2px solid #FFE3B3",
            fontFamily: "inherit",
            fontSize: 13,
            background: "#FFFFFF",
            color: "#2B2118",
          }}
        >
          {SORT_OPTIONS.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredTasks.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9A8A73", padding: "8px 4px" }}>
            لا توجد مهام مطابقة
          </div>
        ) : null}
        {filteredTasks.map((t) => {
          const open = openTaskId === t.id;
          return (
            <div
              key={t.id}
              style={{
                background: "#FFFFFF",
                border: "2px solid #FFE3B3",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenTaskId(open ? null : t.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "#9A8A73" }}>
                    {t.ownerName} · {t.category} · {STATUS_LABELS[t.status] ?? t.status}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#7A5A00", fontWeight: 700 }}>
                  {t.avgStars != null
                    ? `${starsStr(Math.round(t.avgStars))} (${t.avgStars.toFixed(1)})`
                    : "بدون تقييم"}
                </div>
                <div style={{ fontSize: 12, color: "#9A8A73" }}>
                  {t.ratings.length} تقييم
                </div>
                <span style={{ color: "#9A8A73" }}>{open ? "▲" : "▼"}</span>
              </button>

              {open ? (
                <div
                  style={{
                    borderTop: "2px solid #FFE3B3",
                    padding: "10px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {t.ratings.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#9A8A73" }}>
                      لا توجد تقييمات بعد
                    </div>
                  ) : (
                    t.ratings.map((r) => (
                      <div
                        key={r.raterId}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <Avatar
                          url={r.raterAvatarUrl}
                          initial={r.raterInitial}
                          color={r.raterColor}
                          size={26}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {r.raterName}
                        </span>
                        <span style={{ marginInlineStart: "auto", color: "#7A5A00" }}>
                          {starsStr(r.stars)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
