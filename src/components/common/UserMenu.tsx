'use client';

import { useState, useEffect, useRef } from 'react';
import { Smile, User, Calendar, LogOut, Settings, LogIn, Trophy } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from './LoadingSpinner';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setIsOpen(false);
      router.push('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

  if (loading) {
    return (
      <div className="absolute right-[27px] top-[27px] w-10 h-10 flex items-center justify-center">
        <Smile className="w-7 h-7 animate-pulse" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="absolute right-[27px] top-[27px] w-10 h-10" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-all hover:scale-110 cursor-pointer relative group"
        aria-label="User menu"
      >
        <Smile className={`w-7 h-7 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
        {/* Subtle indicator dot when logged in */}
        {user && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#dbf228] rounded-full border-2 border-[#1b1b1b]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-[#1b1b1b] border border-white/20 rounded-lg shadow-xl overflow-hidden">
          {user ? (
            <>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="font-body text-[14px] text-white font-semibold truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                <p className="font-body text-[12px] text-gray-400 truncate">{user.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-2 px-2 py-1 bg-[#dbf228]/20 text-[#dbf228] font-body text-[10px] rounded">
                    ADMIN
                  </span>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  href="/perfil"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="font-body text-[14px] text-white">Mi Perfil</span>
                </Link>

                <Link
                  href="/perfil?tab=torneos"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="font-body text-[14px] text-white">Mis Torneos</span>
                </Link>

                <Link
                  href="/mis-reservas"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-body text-[14px] text-white">Mis Reservas</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-body text-[14px] text-white">Panel Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-red-400 disabled:opacity-50"
                >
                  {loggingOut ? <ButtonBallSpinner /> : <LogOut className="w-4 h-4" />}
                  <span className="font-body text-[14px]">{loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Not Logged In */
            <div className="py-2">
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="font-body text-[14px] text-white">Iniciar Sesión</span>
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="font-body text-[14px] text-white">Crear Cuenta</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
