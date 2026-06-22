"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Stethoscope, ExternalLink, X, Clock, RefreshCw } from "lucide-react";
import { submitFindingSchema, type SubmitFindingInput } from "@/lib/validators";
import type { ApiResponse } from "@/lib/api-response";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export type ECGRow = {
  id: string;
  status: string;
  fileUrl: string;
  healthWorkerNotes: string | null;
  createdAt: string;
  patient: { fullName: string; age: number; village: string; district: string };
  finding: { severity: string } | null;
};

export type ECGListData = { items: ECGRow[]; total: number; page: number; limit: number };

const IMAGE_EXTS = /\.(svg|png|jpg|jpeg|webp|gif)($|\?)/i;

type StatusFilter = "PENDING" | "ALL";

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") return <span className="badge-pending">Pending</span>;
  if (status === "URGENT") return <span className="badge-urgent">Urgent</span>;
  return <span className="badge-reviewed">Reviewed</span>;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function CardiologistQueue({ initialList }: { initialList: ECGListData | null }) {
  const [ecgs, setEcgs] = useState<ECGRow[]>(() => initialList?.items ?? []);
  const [total, setTotal] = useState(() => initialList?.total ?? 0);
  const [loading, setLoading] = useState(() => initialList == null);
  const [selected, setSelected] = useState<ECGRow | null>(null);
  const [viewerFileUrl, setViewerFileUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const prevFilter = useRef<StatusFilter>(statusFilter);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitFindingInput>({ resolver: zodResolver(submitFindingSchema) });

  const loadECGs = useCallback(async (filter: StatusFilter) => {
    try {
      const qs = filter === "PENDING" ? "status=PENDING" : "";
      const res = await fetch(`/api/ecg?${qs}&limit=50`);
      const json: ApiResponse<ECGListData> = await res.json();
      if (!json.success) {
        if (res.status === 403) {
          toast.error("Your account does not have cardiologist access.");
        }
        return;
      }
      if (json.data) {
        setEcgs(json.data.items);
        setTotal(json.data.total);
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const switchedToPendingFromAll = statusFilter === "PENDING" && prevFilter.current === "ALL";
    prevFilter.current = statusFilter;

    const skipFetch = statusFilter === "PENDING" && initialList != null && !switchedToPendingFromAll;

    if (!skipFetch) {
      setLoading(true);
      void loadECGs(statusFilter);
    } else {
      setLoading(false);
    }

    if (statusFilter !== "PENDING") return;
    if (typeof document === "undefined") return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const syncIntervalToVisibility = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
      if (document.visibilityState === "visible") {
        intervalId = setInterval(() => loadECGs("PENDING"), 30_000);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadECGs("PENDING");
      }
      syncIntervalToVisibility();
    };

    syncIntervalToVisibility();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [loadECGs, statusFilter, initialList]);

  useEffect(() => {
    if (!selected) {
      setViewerFileUrl(null);
      return;
    }
    let cancelled = false;
    setViewerFileUrl(null);
    (async () => {
      const res = await fetch(`/api/ecg/${selected.id}/signed-file-url`);
      let json: ApiResponse<{ fileUrl: string }>;
      try {
        json = (await res.json()) as ApiResponse<{ fileUrl: string }>;
      } catch {
        if (!cancelled) toast.error("Could not load ECG file link");
        return;
      }
      if (cancelled) return;
      if (json.success && json.data?.fileUrl) {
        setViewerFileUrl(json.data.fileUrl);
      } else {
        toast.error(json.error ?? "Could not load ECG file link");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  async function onSubmitFinding(data: SubmitFindingInput) {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ecg/${selected.id}/finding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: ApiResponse<unknown> = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Failed to submit finding");
        return;
      }
      toast.success("Finding saved. Health worker notified.");
      setSelected(null);
      reset();
      loadECGs(statusFilter);
    } finally {
      setSubmitting(false);
    }
  }

  const displayUrl = viewerFileUrl;
  const showImage = Boolean(displayUrl && IMAGE_EXTS.test(displayUrl));

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            icon={Stethoscope}
            iconClassName="bg-clinical-600 shadow-inner"
            title="Cardiologist queue"
            description={
              statusFilter === "PENDING"
                ? "Pending-first list · refreshes every 30 seconds while you stay on this tab."
                : `Showing every ECG on file (${total} total).`
            }
          />
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadECGs(statusFilter);
            }}
            className="btn-secondary shrink-0 gap-2 self-start text-xs"
            title={`Last refreshed: ${lastRefresh.toLocaleTimeString()}`}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["PENDING", "ALL"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                statusFilter === f
                  ? "bg-clinical-700 text-white shadow-sm ring-1 ring-black/10"
                  : "border border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50"
              )}
            >
              {f === "PENDING" ? "Pending" : "All ECGs"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-10 text-center text-sm text-ink-500">Loading ECGs…</div>
        ) : ecgs.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">
            {statusFilter === "PENDING" ? "No pending ECGs. You are fully caught up." : "No ECG records found."}
          </div>
        ) : (
          <ul className="space-y-3" aria-label="ECG list">
            {ecgs.map((ecg) => (
              <li key={ecg.id}>
                <button
                  type="button"
                  className="card flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left shadow-sm transition hover:border-clinical-200/80 hover:shadow-md"
                  onClick={() => {
                    setSelected(ecg);
                    reset();
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink-900">{ecg.patient.fullName}</p>
                      <StatusBadge status={ecg.status} />
                    </div>
                    <p className="text-xs text-ink-500">
                      {ecg.patient.age}y · {ecg.patient.village}, {ecg.patient.district}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-ink-400">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {timeAgo(ecg.createdAt)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/60 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-ink-200 bg-white shadow-lift sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ecg-review-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-ink-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="min-w-0">
                <p id="ecg-review-title" className="truncate text-base font-semibold text-ink-900">
                  {selected.patient.fullName}
                </p>
                <p className="text-xs text-ink-500">
                  {selected.patient.age}y · {selected.patient.village}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
                aria-label="Close review"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {!displayUrl && (
                <p className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-center text-sm text-ink-600">
                  Loading ECG file…
                </p>
              )}
              {showImage && displayUrl && (
                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayUrl} alt="ECG scan" className="max-h-52 w-full object-contain" />
                </div>
              )}

              {displayUrl && (
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex gap-2 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open ECG in new tab
                </a>
              )}

              {selected.healthWorkerNotes && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 ring-1 ring-amber-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">
                    Health worker notes
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-950/90">{selected.healthWorkerNotes}</p>
                </div>
              )}

              {selected.finding ? (
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">
                    Already reviewed
                  </p>
                  <p className="mt-1 text-sm text-emerald-950/90">Severity: {selected.finding.severity}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitFinding)} className="space-y-4">
                  <div>
                    <label className="label" htmlFor="severity">
                      Severity
                    </label>
                    <select id="severity" {...register("severity")} className="input" autoFocus>
                      <option value="">Select severity</option>
                      <option value="NORMAL">Normal</option>
                      <option value="WATCH">Watch</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    {errors.severity && <p className="error-msg">{errors.severity.message}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="clinicalNotes">
                      Clinical notes
                    </label>
                    <textarea
                      id="clinicalNotes"
                      {...register("clinicalNotes")}
                      className="input resize-none"
                      rows={4}
                      placeholder="ECG findings, arrhythmia notes, intervals…"
                    />
                    {errors.clinicalNotes && (
                      <p className="error-msg">{errors.clinicalNotes.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="recommendation">
                      Recommendation
                    </label>
                    <textarea
                      id="recommendation"
                      {...register("recommendation")}
                      className="input resize-none"
                      rows={3}
                      placeholder="Refer to district hospital / continue medication…"
                    />
                    {errors.recommendation && (
                      <p className="error-msg">{errors.recommendation.message}</p>
                    )}
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                    {submitting ? "Submitting…" : "Submit finding"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
