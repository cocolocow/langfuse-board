import { useConfig, useDiagnostic } from "../hooks/use-config.js";
import { Loader, ErrorState } from "../components/Loader.js";
import { Settings as SettingsIcon, Check, X } from "lucide-react";
import type { DiagnosticField } from "@langfuse-board/shared";

function CoverageBar({ coverage }: { coverage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(coverage, 100)}%` }}
        />
      </div>
      <span className="font-mono text-xs text-muted">{coverage.toFixed(0)}%</span>
    </div>
  );
}

function DiagnosticRow({ field }: { field: DiagnosticField }) {
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-2.5 font-mono text-sm">{field.key}</td>
      <td className="py-2.5">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            field.source === "trace"
              ? "bg-accent/10 text-accent"
              : "bg-warning/10 text-warning"
          }`}
        >
          {field.source}
        </span>
      </td>
      <td className="py-2.5">
        <CoverageBar coverage={field.coverage} />
      </td>
      <td className="py-2.5 text-right">
        {field.configured ? (
          <span className="inline-flex items-center gap-1 text-xs text-positive">
            <Check className="h-3 w-3" />
            {field.configuredLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <X className="h-3 w-3" />
            Not configured
          </span>
        )}
      </td>
    </tr>
  );
}

export function Settings() {
  const { data: config, isLoading: configLoading } = useConfig();
  const { data: diagnostic, isLoading: diagLoading, error: diagError } = useDiagnostic();

  if (configLoading) return <Loader />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-5 w-5 text-accent" />
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>

      {/* Current config */}
      <section className="animate-fade-in rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Current Configuration</h2>
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider text-muted">Board name</span>
          <p className="mt-1 font-mono text-sm">{config?.name ?? "langfuse-board"}</p>
        </div>

        {config && config.dimensions.length > 0 ? (
          <div>
            <span className="text-xs uppercase tracking-wider text-muted">Dimensions</span>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs font-medium text-muted">Key</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted">Label</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted">Source</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted">Show in</th>
                  </tr>
                </thead>
                <tbody>
                  {config.dimensions.map((dim) => (
                    <tr key={dim.key} className="border-b border-border/50 last:border-0">
                      <td className="py-2 font-mono text-xs">{dim.key}</td>
                      <td className="py-2 text-sm">{dim.label}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            dim.source === "trace"
                              ? "bg-accent/10 text-accent"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {dim.source}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-muted">{dim.show.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No dimensions configured. Using defaults.</p>
        )}

        <p className="mt-4 text-xs text-muted">
          Edit <code className="rounded bg-background px-1.5 py-0.5 font-mono">board.config.json</code> to change configuration.
        </p>
      </section>

      {/* Diagnostic */}
      <section className="animate-fade-in rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Detected Fields</h2>
        <p className="mb-4 text-xs text-muted">
          Scanned recent traces to discover available metadata fields.
        </p>

        {diagLoading && <Loader />}
        {diagError && <ErrorState message={diagError.message} />}

        {diagnostic && (
          <>
            <p className="mb-3 text-xs text-muted">
              {diagnostic.tracesScanned} traces scanned
            </p>
            {diagnostic.fields.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs font-medium text-muted">Field</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted">Source</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted">Coverage</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostic.fields.map((field) => (
                    <DiagnosticRow key={field.key} field={field} />
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-4 text-center text-sm text-muted">
                No metadata fields detected. Make sure your traces include metadata.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
