export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="text-sm font-bold tracking-tight">
          TECH
          <span className="text-cyan-400">//</span>
          CONNECT
          <span className="text-zinc-600">26</span>
        </div>

        <p className="text-sm text-zinc-600">
          Built for people building the future.
        </p>

        <p className="text-xs text-zinc-700">
          © 2026 TechConnect
        </p>
      </div>
    </footer>
  );
}