import type { Metadata } from "next";
import { dmSans, lora, ibmPlexMono, instrumentSerif } from "./fonts";
import { getSiteUrl } from "@/lib/attribution/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Accelerate Health Blog | Men's Sexual Health & Drug Delivery Science",
    template: "%s | Accelerate Health Blog",
  },
  description:
    "Evidence-based articles on men's sexual health, erectile dysfunction, PDE5 pharmacology, and drug delivery innovation from the Accelerate Health editorial team.",
  keywords: [
    "Accelerate Health",
    "men's sexual health",
    "erectile dysfunction",
    "blog",
    "PDE5 inhibitors",
    "drug delivery",
    "pharmaceutical science",
  ],
  openGraph: {
    title: "Accelerate Health Blog | Men's Sexual Health & Drug Delivery Science",
    description:
      "Evidence-based articles on men's sexual health, erectile dysfunction, and drug delivery innovation.",
    type: "website",
  },
  icons: {
    icon: "/images/Logo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${lora.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <body className="min-h-screen bg-void text-text-primary overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
