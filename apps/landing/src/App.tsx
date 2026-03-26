import { Hero } from "./sections/Hero";
import { Features } from "./sections/Features";
import { Screenshots } from "./sections/Screenshots";
import { Pricing } from "./sections/Pricing";
import { Faq } from "./sections/Faq";
import { Footer } from "./sections/Footer";

export function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Screenshots />
      <Pricing />
      <Faq />
      <Footer />
    </div>
  );
}
