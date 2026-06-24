import GrainOverlay from "./components/GrainOverlay";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import DeferredCustomCursor from "./components/DeferredCustomCursor";
import { AttributionLandingSetup } from "./components/AttributionLandingSetup";

export default function Home() {
  return (
    <>
      <AttributionLandingSetup />
      <GrainOverlay />
      <DeferredCustomCursor />
      <Navbar />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </>
  );
}
