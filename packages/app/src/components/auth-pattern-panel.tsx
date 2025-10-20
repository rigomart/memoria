export function AuthPatternPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-zinc-950 via-slate-950 to-slate-900 md:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(67,56,202,0.22),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(14,116,144,0.25),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(148,163,184,0.16)_0%,rgba(15,23,42,0)_40%),linear-gradient(320deg,rgba(79,70,229,0.18)_0%,rgba(15,23,42,0)_55%)]" />
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_25%_25%,rgba(148,163,184,0.35),transparent_50%),radial-gradient(circle_at_75%_35%,rgba(129,140,248,0.35),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.3),transparent_60%)]" />
      <div className="relative flex h-full flex-col justify-center gap-10 px-14 py-16 text-slate-100">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Memoria</p>
          <h2 className="max-w-xs text-3xl font-semibold tracking-tight text-slate-50">
            Knowledge workspaces for agents and teams
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-slate-300">
          Collect specs, conventions, and project history in a single shared space so every agent
          has the full context they need.
        </p>
      </div>
    </div>
  );
}
