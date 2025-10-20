export function AuthPatternPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background/80 md:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(16,185,129,0.2),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(148,163,184,0.18)_0%,rgba(15,23,42,0)_45%),linear-gradient(245deg,rgba(99,102,241,0.18)_0%,rgba(15,23,42,0)_55%)]" />
      <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_20%_20%,rgba(244,244,245,0.3),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(226,232,240,0.35),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(79,70,229,0.25),transparent_50%)]" />
      <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground/70">
        <div className="flex flex-col gap-4 text-lg font-medium">
          <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs uppercase tracking-[0.2em]">
            Memoria
          </span>
          <p className="max-w-xs text-sm text-primary-foreground/80">
            Organize the knowledge your AI agents need, once. Memoria keeps every plan and spec
            ready on demand.
          </p>
        </div>
        <div className="grid gap-4 text-xs font-medium uppercase tracking-widest text-primary/70">
          <span className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-primary-foreground/80">
            Projects
          </span>
          <span className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-primary-foreground/70">
            Specs
          </span>
          <span className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-primary-foreground/60">
            Conventions
          </span>
        </div>
      </div>
    </div>
  );
}
