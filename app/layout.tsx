// Root Architectural Layout Placeholder
import "./globals.css";

export const metadata = {
  title: "Cooperative Gig Services Platform",
  description: "Cooperative-owned digital service marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
