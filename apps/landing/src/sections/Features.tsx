import {
  DollarSign,
  BarChart3,
  Gauge,
  Radio,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Cost Overview",
    description:
      "Total spend, daily trends, monthly projections, breakdown by model and provider.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Usage Analytics",
    description:
      "Active users, requests per day, token consumption, top users and models.",
  },
  {
    icon: <Gauge className="h-6 w-6" />,
    title: "Quality Metrics",
    description:
      "Average and P95 latency, error rates, quality scores from Langfuse evaluations.",
  },
  {
    icon: <Radio className="h-6 w-6" />,
    title: "Live Feed",
    description:
      "Real-time stream of every trace with status, cost, latency, and custom dimensions.",
  },
  {
    icon: <SlidersHorizontal className="h-6 w-6" />,
    title: "Custom Dimensions",
    description:
      "Break down costs and usage by any Langfuse metadata field — user, account, feature, plan.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Smart Caching",
    description:
      "Intelligent TTL-based caching that stays within Langfuse rate limits. Works on the free plan.",
  },
];

export function Features() {
  return (
    <section aria-label="Features" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Everything your leadership needs.{" "}
          <span className="text-muted">Nothing they don't.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-foreground-secondary">
          Six views that turn raw Langfuse data into decisions.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="glass-card p-6 transition-all duration-300"
            >
              <div className="mb-4 inline-flex rounded-lg bg-accent-dim p-2.5 text-accent-light">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
