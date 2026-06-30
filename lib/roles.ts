import type { UserRole } from "@prisma/client";

/** Human-readable labels for each staff role (shared across UI + toasts). */
export const ROLE_LABELS: Record<UserRole, string> = {
  HEALTH_WORKER: "Health Worker",
  CARDIOLOGIST: "Cardiologist",
  ADMIN: "Admin",
};

export function roleLabel(role: UserRole | string | null | undefined): string {
  if (!role) return "User";
  return ROLE_LABELS[role as UserRole] ?? "User";
}

/** Where each role should land right after signing in. */
const ROLE_DEFAULT_PATH: Record<UserRole, string> = {
  HEALTH_WORKER: "/my-ecgs",
  CARDIOLOGIST: "/cardiologist",
  ADMIN: "/admin",
};

export function defaultPathForRole(role: UserRole | string | null | undefined): string {
  if (!role) return "/";
  return ROLE_DEFAULT_PATH[role as UserRole] ?? "/";
}
