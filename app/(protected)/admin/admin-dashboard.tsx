"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, Clock } from "lucide-react";
import type { ApiResponse } from "@/lib/api-response";
import { PageHeader } from "@/components/page-header";

type Patient = { fullName: string; village: string; district: string; phone: string };

type StatsRecord = {
  id: string;
  createdAt: string;
  status: string;
  patient: Patient;
  finding: { severity: string; createdAt: string } | null;
};

export type Stats = {
  totalPatients: number;
  totalECGs: number;
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

function exportCSV(stats: Stats) {
  const rows = [
    ["Patient", "Village", "District", "Phone", "Status", "Severity", "Response Time", "Uploaded"],
    ...stats.records.map((r) => [
      r.patient.fullName,
      r.patient.village,
      r.patient.district,
      r.patient.phone,
      r.status,
      r.finding?.severity ?? "—",
      responseMinutes(r.createdAt, r.finding?.createdAt ?? null),
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
  const [loading, setLoading] = useState(initialStats == null);

  useEffect(() => {
    if (initialStats != null) return;
    fetch("/api/admin/stats?limit=200")
      .then((r) => r.json())
      .then((json: ApiResponse<Stats>) => {
        if (json.success && json.data) setStats(json.data);
      })
      .finally(() => setLoading(false));
  }, [initialStats]);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <p className="text-sm text-ink-500">Loading pilot stats…</p>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <p className="text-sm text-red-600">Failed to load stats.</p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            icon={BarChart3}
            iconClassName="bg-ink-900 shadow-inner"
            title="Pilot operations"
            description="Patients, ECG volume, triage mix, and response-time signal—export for offline reporting."
          />
          <button type="button" onClick={() => exportCSV(stats)} className="btn-secondary shrink-0 gap-2 self-start text-xs">
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export CSV
          </button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="card col-span-1 p-5 text-center">
            <p className="text-3xl font-semibold tabular-nums text-ink-900">{stats.totalPatients}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500">Patients</p>
          </div>
          <div className="card col-span-1 p-5 text-center">
            <p className="text-3xl font-semibold tabular-nums text-ink-900">{stats.totalECGs}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500">ECGs</p>
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
                  {["Patient", "Village", "District", "Status", "Severity", "Response"].map((h) => (
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
                    <td className="px-4 py-3">{r.finding ? <SeverityBadge s={r.finding.severity} /> : "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-ink-500">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {responseMinutes(r.createdAt, r.finding?.createdAt ?? null)}
                      </span>
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
      </div>
    </main>
  );
}
