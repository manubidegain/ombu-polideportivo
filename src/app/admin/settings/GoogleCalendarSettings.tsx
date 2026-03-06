'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface OAuthToken {
  id: string;
  google_email: string | null;
  created_at: string;
  is_active: boolean;
}

interface GoogleCalendarSettingsProps {
  oauthToken: OAuthToken | null;
}

export function GoogleCalendarSettings({ oauthToken: initialToken }: GoogleCalendarSettingsProps) {
  const [isConnected, setIsConnected] = useState(!!initialToken);
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(initialToken);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'calendar_connected') {
      toast.success('Google Calendar conectado exitosamente');
      setIsConnected(true);
      router.replace('/admin/settings');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'Permiso denegado por el usuario',
        no_code: 'No se recibió código de autorización',
        not_admin: 'Solo admins pueden conectar Google Calendar',
        no_tokens: 'No se obtuvieron tokens de Google',
        storage_failed: 'Error al guardar tokens',
        unknown: 'Error desconocido al conectar',
      };
      toast.error(errorMessages[error] || 'Error al conectar con Google Calendar');
      router.replace('/admin/settings');
    }
  }, [searchParams, router]);

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/auth/google';
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar Google Calendar?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Google Calendar desconectado');
      setIsConnected(false);
      setTokenInfo(null);
      router.refresh();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Error al desconectar Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-heading text-[24px] text-white mb-2">GOOGLE CALENDAR</h2>
          <p className="font-body text-[14px] text-gray-400">
            Conectá tu cuenta de Google para sincronizar reservas automáticamente
          </p>
        </div>

        {isConnected ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-body text-[12px]">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Conectado
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 font-body text-[12px]">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            Desconectado
          </span>
        )}
      </div>

      {isConnected && tokenInfo ? (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="font-body text-[12px] text-gray-400 mb-1">Cuenta conectada</p>
            <p className="font-body text-[14px] text-white">{tokenInfo.google_email}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="font-body text-[12px] text-gray-400 mb-1">Conectado desde</p>
            <p className="font-body text-[14px] text-white">
              {new Date(tokenInfo.created_at).toLocaleDateString('es-UY', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
            <p className="font-body text-[12px] text-blue-400">
              <strong>💡 Próximo paso:</strong> Ve a la sección de Canchas y configurá el Calendar
              ID para cada cancha que quieras sincronizar.
            </p>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full bg-red-500/20 text-red-400 font-body text-[14px] py-3 px-6 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'Desconectando...' : 'Desconectar Google Calendar'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="font-body text-[14px] text-gray-300 mb-4">
              Al conectar Google Calendar podrás:
            </p>
            <ul className="space-y-2">
              <li className="font-body text-[14px] text-gray-400 flex items-start gap-2">
                <span className="text-[#dbf228] mt-1">✓</span>
                <span>Sincronizar automáticamente las reservas con tu calendario</span>
              </li>
              <li className="font-body text-[14px] text-gray-400 flex items-start gap-2">
                <span className="text-[#dbf228] mt-1">✓</span>
                <span>Ver todas las reservas en Google Calendar</span>
              </li>
              <li className="font-body text-[14px] text-gray-400 flex items-start gap-2">
                <span className="text-[#dbf228] mt-1">✓</span>
                <span>Recibir notificaciones automáticas de Google</span>
              </li>
              <li className="font-body text-[14px] text-gray-400 flex items-start gap-2">
                <span className="text-[#dbf228] mt-1">✓</span>
                <span>Crear calendarios separados para cada cancha</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Conectar con Google Calendar
          </button>

          <p className="font-body text-[12px] text-gray-400 text-center">
            Al conectar, autorizás que la app acceda a tu Google Calendar para crear y gestionar
            eventos
          </p>
        </div>
      )}
    </div>
  );
}
