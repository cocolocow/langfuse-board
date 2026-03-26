import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "../App";

describe("App", () => {
  it("renders all sections in order", () => {
    render(<App />);

    const sections = screen.getAllByRole("region");
    const ids = sections.map((s) => s.getAttribute("aria-label"));

    expect(ids).toEqual([
      "Hero",
      "Features",
      "Screenshots",
      "Pricing",
      "FAQ",
      "Footer",
    ]);
  });
});
