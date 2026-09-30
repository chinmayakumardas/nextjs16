"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SpeakerDetails({ speaker }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="mt-5 w-full justify-between px-0 text-zinc-300 hover:bg-transparent hover:text-cyan-300"
        >
          View profile
          <span>↗</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="border-white/10 bg-[#0d0d12] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-3xl">
            {speaker.name}
          </DialogTitle>

          <DialogDescription className="text-zinc-500">
            {speaker.role} · {speaker.company}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <p className="leading-7 text-zinc-400">
            {speaker.details}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {speaker.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-300"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}