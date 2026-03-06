'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ShareSettingsProps {
  reservationId: string;
  shareToken: string | null;
  joinApprovalRequired: boolean | null;
  isOwner: boolean;
}

export function ShareSettings({
  reservationId,
  shareToken,
  joinApprovalRequired,
  isOwner,
}: ShareSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const router = useRouter();

  // Set share URL on client side only
  useEffect(() => {
    if (shareToken) {
      setShareUrl(`${window.location.origin}/reservations/join/${shareToken}`);
    } else {
      setShareUrl(null);
    }
  }, [shareToken]);

  if (!isOwner) return null;

  const handleToggleSharing = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      if (shareToken) {
        // Disable sharing by removing the token
        const { error } = await supabase
          .from('reservations')
          .update({ share_token: null })
          .eq('id', reservationId);

        if (error) throw error;
        toast.success('Link de invitación desactivado');
      } else {
        // Enable sharing by generating a new token
        const { error } = await supabase
          .from('reservations')
          .update({
            share_token: crypto.randomUUID(),
            join_approval_required: true, // Default to requiring approval
          })
          .eq('id', reservationId);

        if (error) throw error;
        toast.success('Link de invitación activado');
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling sharing:', error);
      toast.error('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ join_approval_required: !joinApprovalRequired })
        .eq('id', reservationId);

      if (error) throw error;

      toast.success(
        !joinApprovalRequired
          ? 'Ahora requieres aprobar las solicitudes'
          : 'Ahora cualquiera puede unirse automáticamente'
      );

      router.refresh();
    } catch (error) {
      console.error('Error toggling approval:', error);
      toast.error('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado al portapapeles');
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[24px] text-white">COMPARTIR RESERVA</h2>
        <button
          onClick={handleToggleSharing}
          disabled={loading}
          className={`font-body text-[14px] py-2 px-4 rounded transition-colors disabled:opacity-50 ${
            shareToken
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-[#dbf228] text-[#1b1b1b] hover:bg-[#c5db23]'
          }`}
        >
          {shareToken ? 'Desactivar Link' : 'Activar Link de Invitación'}
        </button>
      </div>

      {shareToken && (
        <div className="space-y-4">
          <div>
            <label className="block font-body text-[12px] text-gray-400 mb-2">
              Link de invitación
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl || ''}
                readOnly
                onClick={() => setShowLink(!showLink)}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white cursor-pointer"
              />
              <button
                onClick={copyToClipboard}
                className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
              >
                Copiar
              </button>
            </div>
            <p className="font-body text-[12px] text-gray-400 mt-1">
              Comparte este link con quien quieras invitar a la reserva
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[14px] text-white mb-1">Requiere aprobación</p>
                <p className="font-body text-[12px] text-gray-400">
                  {joinApprovalRequired
                    ? 'Debes aprobar cada solicitud para unirse'
                    : 'Cualquiera con el link puede unirse automáticamente'}
                </p>
              </div>
              <button
                onClick={handleToggleApproval}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  joinApprovalRequired ? 'bg-[#dbf228]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    joinApprovalRequired ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="font-body text-[12px] text-blue-400">
              <strong>Nota:</strong> Los usuarios deben tener cuenta o registrarse para unirse a
              la reserva. Si desactivas el link, las invitaciones existentes seguirán activas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
