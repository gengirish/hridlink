"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, Clock } from "lucide-react";
import type { ApiResponse } from "@/lib/api-response";

type Stats = {
  totalPatients: number;
  totalECGs: number;
  bySeverity: { NORMAL: number; WATCH: number; URGENT: number };
  records: Array<{
    id: string;
    createdAt: string;
    status: string;
    patient: { fullName: string; village: string };
    finding: { severity: string; createdAt: string } | null;
  }>;
};

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
    ["Patient", "Village", "Status", "Severity", "Response Time", "Uploaded"],
    ...stats.records.map((r) => [
      r.patient.fullName,
      r.patient.village,
      r.status,
      r.finding?.severity ?? "—",
      responseMinutes(r.createdAt, r.finding?.createdAt ?? null),
      new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hridlink-ecg-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((json: ApiResponse<Stats>) => {
        if (json.success && json.data) setStats(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load stats.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">Admin Dashboard</h1>
              <p className="text-xs text-slate-500">HridLink Pilot Stats</p>
            </div>
          </div>
          <button
            onClick={() => exportCSV(stats)}
            className="btn-secondary text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="card p-4 text-center col-span-1">
            <p className="text-2xl font-bold text-slate-800">{stats.totalPatients}</p>
            <p className="text-xs text-slate-500 mt-1">Patients</p>
          </div>
          <div className="card p-4 text-center col-span-1">
            <p className="text-2xl font-bold text-slate-800">{stats.totalECGs}</p>
            <p className="text-xs text-slate-500 mt-1">Total ECGs</p>
          </div>
          <div className="card p-4 text-center col-span-1">
            <p className="text-2xl font-bold text-green-600">{stats.bySeverity.NORMAL}</p>
            <p className="text-xs text-slate-500 mt-1">Normal</p>
          </div>
          <div className="card p-4 text-center col-span-1">
            <p className="text-2xl font-bold text-yellow-500">{stats.bySeverity.WATCH}</p>
            <p className="text-xs text-slate-500 mt-1">Watch</p>
          </div>
          <div className="card p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-red-600">{stats.bySeverity.URGENT}</p>
            <p className="text-xs text-slate-500 mt-1">Urgent</p>
          </div>
        </div>

        {/* Records table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Village
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Response
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.patient.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.patient.village}</td>
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
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {responseMinutes(r.createdAt, r.finding?.createdAt ?? null)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.records.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">No ECG records yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
