import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EventHero({ registrationOpen }) {
  return (
    <section className="relative px-6 py-28 md:py-40">
      <div className="pointer-events-none absolute left-1/4 top-10 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[150px]" />

      <div className="pointer-events-none absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          {registrationOpen && (
            <Badge
              variant="outline"
              className="mb-8 border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-cyan-300"
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              REGISTRATION OPEN
            </Badge>
          )}

          <h1 className="max-w-5xl text-6xl font-semibold leading-[0.95] tracking-[-0.06em] md:text-8xl">
            THE WEB IS
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">
              CHANGING.
            </span>
            <br />
            BUILD NEXT.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400 md:text-xl">
            A technology conference for people building the products,
            platforms and ideas that will define the next decade of
            the web.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 bg-white px-7 text-black hover:bg-zinc-200"
            >
              <a href="#register">
                Reserve your seat
                <span className="ml-2">→</span>
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 border-white/15 bg-white/[0.03] px-7 hover:bg-white/10"
            >
              <a href="#speakers">Meet the speakers</a>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm text-zinc-500">
            <span>24–25 OCTOBER 2026</span>
            <span className="text-zinc-700">/</span>
            <span>BANGALORE, INDIA</span>
            <span className="text-zinc-700">/</span>
            <span>2 DAYS</span>
          </div>
        </div>

        <div className="relative hidden h-[520px] lg:block">
          <div className="absolute inset-10 rotate-6 rounded-[3rem] border border-white/10 bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-transparent backdrop-blur-xl" />

          <div className="absolute inset-20 -rotate-6 rounded-[3rem] border border-white/10 bg-black/50 backdrop-blur-2xl" />

          <div className="absolute left-1/2 top-1/2 flex h-64 w-64 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5 shadow-[0_0_120px_rgba(34,211,238,0.15)]">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 blur-[1px]" />
          </div>

          <div className="absolute left-0 top-24 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 backdrop-blur-xl">
            <p className="text-xs text-zinc-500">ATTENDEES</p>
            <p className="mt-1 text-2xl font-semibold">1,200+</p>
          </div>

          <div className="absolute bottom-20 right-0 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 backdrop-blur-xl">
            <p className="text-xs text-zinc-500">SPEAKERS</p>
            <p className="mt-1 text-2xl font-semibold">40+</p>
          </div>
        </div>
      </div>
    </section>
  );
}