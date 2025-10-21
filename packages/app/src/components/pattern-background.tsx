import { type CSSProperties, useId } from "react";

type CSSVariableStyles = CSSProperties & Record<`--${string}`, string>;

interface PatternBackgroundProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function PatternBackground({ children, className = "", style }: PatternBackgroundProps) {
  const patternId = `${useId().replaceAll(":", "")}-pattern`;

  const patternStyles: CSSVariableStyles = {
    "--pattern-base": "color-mix(in oklab, var(--color-background) 92%, var(--color-primary) 5%)",
    "--pattern-line": "color-mix(in oklab, var(--color-primary) 10%, transparent)",
  };

  return (
    <div
      className={`relative overflow-hidden border border-border/60 bg-[color-mix(in_oklab,var(--color-background)_88%,var(--color-primary)_12%)] ${className}`}
      style={{ ...patternStyles, ...style }}
    >
      <svg className="absolute inset-0 size-full" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <pattern id={patternId} width="72" height="72" patternUnits="userSpaceOnUse">
            <rect width="72" height="72" fill="var(--pattern-base)" />
            <path
              d="M0 0H72M0 36H72M36 0V72"
              stroke="var(--pattern-line)"
              strokeWidth="1"
              shapeRendering="crispEdges"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="relative h-full">{children}</div>
    </div>
  );
}
