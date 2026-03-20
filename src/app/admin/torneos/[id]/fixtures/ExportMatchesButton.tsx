'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

type Props = {
  tournamentId: string;
};

export function ExportMatchesButton({ tournamentId }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/export-matches`);

      if (!response.ok) {
        throw new Error('Error al exportar partidos');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'partidos.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar los partidos. Por favor, intentá de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white border border-white/20 font-body text-[14px] rounded hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
      {isExporting ? 'Exportando...' : 'Exportar Partidos'}
    </button>
  );
}
