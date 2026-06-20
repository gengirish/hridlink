"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Heart, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { createPatientSchema, type CreatePatientInput } from "@/lib/validators";
import type { ApiResponse } from "@/lib/api-response";

type PatientResult = { id: string; fullName: string };

/** Converts 10-digit Indian mobile numbers to E.164. Passes through already-formatted numbers. */
function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits[2]!))
    return `+${digits}`;
  return raw.trim();
}

export default function RegisterPage() {
  const [created, setCreated] = useState<PatientResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
  });

  async function onSubmit(data: CreatePatientInput) {
    const payload: CreatePatientInput = {
      ...data,
      phone: normalizeIndianPhone(data.phone),
    };

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (res.status === 401 || res.status === 403) {
      toast.error("Please sign in as a health worker");
      return;
    }
    let json: ApiResponse<PatientResult>;
    try {
      json = (await res.json()) as ApiResponse<PatientResult>;
    } catch {
      toast.error("Registration failed");
      return;
    }
    if (!json.success || !json.data) {
      toast.error(json.error ?? "Registration failed");
      return;
    }
    setCreated(json.data);
    reset();
    toast.success("Patient registered successfully");
  }

  if (created) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-md text-center">
          <div className="card border-emerald-200/80 p-8 shadow-lift">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-ink-900">Patient registered</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              <span className="font-semibold text-ink-900">{created.fullName}</span> is in the system.
              You can capture an ECG next.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn-secondary flex-1" onClick={() => setCreated(null)}>
                Register another
              </button>
              <a href="/ecg-upload" className="btn-primary flex-1 text-center">
                Upload ECG
              </a>
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
          icon={Heart}
          title="Patient registration"
          description="Capture demographics once—phone is used later to find the patient during ECG upload."
        />

        <div className="card p-6 shadow-soft sm:p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="label">
                Full Name
              </label>
              <input
                id="fullName"
                {...register("fullName")}
                className="input"
                placeholder="e.g. Ramanna Goud"
              />
              {errors.fullName && <p className="error-msg">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="age" className="label">
                  Age
                </label>
                <input
                  id="age"
                  {...register("age", { valueAsNumber: true })}
                  type="number"
                  className="input"
                  placeholder="58"
                  min={1}
                  max={120}
                />
                {errors.age && <p className="error-msg">{errors.age.message}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="label">
                  Gender
                </label>
                <select id="gender" {...register("gender")} className="input">
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && <p className="error-msg">{errors.gender.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="village" className="label">
                  Village
                </label>
                <input
                  id="village"
                  {...register("village")}
                  className="input"
                  placeholder="Kothapally"
                />
                {errors.village && <p className="error-msg">{errors.village.message}</p>}
              </div>
              <div>
                <label htmlFor="district" className="label">
                  District
                </label>
                <input
                  id="district"
                  {...register("district")}
                  className="input"
                  placeholder="Nalgonda"
                />
                {errors.district && <p className="error-msg">{errors.district.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="aadhaarLast4" className="label">
                  Aadhaar Last 4
                </label>
                <input
                  id="aadhaarLast4"
                  {...register("aadhaarLast4")}
                  className="input"
                  placeholder="xxxx"
                  maxLength={4}
                  inputMode="numeric"
                />
                {errors.aadhaarLast4 && (
                  <p className="error-msg">{errors.aadhaarLast4.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className="label">
                  Mobile Number
                </label>
                <input
                  id="phone"
                  {...register("phone")}
                  className="input"
                  placeholder="9876543210"
                  type="tel"
                  inputMode="numeric"
                />
                {errors.phone && <p className="error-msg">{errors.phone.message}</p>}
                <p className="mt-1 text-xs text-ink-500">10-digit Indian mobile; we format to +91 automatically.</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full py-3">
              {isSubmitting ? "Registering…" : "Register Patient"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
