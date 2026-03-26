import { Github } from "lucide-react";

export function Footer() {
  return (
    <section aria-label="Footer" className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">
          Ready to see what your AI really costs?
        </h2>
        <p className="mt-3 text-foreground-secondary">
          Deploy in 2 minutes. No sign-up required.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://github.com/cocolocow/langfuse-board"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 font-semibold text-background transition hover:bg-foreground/90"
          >
            <Github className="h-5 w-5" />
            Star on GitHub
          </a>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-muted">
          <a
            href="https://github.com/cocolocow/langfuse-board"
            className="transition hover:text-foreground-secondary"
          >
            GitHub
          </a>
          <span>&middot;</span>
          <span>MIT License</span>
          <span>&middot;</span>
          <span>langfuse-board</span>
        </div>
      </div>
    </section>
  );
}
