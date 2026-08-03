"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CATEGORY_ICONS,
  FREQ_LABELS,
  WEEKDAY_LABELS,
  type RecurringFreq,
} from "@/lib/format";
import type { RecurringDTO } from "@/lib/team";

export type Draft = {
  title: string;
  desc: string;
  category: string;
  freq: RecurringFreq;
  weekdays: number[];
  monthDay: number;
  hour: number;
  minute: number;
};

const emptyDraft: Draft = {
  title: "",
  desc: "",
  category: "تصميم",
  freq: "daily",
  weekdays: [new Date().getDay()],
  monthDay: 1,
  hour: 9,
  minute: 0,
};

type Props = {
  rules: RecurringDTO[];
  busy: boolean;
  onClose: () => void;
  onCreate: (draft: Draft) => void;
  onUpdate: (id: string, draft: Draft) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onRunNow: (id: string) => void;
};

const label = { fontWeight: 700, fontSize: 14.5, color: "#2B2118" } as const;
const field = {
  fontSize: 15,
  fontWeight: 600,
  color: "#2B2118",
  background: "#FFF7EC",
  border: "2px solid #FFE3B3",
  borderRadius: 14,
  padding: "11px 14px",
  outline: "none",
  fontFamily: "inherit",
} as const;

function pill(on: boolean) {
  return {
    padding: "6px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: on ? 700 : 600,
    fontSize: 13.5,
    background: on ? "#FF6B57" : "#FFF7EC",
    color: on ? "#FFF" : "#7A6A55",
    border: `2px solid ${on ? "#FF6B57" : "#FFE3B3"}`,
    boxShadow: on ? "0 3px 0 #E04B38" : "none",
    fontFamily: "inherit",
  } as const;
}

export function scheduleLabel(r: {
  freq: string;
  weekdays: number[];
  monthDay: number;
  hour: number;
  minute: number;
}) {
  const time = `${String(r.hour).padStart(2, "0")}:${String(r.minute).padStart(2, "0")}`;
  if (r.freq === "weekly") {
    const days = r.weekdays.map((d) => WEEKDAY_LABELS[d]).join("، ");
    return `كل ${days || "—"} · ${time}`;
  }
  if (r.freq === "monthly") return `يوم ${r.monthDay} من كل شهر · ${time}`;
  return `كل يوم · ${time}`;
}

function nextDueLabel(iso: string | null) {
  if (!iso) return "غير مجدولة";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (sameDay) return `القادمة: اليوم ${time}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `القادمة: غدًا ${time}`;
  return `القادمة: ${d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" })} ${time}`;
}

export function RecurringModal({
  rules,
  busy,
  onClose,
  onCreate,
  onUpdate,
  onToggle,
  onDelete,
  onRunNow,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(rules.length === 0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function startEdit(r: RecurringDTO) {
    setEditingId(r.id);
    setDraft({
      title: r.title,
      desc: r.desc,
      category: r.category,
      freq: r.freq,
      weekdays: r.weekdays.length ? r.weekdays : [new Date().getDay()],
      monthDay: r.monthDay,
      hour: r.hour,
      minute: r.minute,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowForm(false);
  }

  function submit() {
    if (editingId) onUpdate(editingId, draft);
    else onCreate(draft);
    resetForm();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,33,24,0.45)",
        zIndex: 40,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFF",
          border: "2px solid #FFE3B3",
          borderRadius: 22,
          padding: "24px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: 560,
          maxWidth: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          boxSizing: "border-box",
          animation: "pop .25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: "#8B5CF6",
              display: "grid",
              placeItems: "center",
              color: "#FFF",
              fontSize: 21,
              transform: "rotate(-6deg)",
              boxShadow: "0 3px 0 #6D42C9",
            }}
          >
            🔁
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 21, color: "#2B2118" }}>
              المهام المتكررة
            </div>
            <div style={{ fontSize: 13.5, color: "#9A8A73", fontWeight: 500 }}>
              تُنشأ تلقائيًا في موعدها — لا حاجة لكتابتها كل مرة
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginInlineStart: "auto",
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "#FFEFD6",
              color: "#9A8A73",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              fontFamily: "inherit",
            }}
          >
            ✕
          </button>
        </div>

        {rules.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rules.map((r) => (
              <div
                key={r.id}
                style={{
                  background: r.active ? "#FFFBF3" : "#F6F2EA",
                  border: `2px solid ${r.active ? "#FFE3B3" : "#E4DCCB"}`,
                  borderRadius: 16,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  opacity: r.active ? 1 : 0.7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[r.category] || "📌"}</span>
                  <span
                    dir="auto"
                    style={{
                      fontWeight: 700,
                      fontSize: 15.5,
                      color: "#2B2118",
                      flex: 1,
                      minWidth: 140,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {r.title}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: r.active ? "#0E8A7D" : "#9A8A73",
                      background: r.active ? "#E8FBF4" : "#EFEAE0",
                      borderRadius: 999,
                      padding: "3px 10px",
                    }}
                  >
                    {r.active ? nextDueLabel(r.nextDueAt) : "متوقّفة"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#9A8A73", fontWeight: 600 }}>
                  {FREQ_LABELS[r.freq]} · {scheduleLabel(r)}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRunNow(r.id)}
                    style={{
                      background: "#1FB6A6",
                      color: "#FFF",
                      fontWeight: 700,
                      fontSize: 12.5,
                      padding: "5px 13px",
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ▶ شغّلها الآن
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startEdit(r)}
                    style={{
                      background: "#FFF",
                      color: "#B87A00",
                      fontWeight: 700,
                      fontSize: 12.5,
                      padding: "5px 13px",
                      borderRadius: 999,
                      border: "2px solid #F2C94C",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    تعديل ✏️
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onToggle(r.id, !r.active)}
                    style={{
                      background: "#FFF",
                      color: "#5B3FA8",
                      fontWeight: 700,
                      fontSize: 12.5,
                      padding: "5px 13px",
                      borderRadius: 999,
                      border: "2px solid #C9B8F5",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {r.active ? "إيقاف مؤقّت ⏸" : "استئناف ▶"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(r.id)}
                    style={{
                      marginInlineStart: "auto",
                      background: "#FFF",
                      color: "#E0473C",
                      fontWeight: 700,
                      fontSize: 12.5,
                      padding: "5px 13px",
                      borderRadius: 999,
                      border: "2px solid #FFC9C2",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    حذف 🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!showForm ? (
          <button
            type="button"
            onClick={() => {
              setDraft(emptyDraft);
              setEditingId(null);
              setShowForm(true);
            }}
            style={{
              background: "#FFF7EC",
              color: "#7A6A55",
              fontWeight: 700,
              fontSize: 14.5,
              padding: 11,
              borderRadius: 14,
              border: "2px dashed #FFE3B3",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + مهمة متكررة جديدة
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              borderTop: rules.length ? "2px solid #FFEFD6" : "none",
              paddingTop: rules.length ? 16 : 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={label}>عنوان المهمة</label>
              <input
                dir="auto"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="مثال: تقرير المبيعات اليومي"
                style={field}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={label}>وصف المهمة</label>
              <textarea
                value={draft.desc}
                onChange={(e) => set("desc", e.target.value)}
                rows={2}
                placeholder="اختياري"
                style={{ ...field, resize: "none", fontWeight: 500 }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={label}>التصنيف</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("category", c)}
                    style={pill(draft.category === c)}
                  >
                    {CATEGORY_ICONS[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={label}>التكرار</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["daily", "weekly", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set("freq", f)}
                    style={pill(draft.freq === f)}
                  >
                    {FREQ_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {draft.freq === "weekly" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={label}>أيام الأسبوع</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {WEEKDAY_LABELS.map((name, i) => {
                    const on = draft.weekdays.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          set(
                            "weekdays",
                            on
                              ? draft.weekdays.filter((d) => d !== i)
                              : [...draft.weekdays, i].sort((a, b) => a - b),
                          )
                        }
                        style={pill(on)}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {draft.freq === "monthly" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={label}>يوم الشهر</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={draft.monthDay}
                  onChange={(e) =>
                    set("monthDay", Math.min(31, Math.max(1, Number(e.target.value) || 1)))
                  }
                  style={{ ...field, width: 110 }}
                />
                <div style={{ fontSize: 12.5, color: "#9A8A73", fontWeight: 600 }}>
                  في الأشهر الأقصر تُنشأ في آخر يوم من الشهر
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={label}>وقت الإنشاء</label>
              <input
                type="time"
                value={`${String(draft.hour).padStart(2, "0")}:${String(draft.minute).padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":");
                  set("hour", Number(h) || 0);
                  set("minute", Number(m) || 0);
                }}
                style={{ ...field, width: 150 }}
              />
              <div style={{ fontSize: 12.5, color: "#9A8A73", fontWeight: 600 }}>
                تظهر المهمة على اللوحة عند فتحها بعد هذا الوقت
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                style={{
                  flex: 1,
                  background: "#8B5CF6",
                  color: "#FFF",
                  fontWeight: 800,
                  fontSize: 15.5,
                  padding: 12,
                  borderRadius: 999,
                  boxShadow: "0 3px 0 #6D42C9",
                  cursor: "pointer",
                  border: "none",
                  fontFamily: "inherit",
                }}
              >
                {editingId ? "💾 حفظ التعديل" : "🔁 حفظ المهمة المتكررة"}
              </button>
              {rules.length > 0 ? (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: "#FFF7EC",
                    color: "#7A6A55",
                    fontWeight: 700,
                    fontSize: 14.5,
                    padding: "12px 20px",
                    borderRadius: 999,
                    border: "2px solid #FFE3B3",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  إلغاء
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
