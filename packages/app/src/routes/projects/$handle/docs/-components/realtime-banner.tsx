import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RealtimeBannerProps = {
  onDismiss: () => void;
  className?: string;
};

export function RealtimeBanner({ onDismiss, className }: RealtimeBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-amber-300/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm shadow-amber-200/40 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100",
        className,
      )}
      aria-live="polite"
    >
      <div className="flex-1">
        <p className="font-medium">This document was updated in another tab or device.</p>
        <p className="text-xs text-amber-800/80 dark:text-amber-100/70">
          Your local changes are preserved. Reload to pull the latest version before saving again.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-amber-900 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-100 dark:hover:bg-amber-500/30"
        onClick={onDismiss}
        aria-label="Dismiss realtime update notice"
      >
        <XIcon className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
