import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="relative z-20 border-b border-white/10">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <a href="/" className="text-xl font-black tracking-tighter">
          TECH
          <span className="text-cyan-400">//</span>
          CONNECT
          <span className="ml-1 text-zinc-500">26</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a
            href="#speakers"
            className="transition hover:text-white"
          >
            Speakers
          </a>

          <a
            href="#schedule"
            className="transition hover:text-white"
          >
            Schedule
          </a>

          <a
            href="#register"
            className="transition hover:text-white"
          >
            Venue
          </a>
        </nav>

        <Button
          asChild
          className="bg-white text-black hover:bg-zinc-200"
        >
          <a href="#register">Register</a>
        </Button>
      </div>
    </header>
  );
}