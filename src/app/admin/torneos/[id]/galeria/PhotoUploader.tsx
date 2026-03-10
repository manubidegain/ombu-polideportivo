'use client';

import { useState } from 'react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

type Props = {
  tournamentId: string;
};

export function PhotoUploader({ tournamentId }: Props) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Filter only images
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length !== files.length) {
        setError('Solo se permiten archivos de imagen');
      }

      setSelectedFiles((prev) => [...prev, ...imageFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setCaptions((prev) => {
      const newCaptions = { ...prev };
      delete newCaptions[index.toString()];
      return newCaptions;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos una imagen');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `tournaments/${tournamentId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('tournament-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('tournament-photos').getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase.from('tournament_photos').insert({
          tournament_id: tournamentId,
          file_path: filePath,
          file_name: file.name,
          caption: captions[i.toString()] || null,
        });

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`Error guardando ${file.name} en la base de datos`);
        }
      }

      setSuccess(`${selectedFiles.length} foto(s) subida(s) exitosamente`);
      setSelectedFiles([]);
      setCaptions({});

      // Refresh to show new photos
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al subir fotos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h2 className="font-heading text-[24px] text-white mb-6">SUBIR FOTOS</h2>

      {/* File Input */}
      <div className="mb-6">
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#dbf228]/50 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="font-body text-[16px] text-white mb-2">
              Haz clic para seleccionar fotos
            </p>
            <p className="font-body text-[12px] text-gray-400">
              o arrastra y suelta archivos aquí
            </p>
            <p className="font-body text-[10px] text-gray-500 mt-2">
              JPG, PNG, GIF - Máximo 5MB por archivo
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="font-heading text-[18px] text-white">
            Archivos Seleccionados ({selectedFiles.length})
          </h3>

          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-4"
            >
              {/* Preview */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-20 h-20 object-cover rounded"
              />

              {/* File Info */}
              <div className="flex-1">
                <p className="font-body text-[14px] text-white mb-1">{file.name}</p>
                <p className="font-body text-[12px] text-gray-400 mb-2">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                {/* Caption Input */}
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={captions[index.toString()] || ''}
                  onChange={(e) =>
                    setCaptions((prev) => ({
                      ...prev,
                      [index.toString()]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(index)}
                className="text-red-400 hover:text-red-300 font-body text-[12px]"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-3 mb-4">
          <p className="font-body text-[14px] text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 rounded-md p-3 mb-4">
          <p className="font-body text-[14px] text-green-500">{success}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || selectedFiles.length === 0}
        className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-4 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading && <ButtonBallSpinner />}
        {uploading ? 'SUBIENDO...' : `SUBIR ${selectedFiles.length} FOTO(S)`}
      </button>
    </div>
  );
}
