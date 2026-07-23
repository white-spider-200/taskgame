import { CATEGORIES, CATEGORY_ICONS } from "@/lib/format";

type Props = {
  formTitle: string;
  formDesc: string;
  formCat: string;
  titleError: boolean;
  onTitleChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onCatChange: (v: string) => void;
  onClearTitleError: () => void;
  onClose: () => void;
  onCreate: () => void;
};

export function CreateTaskModal({
  formTitle,
  formDesc,
  formCat,
  titleError,
  onTitleChange,
  onDescChange,
  onCatChange,
  onClearTitleError,
  onClose,
  onCreate,
}: Props) {
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
              padding: "26px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: 520,
              maxWidth: "100%",
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
                  background: "#FF6B57",
                  display: "grid",
                  placeItems: "center",
                  color: "#FFF",
                  fontSize: 22,
                  transform: "rotate(-6deg)",
                  boxShadow: "0 3px 0 #E04B38",
                }}
              >
                ✏️
              </div>
              <div>
                <div
                  style={{ fontWeight: 800, fontSize: 21, color: "#2B2118" }}
                >
                  مهمة جديدة
                </div>
                <div
                  style={{ fontSize: 13.5, color: "#9A8A73", fontWeight: 500 }}
                >
                  يبدأ المؤقّت تلقائيًا عند بدء التنفيذ
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
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontWeight: 700, fontSize: 14.5, color: "#2B2118" }}
              >
                عنوان المهمة
              </label>
              <input
                value={formTitle}
                onChange={(e) => {
                  onTitleChange(e.target.value);
                  onClearTitleError();
                }}
                placeholder="مثال: تجهيز عرض العميل"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#2B2118",
                  background: "#FFF7EC",
                  border: `2px solid ${titleError ? "#FF6B57" : "#FFE3B3"}`,
                  borderRadius: 14,
                  padding: "12px 16px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontWeight: 700, fontSize: 14.5, color: "#2B2118" }}
              >
                وصف المهمة
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => onDescChange(e.target.value)}
                rows={3}
                placeholder="اشرح المطلوب حتى يقيّمك زميلك بعدل ⭐"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#2B2118",
                  background: "#FFF7EC",
                  border: "2px solid #FFE3B3",
                  borderRadius: 14,
                  padding: "12px 16px",
                  outline: "none",
                  resize: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{ fontWeight: 700, fontSize: 14.5, color: "#2B2118" }}
              >
                التصنيف
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES.map((c) => {
                  const sel = formCat === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onCatChange(c)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontWeight: sel ? 700 : 600,
                        fontSize: 14,
                        background: sel ? "#FF6B57" : "#FFF7EC",
                        color: sel ? "#FFF" : "#7A6A55",
                        border: sel
                          ? "2px solid #FF6B57"
                          : "2px solid #FFE3B3",
                        boxShadow: sel ? "0 3px 0 #E04B38" : "none",
                        fontFamily: "inherit",
                      }}
                    >
                      {CATEGORY_ICONS[c]} {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <button
                type="button"
                onClick={onCreate}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#1FB6A6",
                  color: "#FFF",
                  fontWeight: 800,
                  fontSize: 16,
                  padding: 13,
                  borderRadius: 999,
                  boxShadow: "0 3px 0 #148F82",
                  cursor: "pointer",
                  border: "none",
                  fontFamily: "inherit",
                }}
              >
                ▶ إنشاء وبدء المؤقّت
              </button>
            </div>
          </div>
        </div>
      );
}
