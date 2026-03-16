'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { Download, Calendar } from 'lucide-react';

type Court = {
  id: string;
  name: string;
  calendar_sync_enabled: boolean | null;
  calendar_id?: string | null;
};

type Props = {
  courts: Court[];
};

export function CalendarImport({ courts }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const courtsWithSync = courts.filter((c) => c.calendar_sync_enabled);

  const handleImport = async () => {
    if (!selectedCourtId) {
      alert('Selecciona una cancha');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedCourtId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar eventos');
      }

      setResult(data.summary);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (courtsWithSync.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 bg-blue-500 text-white font-heading text-[14px] py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        <Download className="w-4 h-4" />
        IMPORTAR DESDE CALENDARIO
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-[#dbf228]" />
              <h2 className="font-heading text-[20px] text-white">
                IMPORTAR DESDE GOOGLE CALENDAR
              </h2>
            </div>

            {!result ? (
              <div className="space-y-4">
                <p className="font-body text-[14px] text-gray-400">
                  Importa reservas que existen en Google Calendar pero no en el sistema.
                </p>

                <div>
                  <label className="block font-body text-[14px] text-white mb-2">Cancha *</label>
                  <select
                    value={selectedCourtId}
                    onChange={(e) => setSelectedCourtId(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                    required
                  >
                    <option value="">Seleccionar cancha...</option>
                    {courtsWithSync.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-body text-[14px] text-white mb-2">
                    Fecha desde (opcional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                  <p className="font-body text-[12px] text-gray-500 mt-1">
                    Si no se especifica, importa desde hoy
                  </p>
                </div>

                <div>
                  <label className="block font-body text-[14px] text-white mb-2">
                    Fecha hasta (opcional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={importing}
                    className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1 bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {importing && <ButtonBallSpinner />}
                    {importing ? 'IMPORTANDO...' : 'IMPORTAR'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="font-heading text-[16px] text-green-400 mb-2">
                    IMPORTACIÓN COMPLETADA
                  </p>
                  <div className="space-y-1 font-body text-[14px] text-white">
                    <p>• Total de eventos: {result.total}</p>
                    <p className="text-green-400">• Importados: {result.imported}</p>
                    <p className="text-yellow-400">• Omitidos (ya existían): {result.skipped}</p>
                    {result.errors > 0 && (
                      <p className="text-red-400">• Errores: {result.errors}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setResult(null);
                    setSelectedCourtId('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[14px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors"
                >
                  CERRAR
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
