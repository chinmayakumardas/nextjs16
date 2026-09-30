export function EventSection({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section className="px-6 py-28" id={title.includes("Meet") ? "speakers" : "schedule"}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid gap-6 md:grid-cols-[0.7fr_1.3fr]">
          <div className="flex items-start gap-3 text-sm uppercase tracking-[0.25em] text-cyan-400">
            <span className="mt-2 h-px w-8 bg-cyan-400" />
            {eyebrow}
          </div>

          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              {title}
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-500">
              {description}
            </p>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}