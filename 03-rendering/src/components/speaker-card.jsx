import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { SpeakerDetails } from "./speaker-details";

export function SpeakerCard({ speaker }) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] transition duration-500 hover:-translate-y-2 hover:border-cyan-400/30 hover:bg-white/[0.06]">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={speaker.image}
          alt={speaker.name}
          fill
          className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

        <div className="absolute bottom-4 left-4">
          <Badge className="border-0 bg-white/10 text-white backdrop-blur-md">
            {speaker.company}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-medium">
          {speaker.name}
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          {speaker.role}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {speaker.topics.slice(0, 2).map((topic) => (
            <span
              key={topic}
              className="text-xs text-zinc-600"
            >
              #{topic.replaceAll(" ", "")}
            </span>
          ))}
        </div>

        <SpeakerDetails speaker={speaker} />
      </div>
    </article>
  );
}