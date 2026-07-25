"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createTaskAction, rateTaskAction } from "@/app/actions";
import { fmtDur } from "@/lib/format";
import { playNotificationSound, playToastSound, type ToastSoundType } from "@/lib/sound";
import { pointsForMember, type TeamPayload, type TaskDTO } from "@/lib/team";
import { CreateTaskModal } from "./playground/CreateTaskModal";
import { DashboardView } from "./playground/DashboardView";
import { LeadersView } from "./playground/LeadersView";
import { PlaygroundNav } from "./playground/PlaygroundNav";
import { ProfileView } from "./playground/ProfileView";
import { TasksView } from "./playground/TasksView";
import { Toast } from "./playground/Toast";
import type { Filter, View } from "./playground/types";

export function Playground({ initial }: { initial: TeamPayload }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [view, setView] = useState<View>("tasks");
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

  const doneTasks = tasks.filter((t) => t.status === "done");
  const runCount = tasks.filter((t) => t.status === "running").length;
  const revCount = tasks.filter(
    (t) => t.status !== "running" && t.ownerId !== me.id && t.myRating == null,
  ).length;
  const teamAvg = doneTasks.length
    ? (
        doneTasks.reduce((a, t) => a + (t.stars || 0), 0) / doneTasks.length
      ).toFixed(1)
    : "—";
  const donePct =
    Math.round((doneTasks.length / Math.max(1, tasks.length)) * 100) + "%";

  const stats = members.map((u) => {
    const mine = doneTasks.filter((t) => t.ownerId === u.id);
    const avg = mine.length
      ? (mine.reduce((a, t) => a + (t.stars || 0), 0) / mine.length).toFixed(1)
      : "—";
    const avgTime = mine.length
      ? mine.reduce((a, t) => a + (t.elapsedMs || 0), 0) / mine.length
      : Infinity;
    return {
      ...u,
      count: mine.length,
      avg,
      avgTime,
      pts: pointsForMember(u, tasks),
    };
  });

  const maxCount = Math.max(1, ...stats.map((m) => m.count));
  const memberStats = [...stats]
    .sort((a, b) => b.count - a.count)
    .map((m) => ({
      ...m,
      pct: Math.round((m.count / maxCount) * 100) + "%",
    }));
  const fastest =
    stats.filter((m) => m.count > 0).sort((a, b) => a.avgTime - b.avgTime)[0] ||
    stats[0];
  const sorted = [...stats].sort((a, b) => b.pts - a.pts);
  const rankColors = ["#F2C94C", "#C9C0B4", "#D8956B"];
  const miniLeaders = sorted.slice(0, 3).map((m, i) => ({
    rank: i + 1,
    name: m.id === me.id ? "أنت" : m.name,
    pts: m.pts,
    rankColor: rankColors[i]!,
  }));
  const leaderRows = sorted.map((m, i) => ({
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

  const myDoneTasks = doneTasks.filter((t) => t.ownerId === me.id);
  const myAvg = myDoneTasks.length
    ? (
        myDoneTasks.reduce((a, t) => a + (t.stars || 0), 0) / myDoneTasks.length
      ).toFixed(1)
    : "—";
  const myTime = myDoneTasks.length
    ? fmtDur(
        myDoneTasks.reduce((a, t) => a + (t.elapsedMs || 0), 0) /
          myDoneTasks.length,
      )
    : "—";

  const visibleTasks = tasks.filter((t) => {
    if (filter === "run") return t.status === "running";
    if (filter === "rev")
      return t.status !== "running" && t.ownerId !== me.id && t.myRating == null;
    return t.status === "done";
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
        teamName={data.team.name}
        myPoints={myPoints}
        me={me}
        view={view}
        onViewChange={setView}
      />

      <Toast message={toast} />

      {view === "tasks" ? (
        <TasksView
          teamId={data.team.id}
          tasks={tasks}
          visibleTasks={visibleTasks}
          doneTasks={doneTasks}
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
        />
      ) : null}

      {view === "dash" ? (
        <DashboardView
          doneTasksCount={doneTasks.length}
          runCount={runCount}
          revCount={revCount}
          teamAvg={teamAvg}
          donePct={donePct}
          memberStats={memberStats}
          fastest={fastest}
        />
      ) : null}

      {view === "leaders" ? (
        <LeadersView p1={p1} p2={p2} p3={p3} leaderRows={leaderRows} />
      ) : null}

      {view === "profile" ? (
        <ProfileView
          me={me}
          teamName={data.team.name}
          myPoints={myPoints}
          myDoneTasks={myDoneTasks}
          myAvg={myAvg}
          myTime={myTime}
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
