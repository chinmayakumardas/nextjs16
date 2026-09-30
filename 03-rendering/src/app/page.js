import { Navbar } from "@/components/navbar";
import { EventHero } from "@/components/event-hero";
import { EventStats } from "@/components/event-stats";
import { EventSection } from "@/components/event-section";
import { SpeakerList } from "@/components/speaker-list";
import { Schedule } from "@/components/schedule";
import { RegistrationForm } from "@/components/registration-form";
import { Footer } from "@/components/footer";

const speakers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Senior Software Engineer",
    company: "Google",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
    details:
      "Sarah works on distributed systems and large-scale web infrastructure. She has spent more than 10 years building reliable developer platforms.",
    topics: ["Distributed Systems", "Cloud", "Architecture"],
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Engineering Manager",
    company: "Microsoft",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    details:
      "Michael leads engineering teams working on cloud infrastructure and developer productivity.",
    topics: ["Leadership", "Azure", "Developer Tools"],
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "Frontend Architect",
    company: "Vercel",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80",
    details:
      "Emily focuses on React, Next.js, frontend performance and the future of web applications.",
    topics: ["React", "Next.js", "Performance"],
  },
  {
    id: 4,
    name: "Daniel Wilson",
    role: "AI Researcher",
    company: "OpenAI",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    details:
      "Daniel researches practical applications of AI and modern developer tooling.",
    topics: ["AI", "LLMs", "Developer Experience"],
  },
];

const schedule = [
  {
    time: "09:00",
    period: "AM",
    title: "Registration & Coffee",
    description: "Check in, grab your badge and meet fellow attendees.",
    track: "Arrival",
  },
  {
    time: "10:00",
    period: "AM",
    title: "Opening Keynote",
    description: "The future of software development and the web.",
    track: "Main Stage",
  },
  {
    time: "11:30",
    period: "AM",
    title: "React & Next.js in 2026",
    description: "Building modern applications with React Server Components.",
    track: "Track A",
  },
  {
    time: "01:00",
    period: "PM",
    title: "Lunch & Networking",
    description: "Connect with developers, founders and technology leaders.",
    track: "Networking",
  },
  {
    time: "02:30",
    period: "PM",
    title: "Modern Web Architecture",
    description: "Patterns for scalable and maintainable applications.",
    track: "Track B",
  },
  {
    time: "04:00",
    period: "PM",
    title: "AI × Developers",
    description: "How AI is changing the way we build software.",
    track: "Main Stage",
  },
];

export default function Home() {
  const registrationOpen = true;

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070a] text-white">
      <Navbar />

      <EventHero registrationOpen={registrationOpen} />

      <EventStats />

      <EventSection
        eyebrow="02 / SPEAKERS"
        title="Meet the people"
        description="Engineers, researchers and builders shaping the next generation of technology."
      >
        <SpeakerList speakers={speakers} />
      </EventSection>

      <EventSection
        eyebrow="03 / SCHEDULE"
        title="Two days of ideas."
        description="A carefully curated program covering the technologies transforming how we build."
      >
        <Schedule schedule={schedule} />
      </EventSection>

      <section
        id="register"
        className="relative border-t border-white/10 px-6 py-28"
      >
        <div className="pointer-events-none absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <div className="mb-5 flex items-center gap-3 text-sm uppercase tracking-[0.25em] text-cyan-400">
                <span className="h-px w-8 bg-cyan-400" />
                04 / REGISTRATION
              </div>

              <h2 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
                Be part of
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">
                  what comes next.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
                Reserve your seat and join thousands of developers,
                designers and technology leaders for two days of ideas,
                conversations and connections.
              </p>
            </div>

            {registrationOpen ? (
              <RegistrationForm />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10">
                <p className="text-xl font-medium">
                  Registration Closed
                </p>
                <p className="mt-2 text-zinc-500">
                  Registration for this event is no longer available.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}