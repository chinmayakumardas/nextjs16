import { Badge } from "@/components/ui/badge";

export function Schedule({ schedule }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="hidden grid-cols-[130px_1fr_160px] border-b border-white/10 bg-white/[0.03] px-6 py-4 text-xs uppercase tracking-[0.2em] text-zinc-600 md:grid">
        <span>Time</span>
        <span>Session</span>
        <span>Track</span>
      </div>

      {schedule.map((item, index) => (
        <div
          key={item.title}
          className="grid gap-5 border-b border-white/10 px-6 py-7 last:border-0 md:grid-cols-[130px_1fr_160px] md:items-center"
        >
          <div>
            <span className="text-2xl font-semibold">
              {item.time}
            </span>

            <span className="ml-1 text-xs text-zinc-600">
              {item.period}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-medium">
              {item.title}
            </h3>

            <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
              {item.description}
            </p>
          </div>

          <Badge
            variant="outline"
            className="w-fit border-white/10 text-zinc-500"
          >
            {item.track}
          </Badge>
        </div>
      ))}
    </div>
  );
}