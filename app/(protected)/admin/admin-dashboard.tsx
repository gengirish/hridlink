"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import type { ApiResponse } from "@/lib/api-response";
import { PageHeader } from "@/components/page-header";

type Patient = { fullName: string; village: string; district: string; phone: string };

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
};

type StatsRecord = {
  id: string;
  createdAt: string;
  status: string;
  patient: Patient;
  finding: {
    severity: string;
    clinicalNotes: string;
    recommendation: string;
    createdAt: string;
    reviewedBy: { id: string; name: string } | null;
  } | null;
};

export type Stats = {
  totalPatients: number;
  totalECGs: number;
  pendingCount: number;
  reviewedCount: number;
  completionRate: number;
  medianResponseMinutes: number | null;
  bySeverity: { NORMAL: number; WATCH: number; URGENT: number };
  records: StatsRecord[];
  page: number;
  limit: number;
};

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function SeverityBadge({ s }: { s: string }) {
  if (s === "URGENT") return <span className="badge-urgent">Urgent</span>;
  if (s === "WATCH") return <span className="badge-watch">Watch</span>;
  if (s === "NORMAL") return <span className="badge-normal">Normal</span>;
  return <span className="badge-pending">{s}</span>;
}

function responseMinutes(createdAt: string, findingAt: string | null) {
  if (!findingAt) return "—";
  const mins = Math.round(
    (new Date(findingAt).getTime() - new Date(createdAt).getTime()) / 60000
  );
  return `${mins}m`;
}

const ROLE_LABELS: Record<string, string> = {
  HEALTH_WORKER: "Health Worker",
  CARDIOLOGIST: "Cardiologist",
  ADMIN: "Admin",
};

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN")
    return <span className="badge-urgent">{ROLE_LABELS[role] ?? role}</span>;
  if (role === "CARDIOLOGIST")
    return <span className="badge-reviewed">{ROLE_LABELS[role] ?? role}</span>;
  return <span className="badge-pending">{ROLE_LABELS[role] ?? role}</span>;
}

function exportCSV(stats: Stats) {
  const rows = [
    [
      "Patient",
      "Village",
      "District",
      "Phone",
      "Status",
      "Severity",
      "Response Time",
      "Reviewer",
      "Reviewed At",
      "Clinical Notes",
      "Recommendation",
      "Uploaded",
    ],
    ...stats.records.map((r) => [
      r.patient.fullName,
      r.patient.village,
      r.patient.district,
      r.patient.phone,
      r.status,
      r.finding?.severity ?? "—",
      responseMinutes(r.createdAt, r.finding?.createdAt ?? null),
      r.finding?.reviewedBy?.name ?? "—",
      r.finding?.createdAt
        ? new Date(r.finding.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : "—",
      r.finding?.clinicalNotes ?? "—",
      r.finding?.recommendation ?? "—",
      new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ]),
  ];
  const csv = rows.map((row) => row.map((c) => csvCell(String(c))).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hridlink-ecg-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboard({ initialStats }: { initialStats: Stats | null }) {
  const [stats, setStats] = useState<Stats | null>(initialStats);
  const [statsLoading, setStatsLoading] = useState(initialStats == null);
  const [tab, setTab] = useState<"stats" | "team">("stats");
  const [team, setTeam] = useState<TeamUser[] | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    if (initialStats != null) return;
    fetch("/api/admin/stats?limit=200")
      .then((r) => r.json())
      .then((json: ApiResponse<Stats>) => {
        if (json.success && json.data) setStats(json.data);
      })
      .finally(() => setStatsLoading(false));
  }, [initialStats]);

  useEffect(() => {
    if (tab !== "team" || team !== null) return;
    setTeamLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json: ApiResponse<TeamUser[]>) => {
        if (json.success && json.data) setTeam(json.data);
      })
      .finally(() => setTeamLoading(false));
  }, [tab, team]);

  async function handleRoleChange(userId: string, newRole: string) {
    setTeam((prev) =>
      prev ? prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)) : prev
    );
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = (await res.json()) as ApiResponse<TeamUser>;
      if (!json.success) {
        toast.error(json.error ?? "Failed to update role");
        setTeam(null);
      } else {
        toast.success("Role updated");
      }
    } catch {
      toast.error("Network error — could not update role");
      setTeam(null);
    }
  }

  const tabPill = (active: boolean) =>
    active
      ? "rounded-full px-4 py-1.5 text-xs font-semibold bg-ink-900 text-white shadow-sm"
      : "rounded-full px-4 py-1.5 text-xs font-semibold text-ink-500 hover:text-ink-900 transition-colors";

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            icon={tab === "team" ? Users : BarChart3}
            iconClassName="bg-ink-900 shadow-inner"
            title={tab === "team" ? "Team" : "Pilot operations"}
            description={
              tab === "team"
                ? "Manage staff roles — promote health workers to cardiologist or admin."
                : "Patients, ECG volume, triage mix, and response-time signal—export for offline reporting."
            }
          />
          {tab === "stats" && stats && (
            <button
              type="button"
              onClick={() => exportCSV(stats)}
              className="btn-secondary shrink-0 gap-2 self-start text-xs"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export CSV
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50/60 p-1 w-fit">
          <button type="button" onClick={() => setTab("stats")} className={tabPill(tab === "stats")}>
            Stats
          </button>
          <button type="button" onClick={() => setTab("team")} className={tabPill(tab === "team")}>
            Team
          </button>
        </div>

        {/* Stats tab */}
        {tab === "stats" && (
          <>
            {statsLoading ? (
              <div aria-hidden="true">
                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="card col-span-1 p-5 text-center">
                      <div className="mx-auto h-8 w-12 animate-pulse rounded bg-ink-200" />
                      <div className="mx-auto mt-2 h-3 w-16 animate-pulse rounded bg-ink-100" />
                    </div>
                  ))}
                </div>
                <div className="card overflow-hidden shadow-soft">
                  <div className="divide-y divide-ink-100">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                        <div className="h-4 w-32 animate-pulse rounded bg-ink-200" />
                        <div className="h-4 w-24 animate-pulse rounded bg-ink-100" />
                        <div className="h-4 w-20 animate-pulse rounded bg-ink-100" />
                        <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-ink-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : !stats ? (
              <p className="py-20 text-center text-sm text-red-600">Failed to load stats.</p>
            ) : (
              <>
                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  <div className="card col-span-1 p-5 text-center">
                    <p className="text-3xl font-semibold tabular-nums text-ink-900">{stats.totalPatients}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500">Patients</p>
                  </div>
                  <div className="card col-span-1 p-5 text-center">
                    <p className="text-3xl font-semibold tabular-nums text-ink-900">{stats.totalECGs}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500">ECGs</p>
                  </div>
                  <div className="card col-span-1 border-amber-200/80 bg-amber-50/40 p-5 text-center">
                    <p className="text-3xl font-semibold tabular-nums text-amber-700">{stats.pendingCount}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-900/80">Pending</p>
                  </div>
                  <div className="card col-span-1 border-sky-200/80 bg-sky-50/40 p-5 text-center">
                    <p className="text-3xl font-semibold tabular-nums text-sky-700">
                      {stats.medianResponseMinutes != null ? `${stats.medianResponseMinutes}m` : "—"}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-sky-900/80">
                      Median response
                    </p>
                  </div>
                  <div className="card col-span-1 border-violet-200/80 bg-violet-50/40 p-5 text-center">
                    <p className="text-3xl font-semibold tabular-nums text-violet-700">
                      {stats.completionRate}%
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-900/80">
                      Reviewed
                    </p>
                  </div>
                  <div className="card col-span-1 border-emerald-200/80 bg-emerald-50/40 p-5 text-center">
                    <p className="text-3xl font-semibold tabular-nums text-emerald-700">{stats.bySeverity.NORMAL}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-emerald-800/80">Normal</p>
                  </div>
                  <div className="card col-span-1 border-amber-200/80 bg-amber-50/40 p-5 text-center">
                    <p className="text-3xl font-semibold tabular-nums text-amber-700">{stats.bySeverity.WATCH}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-900/80">Watch</p>
                  </div>
                  <div className="card col-span-2 border-red-200/80 bg-red-50/40 p-5 text-center sm:col-span-1">
                    <p className="text-3xl font-semibold tabular-nums text-red-700">{stats.bySeverity.URGENT}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-red-900/80">Urgent</p>
                  </div>
                </div>

                <div className="card overflow-hidden shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-ink-100 bg-ink-50/80">
                        <tr>
                          {["Patient", "Village", "District", "Status", "Severity", "Response", "Reviewer"].map(
                            (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {stats.records.map((r) => (
                          <tr key={r.id} className="transition hover:bg-ink-50/80">
                            <td className="px-4 py-3 font-medium text-ink-900">{r.patient.fullName}</td>
                            <td className="px-4 py-3 text-ink-600">{r.patient.village}</td>
                            <td className="px-4 py-3 text-ink-600">{r.patient.district}</td>
                            <td className="px-4 py-3">
                              {r.status === "PENDING" ? (
                                <span className="badge-pending">Pending</span>
                              ) : r.status === "URGENT" ? (
                                <span className="badge-urgent">Urgent</span>
                              ) : (
                                <span className="badge-reviewed">Reviewed</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {r.finding ? <SeverityBadge s={r.finding.severity} /> : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-ink-500">
                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                {responseMinutes(r.createdAt, r.finding?.createdAt ?? null)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-ink-600">
                              {r.finding?.reviewedBy?.name ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {stats.records.length === 0 && (
                      <p className="py-10 text-center text-sm text-ink-500">No ECG records yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Team tab */}
        {tab === "team" && (
          <div className="card overflow-hidden shadow-soft">
            {teamLoading ? (
              <div className="divide-y divide-ink-100" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="h-4 w-28 animate-pulse rounded bg-ink-200" />
                    <div className="h-4 w-40 animate-pulse rounded bg-ink-100" />
                    <div className="h-4 w-20 animate-pulse rounded bg-ink-100" />
                    <div className="ml-auto h-6 w-24 animate-pulse rounded-full bg-ink-100" />
                  </div>
                ))}
              </div>
            ) : !team || team.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-500">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50/80">
                    <tr>
                      {["Name", "Email", "Phone", "Role", "Joined"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {team.map((u) => (
                      <tr key={u.id} className="transition hover:bg-ink-50/80">
                        <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                        <td className="px-4 py-3 text-ink-600">{u.email}</td>
                        <td className="px-4 py-3 text-ink-500">{u.phone ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <RoleBadge role={u.role} />
                            <select
                              value={u.role}
                              onChange={(e) => void handleRoleChange(u.id, e.target.value)}
                              className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-ink-400"
                              aria-label={`Change role for ${u.name}`}
                            >
                              <option value="HEALTH_WORKER">Health Worker</option>
                              <option value="CARDIOLOGIST">Cardiologist</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-500">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
