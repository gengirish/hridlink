import { z } from "zod";

export const createPatientSchema = z.object({
  fullName: z.string().min(2).max(100),
  age: z.number().int().min(1).max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  village: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  aadhaarLast4: z.string().regex(/^\d{4}$/, "Must be exactly 4 digits"),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Must be E.164 Indian mobile (+91XXXXXXXXXX)"),
});

export const createECGSchema = z.object({
  patientId: z.string().cuid(),
  fileUrl: z.string().url(),
  healthWorkerNotes: z.string().max(1000).optional(),
});

export const submitFindingSchema = z.object({
  severity: z.enum(["NORMAL", "WATCH", "URGENT"]),
  clinicalNotes: z.string().min(10).max(2000),
  recommendation: z.string().min(5).max(1000),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type CreateECGInput = z.infer<typeof createECGSchema>;
export type SubmitFindingInput = z.infer<typeof submitFindingSchema>;
