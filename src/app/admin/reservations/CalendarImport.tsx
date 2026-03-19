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

  // Split strategy state
  const [enableSplit, setEnableSplit] = useState(false);
  const [splitType, setSplitType] = useState<'overlap' | 'alternate' | 'by-time'>('overlap');
  const [additionalCourtIds, setAdditionalCourtIds] = useState<string[]>([]);
  const [timeThreshold, setTimeThreshold] = useState('12:00');

  const courtsWithSync = courts.filter((c) => c.calendar_sync_enabled);

  const handleImport = async () => {
    if (!selectedCourtId) {
      alert('Selecciona una cancha');
      return;
    }

    if (enableSplit && additionalCourtIds.length === 0) {
      alert('Selecciona al menos una cancha adicional para dividir las reservas');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      // Build split strategy object
      let splitStrategy = undefined;
      if (enableSplit && additionalCourtIds.length > 0) {
        splitStrategy = {
          type: splitType,
          courtIds: [selectedCourtId, ...additionalCourtIds],
          timeThreshold: splitType === 'by-time' ? timeThreshold : undefined,
        };
      }

      const response = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedCourtId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          splitStrategy,
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

                {/* Split Strategy Section */}
                <div className="border-t border-white/10 pt-4">
                  <label className="flex items-center gap-2 font-body text-[14px] text-white mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSplit}
                      onChange={(e) => setEnableSplit(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Dividir reservas entre múltiples canchas
                  </label>

                  {enableSplit && (
                    <div className="space-y-3 pl-6 border-l-2 border-[#dbf228]/30">
                      <div>
                        <label className="block font-body text-[13px] text-gray-400 mb-2">
                          Canchas adicionales *
                        </label>
                        <select
                          multiple
                          value={additionalCourtIds}
                          onChange={(e) =>
                            setAdditionalCourtIds(
                              Array.from(e.target.selectedOptions, (option) => option.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white font-body text-[13px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                          size={3}
                        >
                          {courtsWithSync
                            .filter((c) => c.id !== selectedCourtId)
                            .map((court) => (
                              <option key={court.id} value={court.id}>
                                {court.name}
                              </option>
                            ))}
                        </select>
                        <p className="font-body text-[11px] text-gray-500 mt-1">
                          Mantén presionado Ctrl/Cmd para seleccionar múltiples
                        </p>

                        {/* Visual feedback of selected courts */}
                        {additionalCourtIds.length > 0 && (
                          <div className="mt-3 p-3 bg-[#dbf228]/10 border border-[#dbf228]/30 rounded">
                            <p className="font-body text-[11px] text-[#dbf228] mb-2">
                              ✓ Canchas seleccionadas ({additionalCourtIds.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {additionalCourtIds.map((courtId) => {
                                const court = courtsWithSync.find((c) => c.id === courtId);
                                return (
                                  <div
                                    key={courtId}
                                    className="inline-flex items-center gap-2 px-2 py-1 bg-[#dbf228]/20 border border-[#dbf228]/40 rounded text-white font-body text-[11px]"
                                  >
                                    <span>{court?.name}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAdditionalCourtIds((prev) =>
                                          prev.filter((id) => id !== courtId)
                                        )
                                      }
                                      className="text-[#dbf228] hover:text-white transition-colors"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-body text-[13px] text-gray-400 mb-2">
                          Estrategia de división *
                        </label>
                        <select
                          value={splitType}
                          onChange={(e) =>
                            setSplitType(e.target.value as 'overlap' | 'alternate' | 'by-time')
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white font-body text-[13px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                        >
                          <option value="overlap">
                            Inteligente (detecta solapamientos automáticamente)
                          </option>
                          <option value="alternate">Alternado (cancha 1, 2, 1, 2...)</option>
                          <option value="by-time">Por horario (antes/después de X hora)</option>
                        </select>
                      </div>

                      {splitType === 'by-time' && (
                        <div>
                          <label className="block font-body text-[13px] text-gray-400 mb-2">
                            Hora de corte
                          </label>
                          <input
                            type="time"
                            value={timeThreshold}
                            onChange={(e) => setTimeThreshold(e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white font-body text-[13px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                          />
                          <p className="font-body text-[11px] text-gray-500 mt-1">
                            Antes de esta hora → cancha 1, después → cancha 2
                          </p>
                        </div>
                      )}

                      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                        <p className="font-body text-[11px] text-blue-300">
                          {splitType === 'overlap' &&
                            '💡 Detecta automáticamente cuando hay 2 reservas al mismo horario y las asigna a canchas diferentes.'}
                          {splitType === 'alternate' &&
                            '💡 Alterna entre las canchas seleccionadas en orden.'}
                          {splitType === 'by-time' &&
                            '💡 Divide las reservas basándose en la hora del día.'}
                        </p>
                      </div>
                    </div>
                  )}
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
