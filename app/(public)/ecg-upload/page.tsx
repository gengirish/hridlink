"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, Search, CheckCircle2, FileText, X } from "lucide-react";
import type { ApiResponse } from "@/lib/api-response";

type Patient = { id: string; fullName: string; age: number; village: string; district: string };
type ECGResult = { id: string };

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
      const res = await fetch(`/api/patients?phone=${encodeURIComponent(phoneQuery.trim())}`);
      const json: ApiResponse<Patient> = await res.json();
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
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", data.patientId);
      if (data.healthWorkerNotes) formData.append("healthWorkerNotes", data.healthWorkerNotes);

      const res = await fetch("/api/ecg", { method: "POST", body: formData });
      const json: ApiResponse<ECGResult> = await res.json();
      if (!json.success || !json.data) {
        toast.error(json.error ?? "Upload failed");
        return;
      }
      setDone(json.data);
      toast.success("ECG uploaded. Cardiologist notified via WhatsApp.");
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">ECG Uploaded</h2>
          <p className="text-sm text-slate-500 mb-6">
            The cardiologist has been notified via WhatsApp and will review shortly.
          </p>
          <div className="flex gap-3">
            <button
              className="btn-secondary flex-1"
              onClick={() => {
                setDone(null);
                setPatient(null);
                setFile(null);
                setPhoneQuery("");
              }}
            >
              Upload Another
            </button>
            <a href="/" className="btn-primary flex-1">
              Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">Upload ECG</h1>
            <p className="text-xs text-slate-500">HridLink</p>
          </div>
        </div>

        <div className="card p-5 space-y-5">
          {/* Step 1: Search patient */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Step 1 — Find Patient
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                className="input flex-1"
                placeholder="+919876543210"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPatient()}
              />
              <button
                type="button"
                onClick={searchPatient}
                disabled={searching}
                className="btn-secondary px-3"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {patient && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                <div>
                  <p className="text-sm font-semibold text-green-800">{patient.fullName}</p>
                  <p className="text-xs text-green-600">
                    {patient.age}y · {patient.village}, {patient.district}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Step 2 — Select ECG File
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-brand-400 hover:bg-brand-50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Tap to upload ECG image or PDF
                  </p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF accepted</p>
                </button>
              )}
            </div>

            <div>
              <label className="label">Health Worker Notes (optional)</label>
              <textarea
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
              className="btn-primary w-full"
            >
              {uploading ? "Uploading…" : "Submit ECG"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
