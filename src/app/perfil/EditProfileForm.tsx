'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';
import { Upload, User } from 'lucide-react';

type Props = {
  userId: string;
  initialName: string;
  initialAvatarUrl: string | null;
};

export function EditProfileForm({ userId, initialName, initialAvatarUrl }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar 2MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return initialAvatarUrl;

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage (we'll need to create an 'avatars' bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        throw new Error('Error al subir la imagen: ' + uploadError.message);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate name
      if (!name.trim()) {
        throw new Error('El nombre es requerido');
      }

      // Upload avatar if changed
      let avatarUrl = initialAvatarUrl;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (!uploadedUrl) {
          throw new Error('Error al subir la imagen de perfil');
        }
        avatarUrl = uploadedUrl;
      }

      // Update profile via API
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          avatarUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      setSuccess('Perfil actualizado exitosamente');

      // Refresh the page to show updated data
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div>
        <label className="block font-body text-[12px] text-gray-400 mb-3">Foto de Perfil</label>
        <div className="flex items-center gap-6">
          {/* Avatar Preview */}
          <div className="w-24 h-24 rounded-full bg-[#1b1b1b] border-2 border-white/20 flex items-center justify-center text-white font-heading text-[36px] overflow-hidden">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* Upload Button */}
          <label className="cursor-pointer">
            <div className="bg-white/10 hover:bg-white/20 border border-white/20 rounded px-4 py-2 font-body text-[14px] text-white transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {avatarFile ? 'Cambiar Foto' : 'Subir Foto'}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </label>

          {avatarFile && (
            <button
              type="button"
              onClick={() => {
                setAvatarFile(null);
                setAvatarPreview(initialAvatarUrl);
              }}
              className="text-red-400 hover:text-red-300 font-body text-[12px]"
            >
              Cancelar
            </button>
          )}
        </div>
        <p className="font-body text-[10px] text-gray-500 mt-2">
          JPG, PNG o GIF - Máximo 2MB
        </p>
      </div>

      {/* Name Input */}
      <div>
        <label className="block font-body text-[12px] text-gray-400 mb-2">
          Nombre Completo *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-white/10 border border-white/20 rounded px-4 py-3 text-white font-body text-[14px] focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
          placeholder="Tu nombre completo"
        />
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
          <p className="font-body text-[14px] text-red-500">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 rounded-md p-3">
          <p className="font-body text-[14px] text-green-500">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || uploadingAvatar}
        className="w-full bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-3 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {(loading || uploadingAvatar) && <ButtonBallSpinner />}
        {uploadingAvatar
          ? 'SUBIENDO IMAGEN...'
          : loading
            ? 'GUARDANDO...'
            : 'GUARDAR CAMBIOS'}
      </button>
    </form>
  );
}
