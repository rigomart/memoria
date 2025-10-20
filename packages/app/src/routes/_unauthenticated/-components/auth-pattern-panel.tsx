import { PatternBackground } from "@/components/pattern-background";

export function AuthPatternPanel() {
  return (
    <PatternBackground className="hidden md:block">
      <div className="flex h-full flex-col justify-center gap-10 px-14 py-16 text-foreground">
        <div className="space-y-5">
          <h2 className="max-w-xs text-3xl font-semibold tracking-tight text-foreground">
            Knowledge workspaces for agents and teams
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Collect specs, conventions, and project history in a single shared space so every agent
          has the full context they need.
        </p>
      </div>
    </PatternBackground>
  );
}
