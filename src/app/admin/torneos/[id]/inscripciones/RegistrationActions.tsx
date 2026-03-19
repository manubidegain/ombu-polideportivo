'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EditCategoryModal } from './EditCategoryModal';
import { UnavailabilityManager } from './UnavailabilityManager';
import { Trash2, Edit2, Clock } from 'lucide-react';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

type Category = {
  id: string;
  name: string;
  max_teams: number;
  registrations_count?: number;
};

type Props = {
  registrationId: string;
  categoryId: string;
  teamName: string;
  categories: Category[];
  tournamentId: string;
};

export function RegistrationActions({ registrationId, categoryId, teamName, categories, tournamentId }: Props) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/tournament-registration/delete?id=${registrationId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar inscripción');
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Unavailability Button */}
        <button
          onClick={() => setShowUnavailabilityModal(true)}
          className="p-2 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
          title="Restricciones horarias"
        >
          <Clock className="w-4 h-4" />
        </button>

        {/* Edit Category Button */}
        <button
          onClick={() => setShowEditModal(true)}
          className="p-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          title="Cambiar categoría"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          className="p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          title="Eliminar inscripción"
        >
          {deleting ? <ButtonBallSpinner /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Unavailability Modal */}
      {showUnavailabilityModal && (
        <UnavailabilityManager
          registrationId={registrationId}
          teamName={teamName}
          tournamentId={tournamentId}
          onClose={() => setShowUnavailabilityModal(false)}
        />
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <EditCategoryModal
          registrationId={registrationId}
          currentCategoryId={categoryId}
          teamName={teamName}
          categories={categories}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b1b1b] border border-white/20 rounded-lg max-w-md w-full p-6">
            <h3 className="font-heading text-[20px] text-white mb-4">CONFIRMAR ELIMINACIÓN</h3>
            <p className="font-body text-[14px] text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar la inscripción de{' '}
              <span className="text-white font-bold">{teamName}</span>? Esta acción no se puede
              deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-white/10 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white font-heading text-[14px] py-3 px-6 rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <ButtonBallSpinner />}
                {deleting ? 'ELIMINANDO...' : 'ELIMINAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
