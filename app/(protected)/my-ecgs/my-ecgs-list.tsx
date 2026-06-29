"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, Clock, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { ApiResponse } from "@/lib/api-response";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

type FindingDetail = {
  severity: string;
  clinicalNotes: string;
  recommendation: string;
  createdAt: string;
  reviewedBy: { id: string; name: string } | null;
};

type MyEcgRow = {
  id: string;
  status: string;
  healthWorkerNotes: string | null;
  createdAt: string;
  patient: {
    fullName: string;
    age: number;
    village: string;
    district: string;
    phone: string;
  };
  finding: FindingDetail | null;
};

type MyEcgList = { items: MyEcgRow[]; total: number; page: number; limit: number };

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") return <span className="badge-pending">Pending review</span>;
  if (status === "URGENT") return <span className="badge-urgent">Urgent</span>;
  return <span className="badge-reviewed">Reviewed</span>;
}

function SeverityBadge({ s }: { s: string }) {
  if (s === "URGENT") return <span className="badge-urgent">Urgent</span>;
  if (s === "WATCH") return <span className="badge-watch">Watch</span>;
  return <span className="badge-normal">Normal</span>;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function EcgCard({ ecg }: { ecg: MyEcgRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="card overflow-hidden shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-ink-50/60"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink-900">{ecg.patient.fullName}</p>
            <StatusBadge status={ecg.status} />
            {ecg.finding ? <SeverityBadge s={ecg.finding.severity} /> : null}
          </div>
          <p className="text-xs text-ink-500">
            {ecg.patient.age}y · {ecg.patient.village}, {ecg.patient.district}
          </p>
          {ecg.status === "PENDING" && (
            <p className="mt-2 text-xs text-amber-800/90">Waiting for cardiologist review…</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-xs text-ink-400">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {timeAgo(ecg.createdAt)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-ink-400" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-400" aria-hidden />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-ink-100 bg-ink-50/40 px-4 py-4">
          {ecg.healthWorkerNotes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Your notes</p>
              <p className="mt-1 text-sm text-ink-700">{ecg.healthWorkerNotes}</p>
            </div>
          )}

          {ecg.finding ? (
            <div className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-4 ring-1 ring-emerald-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">
                  Cardiologist finding
                </p>
                {ecg.finding.reviewedBy && (
                  <p className="text-xs text-emerald-800/80">
                    Reviewed by {ecg.finding.reviewedBy.name}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-900/80">Clinical notes</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-950/90">
                  {ecg.finding.clinicalNotes}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-900/80">Recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-950/90">
                  {ecg.finding.recommendation}
                </p>
              </div>
              <p className="text-xs text-emerald-800/70">
                Finding submitted{" "}
                {new Date(ecg.finding.createdAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-600">
              No finding yet. You will receive a WhatsApp alert when the cardiologist completes the
              review.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function MyEcgsList({ initialList }: { initialList: MyEcgList | null }) {
  const [ecgs, setEcgs] = useState<MyEcgRow[]>(() => initialList?.items ?? []);
  const [total, setTotal] = useState(() => initialList?.total ?? 0);
  const [loading, setLoading] = useState(() => initialList == null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/ecg/mine?limit=50");
      const json: ApiResponse<MyEcgList> = await res.json();
      if (json.success && json.data) {
        setEcgs(json.data.items);
        setTotal(json.data.total);
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialList != null) {
      setLoading(false);
      return;
    }
    void load();
  }, [initialList, load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const pendingCount = ecgs.filter((e) => e.status === "PENDING").length;
  const reviewedCount = ecgs.filter((e) => e.finding).length;

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            icon={ClipboardList}
            title="My ECGs"
            description="Track uploads and read cardiologist findings — refreshes every 30 seconds."
          />
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="btn-secondary shrink-0 gap-2 self-start text-xs"
            title={`Last refreshed: ${lastRefresh.toLocaleTimeString()}`}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-ink-900">{total}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500">Uploaded</p>
          </div>
          <div className="card border-amber-200/80 bg-amber-50/40 p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-amber-700">{pendingCount}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-900/80">
              Pending
            </p>
          </div>
          <div className="card border-emerald-200/80 bg-emerald-50/40 p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums text-emerald-700">{reviewedCount}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-emerald-800/80">
              With finding
            </p>
          </div>
        </div>

        {loading && ecgs.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">Loading your ECGs…</div>
        ) : ecgs.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-ink-500">No ECG uploads yet.</p>
            <Link href="/ecg-upload" className="btn-primary mt-4 inline-flex">
              Upload your first ECG
            </Link>
          </div>
        ) : (
          <ul className="space-y-3" aria-label="My ECG uploads">
            {ecgs.map((ecg) => (
              <EcgCard key={ecg.id} ecg={ecg} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
