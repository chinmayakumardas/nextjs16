"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegistrationForm() {
  const [registered, setRegistered] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    setRegistered(true);
  }

  if (registered) {
    return (
      <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/[0.05] p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-2xl text-emerald-400">
          ✓
        </div>

        <h3 className="mt-7 text-3xl font-semibold">
          You're on the list.
        </h3>

        <p className="mt-3 leading-7 text-zinc-500">
          Registration successful. We'll send the event details
          and your attendee pass to your email.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl md:p-9"
    >
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
          Your details
        </p>

        <h3 className="mt-2 text-2xl font-semibold">
          Reserve your seat
        </h3>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full name
          </Label>

          <Input
            id="name"
            name="name"
            required
            placeholder="Alex Morgan"
            className="h-12 border-white/10 bg-black/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email address
          </Label>

          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="alex@example.com"
            className="h-12 border-white/10 bg-black/30"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-13 w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:opacity-90"
        >
          Complete registration
          <span className="ml-2">→</span>
        </Button>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-zinc-600">
        By registering, you agree to receive event-related
        communications.
      </p>
    </form>
  );
}