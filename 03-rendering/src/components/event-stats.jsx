export function EventStats() {
  const stats = [
    ["1,200+", "Attendees"],
    ["40+", "Speakers"],
    ["20+", "Sessions"],
    ["02", "Days"],
  ];

  return (
    <section className="border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
        {stats.map(([number, label], index) => (
          <div
            key={label}
            className={`px-6 py-10 ${
              index !== 0 ? "border-l border-white/10" : ""
            }`}
          >
            <p className="text-4xl font-semibold tracking-tight md:text-5xl">
              {number}
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-zinc-500">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}