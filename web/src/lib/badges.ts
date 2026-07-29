import { dateKey } from "./format";
import type { TaskDTO } from "./team";

export type BadgeDef = {
  id: string;
  icon: string;
  label: string;
  bg: string;
  border: string;
  rot: number;
  earned: boolean;
};

const FAST_MS = 10 * 60 * 1000;

function shiftDay(key: string, delta: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

// Longest run of consecutive days containing at least one done task —
// tracked as a lifetime best so a badge, once earned, stays earned.
function longestStreak(days: Set<string>) {
  let best = 0;
  for (const day of days) {
    if (days.has(shiftDay(day, -1))) continue;
    let len = 1;
    let cur = day;
    while (days.has(shiftDay(cur, 1))) {
      cur = shiftDay(cur, 1);
      len++;
    }
    best = Math.max(best, len);
  }
  return best;
}

// `doneTasks` must already be filtered to this member's status==="done" tasks.
export function computeBadges(doneTasks: TaskDTO[]): BadgeDef[] {
  const myDone = doneTasks;
  const doneCount = myDone.length;
  const fiveStarCount = myDone.filter((t) => Math.round(t.stars || 0) === 5).length;
  const ratedTasks = myDone.filter((t) => t.stars != null);
  const avgStars = ratedTasks.length
    ? ratedTasks.reduce((a, t) => a + (t.stars || 0), 0) / ratedTasks.length
    : 0;
  const fastCount = myDone.filter(
    (t) => t.elapsedMs != null && t.elapsedMs <= FAST_MS,
  ).length;
  const days = new Set(
    myDone.filter((t) => t.completedAt).map((t) => dateKey(t.completedAt!)),
  );
  const streak = longestStreak(days);

  return [
    {
      id: "first-task",
      icon: "🏅",
      label: "أول مهمة",
      bg: "#F0EDE6",
      border: "#C9C0B4",
      rot: 0,
      earned: doneCount >= 1,
    },
    {
      id: "ten-tasks",
      icon: "🎯",
      label: "10 مهام",
      bg: "#E8FBF4",
      border: "#1FB6A6",
      rot: -4,
      earned: doneCount >= 10,
    },
    {
      id: "fifty-tasks",
      icon: "👑",
      label: "50 مهمة",
      bg: "#FFF4E0",
      border: "#F2A93B",
      rot: 3,
      earned: doneCount >= 50,
    },
    {
      id: "hundred-tasks",
      icon: "💯",
      label: "100 مهمة",
      bg: "#FFE9E5",
      border: "#FF6B57",
      rot: 0,
      earned: doneCount >= 100,
    },
    {
      id: "five-star-x10",
      icon: "🌟",
      label: "تقييم 5 نجوم ×10",
      bg: "#F7F3FF",
      border: "#C9B8F5",
      rot: -3,
      earned: fiveStarCount >= 10,
    },
    {
      id: "team-star",
      icon: "💎",
      label: "نجم الفريق",
      bg: "#E7F3FF",
      border: "#3D9BE9",
      rot: 4,
      earned: ratedTasks.length >= 5 && avgStars >= 4.5,
    },
    {
      id: "streak-7",
      icon: "🔥",
      label: "7 أيام متتالية",
      bg: "#FFE9A8",
      border: "#F2C94C",
      rot: 4,
      earned: streak >= 7,
    },
    {
      id: "speed-5",
      icon: "⚡",
      label: "أسرع منجز ×5",
      bg: "#FFE9A8",
      border: "#F2C94C",
      rot: -5,
      earned: fastCount >= 5,
    },
  ];
}
