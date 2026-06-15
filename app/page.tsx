import GrainOverlay from "./components/GrainOverlay";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ManifestoSection from "./components/ManifestoSection";
import Footer from "./components/Footer";
import CustomCursor from "./components/CustomCursor";

export default function Home() {
  return (
    <>
      <GrainOverlay />
      <CustomCursor />
      <Navbar />
      <main>
        <HeroSection />
        <ManifestoSection />
      </main>
      <Footer />
    </>
  );
}
