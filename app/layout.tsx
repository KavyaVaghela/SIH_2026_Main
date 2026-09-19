import "./globals.css";

export const metadata = {
  title: "KaushalyaSetu — Community Owned Digital Marketplace",
  description: "Cooperative-owned digital service marketplace connecting workers, customers, and federations.",
  icons: {
    icon: "/images/kaushalyasetu-logo.png",
    shortcut: "/images/kaushalyasetu-logo.png",
    apple: "/images/kaushalyasetu-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
