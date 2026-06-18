"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Stethoscope, ExternalLink, X, Clock } from "lucide-react";
import { submitFindingSchema, type SubmitFindingInput } from "@/lib/validators";
import type { ApiResponse } from "@/lib/api-response";

type ECGRow = {
  id: string;
  status: string;
  fileUrl: string;
  healthWorkerNotes: string | null;
  createdAt: string;
  patient: { fullName: string; age: number; village: string; district: string };
  finding: { severity: string } | null;
};

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

export default function CardiologistPage() {
  const [ecgs, setEcgs] = useState<ECGRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ECGRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitFindingInput>({ resolver: zodResolver(submitFindingSchema) });

  async function loadECGs() {
    setLoading(true);
    try {
      const res = await fetch("/api/ecg?status=PENDING");
      const json: ApiResponse<ECGRow[]> = await res.json();
      if (json.success && json.data) setEcgs(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadECGs();
  }, []);

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
      loadECGs();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Cardiologist Dashboard</h1>
            <p className="text-xs text-slate-500">Pending ECG Reviews</p>
          </div>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-slate-400 text-sm">Loading ECGs…</div>
        ) : ecgs.length === 0 ? (
          <div className="card p-8 text-center text-slate-400 text-sm">
            No pending ECGs. All caught up!
          </div>
        ) : (
          <div className="space-y-3">
            {ecgs.map((ecg) => (
              <div
                key={ecg.id}
                className="card p-4 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelected(ecg);
                  reset();
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {ecg.patient.fullName}
                    </p>
                    <StatusBadge status={ecg.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {ecg.patient.age}y · {ecg.patient.village}, {ecg.patient.district}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(ecg.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{selected.patient.fullName}</p>
                <p className="text-xs text-slate-500">
                  {selected.patient.age}y · {selected.patient.village}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <a
                  href={selected.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View ECG File
                </a>
              </div>

              {selected.healthWorkerNotes && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Health Worker Notes</p>
                  <p className="text-sm text-amber-800">{selected.healthWorkerNotes}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmitFinding)} className="space-y-4">
                <div>
                  <label className="label">Severity</label>
                  <select {...register("severity")} className="input">
                    <option value="">Select severity</option>
                    <option value="NORMAL">Normal</option>
                    <option value="WATCH">Watch</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  {errors.severity && <p className="error-msg">{errors.severity.message}</p>}
                </div>

                <div>
                  <label className="label">Clinical Notes</label>
                  <textarea
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
                  <label className="label">Recommendation</label>
                  <textarea
                    {...register("recommendation")}
                    className="input resize-none"
                    rows={3}
                    placeholder="Refer to district hospital / continue medication…"
                  />
                  {errors.recommendation && (
                    <p className="error-msg">{errors.recommendation.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full"
                >
                  {submitting ? "Submitting…" : "Submit Finding"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
