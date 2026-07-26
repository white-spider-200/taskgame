export function fmtTimer(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export function fmtDur(ms: number) {
  const total = Math.floor(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}س ${m}د` : `${m}د`;
}

export function starsStr(n: number) {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export const RATING_LABELS = [
  "",
  "يحتاج تحسين",
  "مقبول",
  "جيد 👍",
  "ممتاز! 👏",
  "أسطوري! 🤩",
] as const;

export const CATEGORIES = ["تصميم", "مبيعات", "تطوير", "إداري"] as const;
export const CATEGORY_ICONS: Record<string, string> = {
  تصميم: "🎨",
  مبيعات: "📈",
  تطوير: "💻",
  إداري: "📝",
};

export const USER_COLORS = [
  "#1FB6A6",
  "#FF9F43",
  "#8B5CF6",
  "#FF6B57",
  "#3D9BE9",
  "#E91E8C",
];

export function dateKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA");
}

const DAY_LABEL_FMT = new Intl.DateTimeFormat("ar", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function dayLabel(key: string) {
  const today = new Date();
  const todayKey = today.toLocaleDateString("en-CA");
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toLocaleDateString("en-CA");
  if (key === todayKey) return "اليوم";
  if (key === yesterdayKey) return "أمس";
  const [y, m, d] = key.split("-").map(Number);
  return DAY_LABEL_FMT.format(new Date(y!, m! - 1, d!));
}

export function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABEL_FMT = new Intl.DateTimeFormat("ar", {
  month: "long",
  year: "numeric",
});

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return MONTH_LABEL_FMT.format(new Date(y!, m! - 1, 1));
}

export function initialFromName(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]! : "?";
}
