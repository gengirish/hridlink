import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Tailwind classes for the icon container, e.g. bg-brand-600 */
  iconClassName?: string;
  className?: string;
};

export function PageHeader({
  icon: Icon,
  title,
  description,
  iconClassName = "bg-brand-600 shadow-inner",
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex items-start gap-3 mb-8", className)}>
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ring-1 ring-black/5",
          iconClassName
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 pt-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
