'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setValidSession(true);
      } else {
        setError('El enlace de recuperación es inválido o ha expirado');
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Password updated successfully
    router.push('/auth/password-updated');
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1b1b1b] px-4">
        <div className="text-center">
          <ButtonBallSpinner />
          <p className="font-body text-[16px] text-white mt-4">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1b1b1b] px-4">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-red-500/10 border border-red-500 rounded-md p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="font-heading text-[28px] text-red-500 mb-3">ENLACE INVÁLIDO</h2>

            <p className="font-body text-[16px] text-white mb-4">{error}</p>

            <Link
              href="/auth/reset-password"
              className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-3 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
            >
              SOLICITAR NUEVO ENLACE
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-block font-body text-[14px] text-[#dbf228] hover:underline"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b1b1b] px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="font-heading text-[32px] text-white text-center">
            NUEVA CONTRASEÑA
          </h2>
          <p className="mt-2 text-center font-body text-[16px] text-gray-400">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="font-body text-[14px] text-white block mb-2">
                Nueva Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-body text-[16px] text-black focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                placeholder="••••••••"
              />
              <p className="font-body text-[12px] text-gray-400 mt-1">
                Mínimo 6 caracteres
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="font-body text-[14px] text-white block mb-2"
              >
                Confirmar Nueva Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-body text-[16px] text-black focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
              <p className="font-body text-[14px] text-red-500">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-4 rounded-md hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <ButtonBallSpinner />}
            {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
          </button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-block font-body text-[14px] text-[#dbf228] hover:underline"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
