const faqs = [
  {
    question: "What is Langfuse?",
    answer:
      "Langfuse is the leading open-source platform for LLM observability. It tracks every call your application makes to AI models — cost, latency, inputs, outputs. langfuse-board plugs into your Langfuse data and turns it into a dashboard anyone can read.",
  },
  {
    question: "Do I need a paid Langfuse plan?",
    answer:
      "No. langfuse-board works on the Langfuse free tier (100 API calls/day). Smart caching keeps requests well within that limit. For higher refresh rates, a paid Langfuse plan helps but isn't required.",
  },
  {
    question: "How is this different from Langfuse's built-in dashboard?",
    answer:
      "Langfuse is built for engineers — traces, spans, evaluations. langfuse-board is built for the people who pay the bills. It shows costs, trends, and projections in a format that doesn't require technical context.",
  },
  {
    question: "Can I customize what metrics are shown?",
    answer:
      "Yes. Edit board.config.json to define custom dimensions from your Langfuse metadata — break down costs by user, account, feature, plan, or any field you track.",
  },
  {
    question: "Is the cloud version different from self-hosted?",
    answer:
      "Same core product. The cloud version adds managed hosting, faster refresh rates, and priority support — so you don't have to maintain the infrastructure yourself.",
  },
];

export function Faq() {
  return (
    <section aria-label="FAQ" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-14 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question} className="glass-card p-6">
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
