import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
      {Icon ? <Icon className="size-12 text-muted-foreground/70" aria-hidden /> : null}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        {description ? <p className="max-w-md text-sm">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center justify-center">{action}</div> : null}
    </div>
  );
}
