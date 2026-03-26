import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hero } from "../sections/Hero";
import { Features } from "../sections/Features";
import { Screenshots } from "../sections/Screenshots";
import { Pricing } from "../sections/Pricing";
import { Faq } from "../sections/Faq";
import { Footer } from "../sections/Footer";

describe("Hero", () => {
  it("renders tagline text", () => {
    render(<Hero />);
    expect(
      screen.getByText(/CEO can actually read/i),
    ).toBeInTheDocument();
  });

  it("renders GitHub CTA with correct href", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: /github/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/cocolocow/langfuse-board",
    );
  });

  it("renders Cloud waitlist CTA", () => {
    render(<Hero />);
    expect(
      screen.getByRole("link", { name: /cloud/i }),
    ).toBeInTheDocument();
  });

  it("renders hero screenshot image with alt text", () => {
    render(<Hero />);
    expect(
      screen.getByAltText(/langfuse-board dashboard overview/i),
    ).toBeInTheDocument();
  });
});

describe("Features", () => {
  it("renders section heading", () => {
    render(<Features />);
    expect(
      screen.getByRole("heading", { name: /everything your leadership/i }),
    ).toBeInTheDocument();
  });

  it("renders 6 feature cards", () => {
    render(<Features />);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(6);
  });

  it("each card has a title and description", () => {
    render(<Features />);
    const cards = screen.getAllByRole("article");
    for (const card of cards) {
      expect(card.querySelector("h3")).toBeTruthy();
      expect(card.querySelector("p")).toBeTruthy();
    }
  });
});

describe("Screenshots", () => {
  it("renders overview screenshot with alt text", () => {
    render(<Screenshots />);
    expect(
      screen.getByAltText(/overview dashboard/i),
    ).toBeInTheDocument();
  });

  it("renders costs screenshot with alt text", () => {
    render(<Screenshots />);
    expect(screen.getByAltText(/cost breakdown/i)).toBeInTheDocument();
  });

  it("renders captions for each screenshot", () => {
    render(<Screenshots />);
    expect(screen.getByText(/KPIs at a glance/i)).toBeInTheDocument();
    expect(
      screen.getByText(/cost breakdown by model/i),
    ).toBeInTheDocument();
  });
});

describe("Pricing", () => {
  it("renders Self-hosted card with Free label", () => {
    render(<Pricing />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Self-hosted")).toBeInTheDocument();
  });

  it("renders Cloud card with Coming Soon label", () => {
    render(<Pricing />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
  });

  it("self-hosted card links to GitHub", () => {
    render(<Pricing />);
    const link = screen.getByRole("link", { name: /get started/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/cocolocow/langfuse-board",
    );
  });

  it("cloud card has waitlist button", () => {
    render(<Pricing />);
    expect(
      screen.getByRole("link", { name: /join waitlist/i }),
    ).toBeInTheDocument();
  });

  it("self-hosted card lists key features", () => {
    render(<Pricing />);
    expect(screen.getByText("MIT license")).toBeInTheDocument();
    expect(screen.getByText("Self-host anywhere")).toBeInTheDocument();
    expect(screen.getByText("Community support")).toBeInTheDocument();
  });

  it("cloud card lists key features", () => {
    render(<Pricing />);
    expect(screen.getByText("Managed hosting")).toBeInTheDocument();
    expect(screen.getByText("Priority support")).toBeInTheDocument();
  });
});

describe("FAQ", () => {
  it("renders FAQ heading", () => {
    render(<Faq />);
    expect(
      screen.getByRole("heading", { name: /frequently asked/i }),
    ).toBeInTheDocument();
  });

  it("renders at least 4 questions", () => {
    render(<Faq />);
    const questions = screen.getAllByRole("heading", { level: 3 });
    expect(questions.length).toBeGreaterThanOrEqual(4);
  });
});

describe("Footer", () => {
  it("renders GitHub links", () => {
    render(<Footer />);
    const links = screen.getAllByRole("link", { name: /github/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const link of links) {
      expect(link).toHaveAttribute(
        "href",
        "https://github.com/cocolocow/langfuse-board",
      );
    }
  });

  it("renders MIT license mention", () => {
    render(<Footer />);
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });
});
