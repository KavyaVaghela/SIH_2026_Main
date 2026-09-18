import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "KaushalyaSetu — Cooperative Gig Services Platform",
  description:
    "A digital platform connecting households with skilled trade workers through local cooperative societies for maintenance, repair, and community services.",
};

export default function HomePage() {
  return <LandingPage />;
}

