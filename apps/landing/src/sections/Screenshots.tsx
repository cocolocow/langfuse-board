export function Screenshots() {
  return (
    <section aria-label="Screenshots" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          See it in action
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-foreground-secondary">
          Designed for clarity. No training required.
        </p>

        <div className="mt-14 space-y-16">
          <div>
            <img
              src="/screenshot-overview.png"
              alt="Overview dashboard showing KPIs at a glance"
              className="w-full rounded-2xl border border-border shadow-xl"
            />
            <p className="mt-4 text-center text-sm text-muted">
              KPIs at a glance — total cost, requests, response time, error rate
            </p>
          </div>

          <div>
            <img
              src="/screenshot-costs.png"
              alt="Cost breakdown by model, provider, user and account"
              className="w-full rounded-2xl border border-border shadow-xl"
            />
            <p className="mt-4 text-center text-sm text-muted">
              Cost breakdown by model, provider, user and account
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
