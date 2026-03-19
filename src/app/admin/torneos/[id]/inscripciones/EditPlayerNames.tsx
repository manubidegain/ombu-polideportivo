'use client';

import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

type Props = {
  registrationId: string;
  currentPlayerNames: string[];
};

export function EditPlayerNames({ registrationId, currentPlayerNames }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>(currentPlayerNames);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/tournament-registration/update-player-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          playerNames,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar nombres');
      }

      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPlayerNames(currentPlayerNames);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-start gap-2">
        <div className="space-y-1 flex-1">
          {playerNames && playerNames.length > 0 ? (
            playerNames.map((player, idx) => (
              <p key={idx} className="font-body text-[12px] text-gray-400">
                {player}
              </p>
            ))
          ) : (
            <p className="font-body text-[12px] text-gray-400">No especificado</p>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Editar nombres"
        >
          <Edit2 className="w-4 h-4 text-gray-400 hover:text-[#dbf228]" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {playerNames.map((player, idx) => (
        <input
          key={idx}
          type="text"
          value={player}
          onChange={(e) => {
            const updated = [...playerNames];
            updated[idx] = e.target.value;
            setPlayerNames(updated);
          }}
          className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white font-body text-[12px] focus:outline-none focus:ring-1 focus:ring-[#dbf228]"
          placeholder={`Jugador ${idx + 1}`}
        />
      ))}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded font-body text-[11px] disabled:opacity-50"
        >
          {saving ? (
            <>
              <ButtonBallSpinner />
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-3 h-3" />
              Guardar
            </>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-body text-[11px] disabled:opacity-50"
        >
          <X className="w-3 h-3" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
