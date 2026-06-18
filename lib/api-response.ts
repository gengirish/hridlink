import { NextResponse } from "next/server";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function err(message: string, status: number) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error: message }, { status });
}

export function serverErr(e: unknown, context: string) {
  console.error(`[${context}]`, e);
  return err("Internal server error", 500);
}
