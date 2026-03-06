import type { Metadata } from "next";
import { Krona_One, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Toaster } from 'sonner';

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
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
