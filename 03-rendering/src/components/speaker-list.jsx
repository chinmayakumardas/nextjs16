import { SpeakerCard } from "./speaker-card";

export function SpeakerList({ speakers }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {speakers.map((speaker) => (
        <SpeakerCard
          key={speaker.id}
          speaker={speaker}
        />
      ))}
    </div>
  );
}