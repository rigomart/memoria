import { type CSSProperties, useId } from "react";

type CSSVariableStyles = CSSProperties & Record<`--${string}`, string>;

export function AuthPatternPanel() {
  const patternId = `${useId().replaceAll(":", "")}-auth-pattern`;

  const patternStyles: CSSVariableStyles = {
    "--auth-pattern-base":
      "color-mix(in oklab, var(--color-background) 92%, var(--color-primary) 5%)",
    "--auth-pattern-line": "color-mix(in oklab, var(--color-primary) 10%, transparent)",
  };

  return (
    <div
      className="relative hidden overflow-hidden border border-border/60 bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-primary)_12%)] md:block"
      style={patternStyles}
    >
      <svg className="absolute inset-0 size-full" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <pattern id={patternId} width="72" height="72" patternUnits="userSpaceOnUse">
            <rect width="72" height="72" fill="var(--auth-pattern-base)" />
            <path
              d="M0 0H72M0 36H72M36 0V72"
              stroke="var(--auth-pattern-line)"
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="relative flex h-full flex-col justify-center gap-10 px-14 py-16 text-foreground">
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
    </div>
  );
}
