import { requireAdmin } from '@/lib/auth/utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-[#1b1b1b]">
      {/* Admin Navigation */}
      <nav className="bg-black border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-heading text-[20px] text-white">
                POLIDEPORTIVO OMBÚ
              </Link>
              <span className="font-body text-[14px] text-[#dbf228]">
                Panel de Administración
              </span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="font-body text-[14px] text-white hover:text-[#dbf228] transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/courts"
                className="font-body text-[14px] text-white hover:text-[#dbf228] transition-colors"
              >
                Canchas
              </Link>
              <Link
                href="/admin/timeslots"
                className="font-body text-[14px] text-white hover:text-[#dbf228] transition-colors"
              >
                Horarios
              </Link>
              <Link
                href="/admin/pricing"
                className="font-body text-[14px] text-white hover:text-[#dbf228] transition-colors"
              >
                Precios
              </Link>
              <Link
                href="/admin/reservations"
                className="font-body text-[14px] text-white hover:text-[#dbf228] transition-colors"
              >
                Reservas
              </Link>
              <Link
                href="/admin/blocked-dates"
                className="font-body text-[14px] text-white hover:text-[#dbf228] transition-colors"
              >
                Bloqueos
              </Link>
              <Link
                href="/admin/settings"
                className="font-body text-[14px] text-white hover:text-[#dbf228] transition-colors"
              >
                Configuración
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
