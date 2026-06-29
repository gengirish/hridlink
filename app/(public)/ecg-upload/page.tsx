"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, Search, CheckCircle2, FileText, X } from "lucide-react";
import type { ApiResponse } from "@/lib/api-response";
import { PageHeader } from "@/components/page-header";

type Patient = { id: string; fullName: string; age: number; village: string; district: string };
type ECGResult = { id: string };

function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits[2]!))
    return `+${digits}`;
  return raw.trim();
}

const uploadSchema = z.object({
  patientId: z.string().cuid("Select a valid patient"),
  healthWorkerNotes: z.string().max(1000).optional(),
});
type UploadInput = z.infer<typeof uploadSchema>;

export default function ECGUploadPage() {
  const [phoneQuery, setPhoneQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [done, setDone] = useState<ECGResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadInput>({ resolver: zodResolver(uploadSchema) });

  async function searchPatient() {
    if (!phoneQuery.trim()) return;
    setSearching(true);
    setPatient(null);
    try {
      const res = await fetch(`/api/patients?phone=${encodeURIComponent(normalizeIndianPhone(phoneQuery))}`, {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        toast.error("Please sign in as a health worker");
        return;
      }
      let json: ApiResponse<Patient>;
      try {
        json = (await res.json()) as ApiResponse<Patient>;
      } catch {
        toast.error("Could not load patient data");
        return;
      }
      if (!json.success || !json.data) {
        toast.error("Patient not found for that phone number");
        return;
      }
      setPatient(json.data);
      setValue("patientId", json.data.id, { shouldValidate: true });
      toast.success(`Found: ${json.data.fullName}`);
    } finally {
      setSearching(false);
    }
  }

  async function onSubmit(data: UploadInput) {
    if (!file) {
      toast.error("Please select an ECG file");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", data.patientId);
      if (data.healthWorkerNotes) formData.append("healthWorkerNotes", data.healthWorkerNotes);

      const json = await new Promise<ApiResponse<ECGResult>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/ecg");
        xhr.withCredentials = true;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 401 || xhr.status === 403) {
            toast.error("Please sign in as a health worker");
            resolve({ success: false, error: "Unauthorized" });
            return;
          }
          try {
            resolve(JSON.parse(xhr.responseText) as ApiResponse<ECGResult>);
          } catch {
            reject(new Error("Invalid response"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      if (!json.success || !json.data) {
        toast.error(json.error ?? "Upload failed");
        return;
      }
      setDone(json.data);
      toast.success("ECG uploaded. Cardiologist notified via WhatsApp.");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  if (done) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <div className="card border-emerald-200/80 p-8 shadow-lift">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink-900">ECG submitted</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              The cardiologist is notified via WhatsApp. Track status and read the finding on My ECGs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/my-ecgs" className="btn-primary flex-1 text-center">
                View My ECGs
              </a>
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  setDone(null);
                  setPatient(null);
                  setFile(null);
                  setPhoneQuery("");
                }}
              >
                Upload another
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">
        <PageHeader
          icon={Upload}
          title="Upload ECG"
          description="Find the patient by mobile, attach the strip (photo or PDF), and add optional context for the specialist."
        />

        <div className="card space-y-8 p-6 shadow-soft sm:p-7">
          {/* Step 1: Search patient */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                1
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Find patient</p>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                className="input flex-1"
                aria-label="Patient phone number"
                placeholder="9876543210"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPatient()}
              />
              <button
                type="button"
                onClick={searchPatient}
                disabled={searching}
                className="btn-secondary px-3"
                aria-label="Search patient by phone"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {patient && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-3 ring-1 ring-emerald-100">
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-emerald-950">{patient.fullName}</p>
                  <p className="text-xs text-emerald-800/90">
                    {patient.age}y · {patient.village}, {patient.district}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
              </div>
            )}
          </div>

          {/* Step 2: Upload file */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("patientId")} />
            {errors.patientId && (
              <p className="error-msg -mt-2">{errors.patientId.message}</p>
            )}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                  2
                </span>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">ECG file & notes</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-ink-50/80 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-ink-500" aria-hidden />
                    <span className="truncate text-sm text-ink-800">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white hover:text-ink-700"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-ink-200 bg-white/60 p-8 text-center transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <Upload className="mx-auto mb-2 h-7 w-7 text-ink-400" aria-hidden />
                  <p className="text-sm font-medium text-ink-700">Tap to choose image or PDF</p>
                  <p className="mt-1 text-xs text-ink-500">JPG, PNG, or PDF</p>
                </button>
              )}
            </div>

            <div>
              <label htmlFor="healthWorkerNotes" className="label">
                Health Worker Notes (optional)
              </label>
              <textarea
                id="healthWorkerNotes"
                {...register("healthWorkerNotes")}
                className="input resize-none"
                rows={3}
                placeholder="Any observations, symptoms, context…"
              />
              {errors.healthWorkerNotes && (
                <p className="error-msg">{errors.healthWorkerNotes.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !patient || !file}
              className="btn-primary w-full py-3"
            >
              {uploading
                ? uploadProgress != null
                  ? `Uploading… ${uploadProgress}%`
                  : "Uploading…"
                : "Submit ECG"}
            </button>
            {uploading && uploadProgress != null && (
              <div
                className="h-2 overflow-hidden rounded-full bg-ink-100"
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
