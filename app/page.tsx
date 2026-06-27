import GrainOverlay from "./components/GrainOverlay";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import DeferredCustomCursor from "./components/DeferredCustomCursor";

export default function Home() {
  return (
    <>
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
