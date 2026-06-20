import { z } from "zod";

function normalizeIndianPhone(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits[2]!))
    return `+${digits}`;
  return val.trim();
}

const phoneSchema = z
  .string()
  .transform(normalizeIndianPhone)
  .pipe(z.string().regex(/^\+91[6-9]\d{9}$/, "Must be a valid Indian mobile number"));

export const createPatientSchema = z.object({
  fullName: z.string().min(2).max(100),
  age: z.number().int().min(1).max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  village: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  aadhaarLast4: z.string().regex(/^\d{4}$/, "Must be exactly 4 digits"),
  phone: phoneSchema,
});

export const submitFindingSchema = z.object({
  severity: z.enum(["NORMAL", "WATCH", "URGENT"]),
  clinicalNotes: z.string().min(10).max(2000),
  recommendation: z.string().min(5).max(1000),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type SubmitFindingInput = z.infer<typeof submitFindingSchema>;
