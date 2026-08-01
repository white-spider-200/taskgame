"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createTaskAction, deleteTaskAction, rateTaskAction } from "@/app/actions";
import { dateKey, fmtDur, monthKey, monthLabel } from "@/lib/format";
import { playNotificationSound, playToastSound, type ToastSoundType } from "@/lib/sound";
import { pointsForMember, type TeamPayload, type TaskDTO } from "@/lib/team";
import { CreateTaskModal } from "./playground/CreateTaskModal";
import { DashboardView } from "./playground/DashboardView";
import { HistoryView } from "./playground/HistoryView";
import { LeadersView } from "./playground/LeadersView";
import { PlaygroundNav } from "./playground/PlaygroundNav";
import { ProfileView } from "./playground/ProfileView";
import { ReportView } from "./playground/ReportView";
import { TasksView } from "./playground/TasksView";
import { Toast } from "./playground/Toast";
import type { Filter, View } from "./playground/types";

export function Playground({ initial }: { initial: TeamPayload }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [view, setView] = useState<View>("tasks");
  const [viewMemberId, setViewMemberId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("run");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState<string>("تصميم");
  const [titleError, setTitleError] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const myId = data.me.id;
    const justSubmitted = initial.tasks.some((t) => {
      if (t.ownerId === myId) return false;
      const prev = data.tasks.find((p) => p.id === t.id);
      return prev?.status === "running" && t.status === "review";
    });
    if (justSubmitted) playNotificationSound();
    setData(initial);
  }, [initial]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [router]);

  function showToast(msg: string, sound: ToastSoundType = "success") {
    setToast(msg);
    playToastSound(sound);
    window.setTimeout(() => setToast(""), 2600);
  }

  const me = data.me;
  const members = data.members;
  const tasks = data.tasks;

  const memberMap = useMemo(() => {
    const m = new Map(members.map((u) => [u.id, u]));
    return m;
  }, [members]);

  const myPoints = pointsForMember(me, tasks);

  const todayKey = dateKey(new Date().toISOString());
  const isToday = (t: TaskDTO) =>
    t.completedAt != null && dateKey(t.completedAt) === todayKey;

  // All-time completed tasks — feeds the archive and the all-time points leaderboard.
  const doneTasks = tasks.filter((t) => t.status === "done");
  // Tasks still running/in-review past their start day are swept server-side to
  // "expired" and archived — they never show back up on the live board.
  const expiredTasks = tasks.filter((t) => t.status === "expired");
  const archivedTasks = [...doneTasks, ...expiredTasks];
  // Today-only view of the board: active work plus whatever finished today.
  // Anything finished on a previous day rolls off into the archive so each day starts fresh.
  const todayTasks = tasks.filter(
    (t) => t.status === "running" || t.status === "review" || isToday(t),
  );
  const todayDoneTasks = todayTasks.filter((t) => t.status === "done");

  const runCount = tasks.filter((t) => t.status === "running").length;
  const revCount = tasks.filter(
    (t) =>
      (t.status === "review" || t.status === "done") &&
      t.ownerId !== me.id &&
      t.myRating == null,
  ).length;
  const teamAvg = todayDoneTasks.length
    ? (
        todayDoneTasks.reduce((a, t) => a + (t.stars || 0), 0) /
        todayDoneTasks.length
      ).toFixed(1)
    : "—";
  const donePct =
    Math.round(
      (todayDoneTasks.length / Math.max(1, todayTasks.length)) * 100,
    ) + "%";

  // Today-scoped: powers the dashboard's "who did what" panel — resets daily.
  const todayStats = members.map((u) => {
    const mine = todayDoneTasks.filter((t) => t.ownerId === u.id);
    const avg = mine.length
      ? (mine.reduce((a, t) => a + (t.stars || 0), 0) / mine.length).toFixed(1)
      : "—";
    const avgTime = mine.length
      ? mine.reduce((a, t) => a + (t.elapsedMs || 0), 0) / mine.length
      : Infinity;
    const pts = mine.reduce((a, t) => a + Math.round((t.stars || 0) * 2), 0);
    return {
      ...u,
      count: mine.length,
      avg,
      avgTime,
      pts,
    };
  });

  const maxCount = Math.max(1, ...todayStats.map((m) => m.count));
  const memberStats = [...todayStats]
    .sort((a, b) => b.count - a.count)
    .map((m) => ({
      ...m,
      pct: Math.round((m.count / maxCount) * 100) + "%",
    }));
  const fastest =
    todayStats
      .filter((m) => m.count > 0)
      .sort((a, b) => a.avgTime - b.avgTime)[0] || todayStats[0];

  const sorted = [...todayStats].sort((a, b) => b.pts - a.pts);
  const rankColors = ["#F2C94C", "#C9C0B4", "#D8956B"];
  const miniLeaders = sorted.slice(0, 3).map((m, i) => ({
    rank: i + 1,
    name: m.id === me.id ? "أنت" : m.name,
    pts: m.pts,
    rankColor: rankColors[i]!,
  }));
  const leaderRows = sorted.map((m, i) => ({
    id: m.id,
    rank: i + 1,
    name: m.id === me.id ? `${m.name} (أنت)` : m.name,
    initial: m.initial,
    color: m.color,
    avatarUrl: m.avatarUrl,
    tasks: m.count,
    avg: m.avg,
    pts: m.pts,
    bg: m.id === me.id ? "#FFFBF0" : "#FFFFFF",
  }));

  // Month-scoped: powers "موظف الشهر" — total points among tasks finished this month.
  const currentMonthKey = monthKey(new Date().toISOString());
  const monthDoneTasks = doneTasks.filter(
    (t) => t.completedAt != null && monthKey(t.completedAt) === currentMonthKey,
  );
  const monthStats = members
    .map((u) => {
      const mine = monthDoneTasks.filter((t) => t.ownerId === u.id);
      const pts = mine.reduce(
        (a, t) => a + (t.stars ? Math.round(t.stars * 2) : 0),
        0,
      );
      return { ...u, count: mine.length, pts };
    })
    .sort((a, b) => b.pts - a.pts);

  const employeeOfMonth =
    monthStats[0] && monthStats[0].pts > 0
      ? {
          name: monthStats[0].id === me.id ? "أنت" : monthStats[0].name,
          initial: monthStats[0].initial,
          color: monthStats[0].color,
          avatarUrl: monthStats[0].avatarUrl,
          monthLabel: monthLabel(currentMonthKey),
          tasks: monthStats[0].count,
          pts: monthStats[0].pts,
        }
      : undefined;

  function statsForMember(id: string) {
    const person = memberMap.get(id) ?? me;
    const personDoneTasks = doneTasks.filter((t) => t.ownerId === id);
    const personRecentTasks = tasks.filter(
      (t) => t.ownerId === id && (t.status === "done" || t.status === "review"),
    );
    const personAvg = personDoneTasks.length
      ? (
          personDoneTasks.reduce((a, t) => a + (t.stars || 0), 0) /
          personDoneTasks.length
        ).toFixed(1)
      : "—";
    const personTime = personDoneTasks.length
      ? fmtDur(
          personDoneTasks.reduce((a, t) => a + (t.elapsedMs || 0), 0) /
            personDoneTasks.length,
        )
      : "—";
    return {
      member: person,
      points: pointsForMember(person, tasks),
      doneTasks: personDoneTasks,
      recentTasks: personRecentTasks,
      avg: personAvg,
      time: personTime,
    };
  }

  const profileMemberId = viewMemberId ?? me.id;
  const profileStats = statsForMember(profileMemberId);

  function onViewChange(v: View) {
    setViewMemberId(null);
    setView(v);
  }

  function onSelectMember(id: string) {
    setViewMemberId(id);
    setView("profile");
  }

  const visibleTasks = tasks.filter((t) => {
    if (filter === "run")
      return (
        t.status === "running" ||
        (t.status === "review" && t.ownerId === me.id)
      );
    if (filter === "rev")
      return (
        (t.status === "review" || t.status === "done") &&
        t.ownerId !== me.id &&
        t.myRating == null
      );
    return (
      t.status === "done" &&
      isToday(t) &&
      (t.ownerId === me.id || t.myRating != null)
    );
  });

  void tick;

  function taskMeta(t: TaskDTO) {
    const u = memberMap.get(t.ownerId);
    const name = u?.name ?? "؟";
    if (t.status === "running") return `${name} · جارٍ التنفيذ`;
    if (t.status === "review")
      return `${name} · أنهاها في ${fmtDur(t.elapsedMs || 0)}`;
    const raters =
      t.ratingsCount === 1 ? "شخص واحد" : `${t.ratingsCount} أشخاص`;
    return `${name} · ${fmtDur(t.elapsedMs || 0)} · قيّمه ${raters}`;
  }

  function onRate(id: string) {
    const task = tasks.find((t) => t.id === id);
    const stars = ratings[id] || task?.myRating || 0;
    if (!stars) {
      showToast("اختر عدد النجوم أولًا ⭐", "error");
      return;
    }
    startTransition(async () => {
      const res = await rateTaskAction(id, stars);
      if (!res || !("ok" in res) || !res.ok) {
        showToast(res?.error || "تعذّر إرسال التقييم", "error");
        return;
      }
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "done",
                stars: res.stars,
                ratingsCount: res.count,
                myRating: stars,
              }
            : t,
        ),
      }));
      showToast(`⭐ تم إرسال تقييمك (${stars} نجوم)`, "rated");
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteTaskAction(id);
      if (res?.error) {
        showToast(res.error, "error");
        return;
      }
      setData((d) => ({
        ...d,
        tasks: d.tasks.filter((t) => t.id !== id),
      }));
      showToast("🗑 تم حذف المهمة");
      router.refresh();
    });
  }

  function onCreate() {
    const title = formTitle.trim();
    if (!title) {
      setTitleError(true);
      showToast("اكتب عنوان المهمة أولًا ✏️", "error");
      return;
    }
    startTransition(async () => {
      const res = await createTaskAction({
        teamId: data.team.id,
        title,
        desc: formDesc,
        category: formCat,
      });
      if (res?.error) {
        showToast(res.error, "error");
        return;
      }
      setModalOpen(false);
      setFormTitle("");
      setFormDesc("");
      setTitleError(false);
      setFilter("run");
      showToast("▶ بدأ المؤقّت — بالتوفيق!", "created");
      router.refresh();
    });
  }

  const p1 = sorted[0];
  const p2 = sorted[1];
  const p3 = sorted[2];

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#FFF7EC",
      }}
    >
      <PlaygroundNav
        teamId={data.team.id}
        teamName={data.team.name}
        myPoints={myPoints}
        me={me}
        view={view}
        onViewChange={onViewChange}
      />

      <Toast message={toast} />

      {view === "tasks" ? (
        <TasksView
          teamId={data.team.id}
          tasks={todayTasks}
          visibleTasks={visibleTasks}
          doneTasks={todayDoneTasks}
          donePct={donePct}
          inviteCode={data.team.inviteCode}
          me={me}
          memberMap={memberMap}
          filter={filter}
          onFilterChange={setFilter}
          onOpenModal={() => setModalOpen(true)}
          miniLeaders={miniLeaders}
          taskMeta={taskMeta}
          ratings={ratings}
          onSetRating={(taskId, stars) =>
            setRatings((r) => ({ ...r, [taskId]: stars }))
          }
          onRate={onRate}
          onDelete={onDelete}
        />
      ) : null}

      {view === "dash" ? (
        <DashboardView
          doneTasksCount={todayDoneTasks.length}
          runCount={runCount}
          revCount={revCount}
          teamAvg={teamAvg}
          donePct={donePct}
          memberStats={memberStats}
          fastest={fastest}
        />
      ) : null}

      {view === "leaders" ? (
        <LeadersView
          p1={p1}
          p2={p2}
          p3={p3}
          leaderRows={leaderRows}
          employeeOfMonth={employeeOfMonth}
          onSelectMember={onSelectMember}
        />
      ) : null}

      {view === "history" ? (
        <HistoryView tasks={archivedTasks} memberMap={memberMap} />
      ) : null}

      {view === "report" ? (
        <ReportView teamName={data.team.name} tasks={archivedTasks} members={members} />
      ) : null}

      {view === "profile" ? (
        <ProfileView
          key={profileMemberId}
          teamId={data.team.id}
          member={profileStats.member}
          isMe={profileMemberId === me.id}
          teamName={data.team.name}
          points={profileStats.points}
          doneTasks={profileStats.doneTasks}
          recentTasks={profileStats.recentTasks}
          avg={profileStats.avg}
          time={profileStats.time}
          onBack={
            viewMemberId
              ? () => {
                  setViewMemberId(null);
                  setView("leaders");
                }
              : undefined
          }
        />
      ) : null}

      {modalOpen ? (
        <CreateTaskModal
          formTitle={formTitle}
          formDesc={formDesc}
          formCat={formCat}
          titleError={titleError}
          onTitleChange={setFormTitle}
          onDescChange={setFormDesc}
          onCatChange={setFormCat}
          onClearTitleError={() => setTitleError(false)}
          onClose={() => {
            setModalOpen(false);
            setTitleError(false);
          }}
          onCreate={onCreate}
        />
      ) : null}
    </div>
  );
}
