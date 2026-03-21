import { Instagram, MessageCircle } from 'lucide-react';

import Link from 'next/link';

// Logo desde Figma
const imgLogo = "/logo.png";

export default function Footer() {
  return (
    <footer className="relative bg-[#1b1b1b] text-white min-h-[460px] overflow-hidden">
      <div className="max-w-[1656px] mx-auto px-4 sm:px-8 md:px-16 lg:px-[140px] py-8 md:py-16 lg:py-[91px]">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-[113px] items-start">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="w-[100px] h-[127px] md:w-[122px] md:h-[155px] relative overflow-hidden">
              <img
                src={imgLogo}
                alt="Polideportivo Ombú"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="flex-shrink-0">
            <h3 className="font-heading text-[18px] md:text-[20px] leading-[34px] text-[#dbf228] mb-[7px]">Nuestros contactos</h3>
            <div className="flex flex-col gap-[7px] font-body text-[16px] md:text-[20px] leading-[34px] text-white">
              <p>+598 95 303 311</p>
              <p className="break-all">polideportivocentrounion@gmail.com</p>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="flex-shrink-0">
            <h3 className="font-heading text-[18px] md:text-[20px] leading-[34px] text-[#dbf228] mb-[7px]">Nuestras redes</h3>
            <div className="flex gap-[26px] items-center">
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
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="mt-8 md:mt-16 lg:mt-[151px]">
          <p className="font-body text-[16px] md:text-[20px] leading-[34px] text-[#dbf228]">Martín Salaberry 2831, Durazno.</p>
        </div>

        {/* Links legales */}
        <div className="mt-4">
          <Link
            href="/privacidad"
            className="font-body text-[14px] md:text-[16px] text-gray-400 hover:text-[#dbf228] transition-colors underline"
          >
            Política de Privacidad
          </Link>
        </div>
      </div>

      {/* OMBÚ grande - posicionado absolutamente */}
      <div className="absolute right-2 bottom-2 md:right-4 md:bottom-4 lg:right-[33px] lg:bottom-[33px] font-body font-black text-[80px] sm:text-[120px] md:text-[180px] lg:text-[250px] leading-[100%] lg:leading-[213px] text-[#ededed] pointer-events-none opacity-50 md:opacity-100">
        OMBÚ
      </div>
    </footer>
  );
}
