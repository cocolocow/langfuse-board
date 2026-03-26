export type DimensionSource = "trace" | "metadata";
export type DimensionShow = "feed" | "breakdown" | "filter";

export interface Dimension {
  key: string;
  label: string;
  source: DimensionSource;
  show: DimensionShow[];
}

export interface BoardConfig {
  name: string;
  dimensions: Dimension[];
}

export interface DiagnosticField {
  key: string;
  source: DimensionSource;
  coverage: number;
  configured: boolean;
  configuredLabel: string | null;
}

export interface DiagnosticResponse {
  fields: DiagnosticField[];
  tracesScanned: number;
}
