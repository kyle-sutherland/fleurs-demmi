import type { Metadata } from "next";
import { Courier_Prime } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fleurs d'Emmi",
  description: "Flowers & things · Montréal florist",
  openGraph: {
    title: "Fleurs d'Emmi",
    description: "Flowers & things · Montréal florist",
    siteName: "Fleurs d'Emmi",
    locale: "fr_CA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Fleurs d'Emmi",
    description: "Flowers & things · Montréal florist",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = h.get("x-locale") ?? "en";

  return (
    <html
      lang={locale}
      className={`${courierPrime.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full w-full flex flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
