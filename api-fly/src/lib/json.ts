import type { Response } from "express";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function ok<T>(res: Response, data: T, status = 200) {
  res.status(status).json({ success: true, data } satisfies ApiResponse<T>);
}

export function err(res: Response, message: string, status: number) {
  res.status(status).json({ success: false, error: message } satisfies ApiResponse<never>);
}

export function serverErr(res: Response, e: unknown, context: string) {
  console.error(`[${context}]`, e);
  err(res, "Internal server error", 500);
}
