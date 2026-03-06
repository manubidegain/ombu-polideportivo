'use client';

import { Instagram, MapPin, MessageCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import UserMenu from './UserMenu';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="bg-[#1b1b1b] text-white sticky top-0 z-50 border-b border-white">
        <div className="w-full px-4 md:px-8 lg:px-[142px]">
          <div className="flex items-center justify-between h-[89px]">
            {/* Logo */}
            <Link href="/" className="font-heading text-[18px] sm:text-[20px] md:text-[24px] leading-[100%]">
              POLIDEPORTIVO OMBÚ
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-[39px]">
              <Link
                href="/reservas"
                className="font-heading text-[24px] leading-[100%] hover:text-gray-300 transition-colors px-2.5 py-2.5"
              >
                RESERVAR
              </Link>
              <Link
                href="/torneos"
                className="font-heading text-[24px] leading-[100%] hover:text-gray-300 transition-colors px-2.5 py-2.5"
              >
                TORNEOS
              </Link>
              <Link
                href="/rankings"
                className="font-heading text-[24px] leading-[100%] hover:text-gray-300 transition-colors px-2.5 py-2.5"
              >
                RANKING
              </Link>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white hover:text-[#dbf228] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1b1b1b] border-t border-white">
            <div className="px-4 py-4 space-y-4">
              <Link
                href="/reservas"
                className="block font-heading text-[20px] hover:text-[#dbf228] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                RESERVAR
              </Link>
              <Link
                href="/torneos"
                className="block font-heading text-[20px] hover:text-[#dbf228] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                TORNEOS
              </Link>
              <Link
                href="/rankings"
                className="block font-heading text-[20px] hover:text-[#dbf228] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                RANKING
              </Link>
              <div className="pt-2 border-t border-white/10">
                <UserMenu />
              </div>
              {/* Mobile Social Links */}
              <div className="flex gap-6 pt-4 border-t border-white/10">
                <a
                  href="https://www.instagram.com/polideportivo.ombu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-pink-500 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-[28.8px] h-[28.8px]" strokeWidth={1.5} />
                </a>
                <a
                  href="https://wa.me/59895303311"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-500 transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-[28.8px] h-[28.8px]" strokeWidth={1.5} />
                </a>
                <a
                  href="https://maps.google.com/?q=Martín+Salaberry+2831,+Durazno"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-500 transition-colors"
                  aria-label="Ubicación"
                >
                  <MapPin className="w-8 h-8" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Vertical Social Bar (Right Side) - Desktop Only */}
      <div className="hidden lg:flex fixed right-0 top-0 bg-[#1b1b1b] w-[72px] h-screen flex-col items-center border-l border-white z-40">
        {/* Espacio superior */}
        <div className="h-[89px] w-full" />

        {/* Texto vertical "NUESTRAS REDES" */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="writing-mode-vertical-rl font-heading text-[24px] leading-[100%] text-white whitespace-nowrap transform rotate-180">
            NUESTRAS REDES
          </div>
        </div>

        {/* Línea horizontal divisoria */}
        <div className="w-full h-px bg-white" />

        {/* Iconos sociales */}
        <div className="flex flex-col items-center gap-[67px] py-8">
          <a
            href="https://www.instagram.com/polideportivo.ombu/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-pink-500 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-[28.8px] h-[28.8px]" strokeWidth={1.5} />
          </a>
          <a
            href="https://wa.me/59895303311"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-green-500 transition-colors"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-[28.8px] h-[28.8px]" strokeWidth={1.5} />
          </a>
          <a
            href="https://maps.google.com/?q=Martín+Salaberry+2831,+Durazno"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-blue-500 transition-colors"
            aria-label="Ubicación"
          >
            <MapPin className="w-8 h-8" strokeWidth={1.5} />
          </a>
        </div>

        {/* Espacio inferior para empujar los iconos hacia arriba */}
        <div className="flex-1" />
      </div>
    </>
  );
}
