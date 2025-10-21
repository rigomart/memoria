import { Brain } from "lucide-react";

import { cn } from "@/lib/utils";

type SiteBrandProps = {
  className?: string;
  hideTextOnMobile?: boolean;
};

export function SiteBrand({ className, hideTextOnMobile = false }: SiteBrandProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/40">
        <Brain className="size-6" />
      </span>
      <span
        className={cn("flex flex-col leading-tight", hideTextOnMobile ? "hidden sm:flex" : "flex")}
      >
        <span className="font-semibold">Contextor</span>
      </span>
    </span>
  );
}
