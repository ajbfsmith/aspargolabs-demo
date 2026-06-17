import GrainOverlay from "./components/GrainOverlay";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import CustomCursor from "./components/CustomCursor";
import { AttributionLandingSetup } from "./components/AttributionLandingSetup";

export default function Home() {
  return (
    <>
      <AttributionLandingSetup />
      <GrainOverlay />
      <CustomCursor />
      <Navbar />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </>
  );
}
