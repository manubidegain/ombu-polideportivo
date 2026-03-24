import type { Metadata } from "next";
import { Krona_One, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import { OAuthHandler } from '@/components/auth/OAuthHandler';

const kronaOne = Krona_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-krona",
});

const poppins = Poppins({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Polideportivo Ombú - Durazno",
  description: "El punto de encuentro del deporte en Durazno. Pádel, Fútbol 7 y Fútbol 5.",
  verification: {
    google: "MEDN9SVRsj6GC_LCRV47u4OnfvRlthOgI7nulKCrsVg",
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "Polideportivo Ombú - Durazno",
    description: "El punto de encuentro del deporte en Durazno. Pádel, Fútbol 7 y Fútbol 5.",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${kronaOne.variable} ${poppins.variable} antialiased`}>
        <Toaster position="top-right" richColors />
        <Suspense fallback={null}>
          <OAuthHandler />
        </Suspense>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
