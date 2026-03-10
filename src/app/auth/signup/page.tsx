'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
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

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          phone,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: authData.user.id,
        phone,
        whatsapp_notifications: true,
        email_notifications: true,
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
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
              ¡REGISTRO EXITOSO!
            </h2>

            <p className="font-body text-[16px] text-white mb-2">
              Te enviamos un email de confirmación a:
            </p>
            <p className="font-body text-[16px] text-[#dbf228] font-semibold mb-4">
              {email}
            </p>

            <div className="bg-white/5 rounded-md p-4 mb-4">
              <p className="font-body text-[14px] text-gray-300">
                Por favor, revisa tu bandeja de entrada y haz clic en el botón de confirmación
                para activar tu cuenta.
              </p>
            </div>

            <p className="font-body text-[12px] text-gray-400">
              ¿No ves el email? Revisa tu carpeta de spam o correo no deseado.
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

  const redirectTo = searchParams.get('redirect') || undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b1b1b] px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="font-heading text-[32px] text-white text-center">
            CREAR CUENTA
          </h2>
          <p className="mt-2 text-center font-body text-[16px] text-gray-400">
            Regístrate en Polideportivo Ombú
          </p>
        </div>

        {/* Google Sign In */}
        <div className="space-y-4">
          <GoogleSignInButton mode="signup" redirectTo={redirectTo} />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1b1b1b] text-gray-400">O regístrate con email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          <div className="space-y-4">
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

            <div>
              <label htmlFor="phone" className="font-body text-[14px] text-white block mb-2">
                Teléfono (WhatsApp)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md font-body text-[16px] text-black focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                placeholder="+598 99 123 456"
              />
            </div>

            <div>
              <label htmlFor="password" className="font-body text-[14px] text-white block mb-2">
                Contraseña
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
            </div>

            <div>
              <label htmlFor="confirmPassword" className="font-body text-[14px] text-white block mb-2">
                Confirmar Contraseña
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
            {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
          </button>

          <div className="text-center">
            <p className="font-body text-[14px] text-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-[#dbf228] hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#1b1b1b]">
        <div className="text-white font-heading text-[24px]">Cargando...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
