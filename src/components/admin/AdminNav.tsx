'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/courts', label: 'Canchas' },
  { href: '/admin/timeslots', label: 'Horarios' },
  { href: '/admin/pricing', label: 'Precios' },
  { href: '/admin/reservations', label: 'Reservas' },
  { href: '/admin/torneos', label: 'Torneos' },
  { href: '/admin/blocked-dates', label: 'Bloqueos' },
  { href: '/admin/settings', label: 'Configuración' },
];

export function AdminNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="bg-black border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="font-heading text-[16px] sm:text-[20px] text-white">
              POLIDEPORTIVO OMBÚ
            </Link>
            <span className="hidden sm:inline font-body text-[12px] sm:text-[14px] text-[#dbf228]">
              Panel de Administración
            </span>
            <span className="sm:hidden font-body text-[10px] text-[#dbf228]">
              Admin
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-body text-[14px] transition-colors ${
                  isActive(link.href)
                    ? 'text-[#dbf228]'
                    : 'text-white hover:text-[#dbf228]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white hover:text-[#dbf228] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-body text-[14px] transition-colors py-2 ${
                    isActive(link.href)
                      ? 'text-[#dbf228]'
                      : 'text-white hover:text-[#dbf228]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
