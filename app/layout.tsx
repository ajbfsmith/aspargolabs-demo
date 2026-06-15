import type { Metadata } from "next";
import { dmSans, lora, ibmPlexMono, instrumentSerif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accelerate Health — Precision Drug Delivery, Reimagined",
  description:
    "HEZKUE® is the world's first oral sildenafil spray — absorbed within 5 minutes, precisely dosed, and designed for the life you actually live. Accelerate Health is reinventing drug delivery through oral spray suspension technology.",
  keywords: [
    "Accelerate Health",
    "HEZKUE",
    "sildenafil spray",
    "oral suspension",
    "pharmaceutical",
    "drug delivery",
    "biotech",
  ],
  openGraph: {
    title: "Accelerate Health — Precision Drug Delivery, Reimagined",
    description:
      "HEZKUE® is the world's first oral sildenafil spray — absorbed within 5 minutes, precisely dosed.",
    type: "website",
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
