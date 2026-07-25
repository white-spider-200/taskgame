import type { TeamMember } from "@/lib/team";

export type View = "tasks" | "dash" | "leaders" | "profile";
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
