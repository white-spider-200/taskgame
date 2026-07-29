import type { TeamMember } from "@/lib/team";

export type View = "tasks" | "dash" | "leaders" | "history" | "report" | "profile";
export type Filter = "run" | "rev" | "done";

export type MemberStat = TeamMember & {
  count: number;
  avg: string;
  avgTime: number;
  pts: number;
  pct?: string;
};

export type MiniLeader = {
  rank: number;
  name: string;
  pts: number;
  rankColor: string;
};

export type LeaderRow = {
  id: string;
  rank: number;
  name: string;
  initial: string;
  color: string;
  avatarUrl: string | null;
  tasks: number;
  avg: string;
  pts: number;
  bg: string;
};

export type EmployeeOfMonth = {
  name: string;
  initial: string;
  color: string;
  avatarUrl: string | null;
  monthLabel: string;
  tasks: number;
  pts: number;
};
