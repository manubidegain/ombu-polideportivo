'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

    // Get redirect parameter and pass it to login page
    const redirectTo = searchParams.get('redirect');
    const loginUrl = redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : '/auth/login';

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push(loginUrl);
    }, 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1b1b1b] px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="bg-[#dbf228]/10 border border-[#dbf228] rounded-md p-6">
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-2">
              ¡REGISTRO EXITOSO!
            </h2>
            <p className="font-body text-[16px] text-white">
              Revisa tu email para confirmar tu cuenta.
            </p>
            <p className="font-body text-[14px] text-gray-400 mt-2">
              Redirigiendo al inicio de sesión...
            </p>
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
            CREAR CUENTA
          </h2>
          <p className="mt-2 text-center font-body text-[16px] text-gray-400">
            Regístrate en Polideportivo Ombú
          </p>
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
            className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-4 rounded-md hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
