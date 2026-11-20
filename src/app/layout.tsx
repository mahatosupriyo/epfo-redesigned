import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "EPFO Member Services",
  description: "An individual member portal designed for a college assignment.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body style={{margin: 0}}>{children}</body></html>;
}
