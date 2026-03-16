import { requireAdmin } from '@/lib/auth/utils';
import { AdminNav } from '@/components/admin/AdminNav';
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
      <AdminNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
