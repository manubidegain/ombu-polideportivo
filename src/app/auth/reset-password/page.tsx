'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1b1b1b] px-4">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-[#dbf228]/10 border border-[#dbf228] rounded-md p-8 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-[#dbf228] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#1b1b1b]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="font-heading text-[28px] text-[#dbf228] mb-3">
              ¡EMAIL ENVIADO!
            </h2>

            <p className="font-body text-[16px] text-white mb-2">
              Te enviamos un enlace de recuperación a:
            </p>
            <p className="font-body text-[16px] text-[#dbf228] font-semibold mb-4">{email}</p>

            <div className="bg-white/5 rounded-md p-4 mb-4">
              <p className="font-body text-[14px] text-gray-300">
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace para restablecer tu
                contraseña.
              </p>
            </div>

            <p className="font-body text-[12px] text-gray-400">
              El enlace es válido por 1 hora. ¿No ves el email? Revisa tu carpeta de spam.
            </p>
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
            RECUPERAR CONTRASEÑA
          </h2>
          <p className="mt-2 text-center font-body text-[16px] text-gray-400">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="font-body text-[14px] text-white block mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-body text-[16px] text-black focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              placeholder="tu@email.com"
            />
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
            {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
          </button>

          <div className="text-center space-y-2">
            <p className="font-body text-[14px] text-gray-400">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/auth/login" className="text-[#dbf228] hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
            <p className="font-body text-[14px] text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/signup" className="text-[#dbf228] hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
