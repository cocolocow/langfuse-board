import { Github, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden px-6 pt-20 pb-16 md:pt-32 md:pb-24"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-dim px-4 py-1.5 text-sm text-accent-light">
          <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
          Open source &middot; MIT License
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          A dashboard your{" "}
          <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
            CEO can actually read
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground-secondary md:text-xl">
          Connect your Langfuse. See your AI costs, usage, and quality — in one
          screen, no traces, no jargon. Built for the people who pay for the AI,
          not the people who build it.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://github.com/cocolocow/langfuse-board"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 font-semibold text-background transition hover:bg-foreground/90"
          >
            <Github className="h-5 w-5" />
            Star on GitHub
          </a>
          <a
            href="https://tally.so/r/BzZ2RA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-dim px-6 py-3 font-semibold text-accent-light transition hover:bg-accent/20"
          >
            Try Cloud
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-16">
          <img
            src="/screenshot-overview.png"
            alt="langfuse-board dashboard overview"
            className="mx-auto w-full max-w-4xl rounded-2xl border border-border shadow-2xl glow-accent"
          />
        </div>
      </div>
    </section>
  );
}
