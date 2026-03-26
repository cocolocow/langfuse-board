import { Check, Github } from "lucide-react";

const selfHostedFeatures = [
  "All dashboard features",
  "MIT license",
  "Self-host anywhere",
  "Community support",
  "Unlimited users",
];

const cloudFeatures = [
  "Everything in Self-hosted",
  "Managed hosting",
  "Auto-refresh & smart cache",
  "Priority support",
  "Custom domain",
];

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Free to self-host. Cloud when you need it.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-foreground-secondary">
          Open source forever. Pay only if you want us to host it.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Self-hosted */}
          <div className="glass-card flex flex-col p-8">
            <div className="text-sm font-medium uppercase tracking-wider text-muted">
              Self-hosted
            </div>
            <div className="mt-2 text-4xl font-bold">Free</div>
            <p className="mt-2 text-sm text-foreground-secondary">
              Deploy on your own infra. Full access to everything.
            </p>

            <ul className="mt-8 flex-1 space-y-3">
              {selfHostedFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-foreground-secondary"
                >
                  <Check className="h-4 w-4 shrink-0 text-positive" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href="https://github.com/cocolocow/langfuse-board"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 font-semibold text-background transition hover:bg-foreground/90"
            >
              <Github className="h-5 w-5" />
              Get started
            </a>
          </div>

          {/* Cloud */}
          <div className="glass-card relative flex flex-col border-accent/30 p-8">
            <div className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
              Coming soon
            </div>
            <div className="text-sm font-medium uppercase tracking-wider text-muted">
              Cloud
            </div>
            <div className="mt-2 text-4xl font-bold">
              Coming soon
            </div>
            <p className="mt-2 text-sm text-foreground-secondary">
              We host it. You get a link. Your CEO bookmarks it.
            </p>

            <ul className="mt-8 flex-1 space-y-3">
              {cloudFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-foreground-secondary"
                >
                  <Check className="h-4 w-4 shrink-0 text-accent-light" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href="mailto:hello@langfuse-board.io?subject=Cloud%20Waitlist"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent-dim px-6 py-3 font-semibold text-accent-light transition hover:bg-accent/20"
            >
              Join waitlist
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
