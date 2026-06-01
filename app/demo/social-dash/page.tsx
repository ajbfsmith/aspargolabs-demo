import type { Metadata } from "next";
import GrainOverlay from "../../components/GrainOverlay";
import SocialDashDemoClient from "./SocialDashDemoClient";

export const metadata: Metadata = {
  title: "Social Dash Demo · Aspargo Labs",
  description:
    "Interactive walkthrough of Social Dash multi-platform agent strategy — synced to live demo recording.",
};

export default function SocialDashDemoPage() {
  return (
    <>
      <GrainOverlay />
      <SocialDashDemoClient />
    </>
  );
}
