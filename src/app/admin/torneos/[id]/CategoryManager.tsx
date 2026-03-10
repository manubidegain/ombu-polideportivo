'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ButtonBallSpinner } from '@/components/common/LoadingSpinner';

interface Category {
  id: string;
  name: string;
  description: string | null;
  max_teams: number;
  min_teams: number | null;
  registrations_count?: number;
}

interface CategoryManagerProps {
  tournamentId: string;
  categories: Category[];
}

export function CategoryManager({ tournamentId, categories }: CategoryManagerProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_teams: 16,
    min_teams: 4,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      max_teams: 16,
      min_teams: 4,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      max_teams: category.max_teams,
      min_teams: category.min_teams || 4,
    });
    setEditingId(category.id);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (formData.max_teams < formData.min_teams) {
      toast.error('El máximo debe ser mayor o igual al mínimo');
      return;
    }

    if (formData.min_teams < 2) {
      toast.error('Debe haber al menos 2 equipos mínimos');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (editingId) {
        // Update existing category
        const { error } = await supabase
          .from('tournament_categories')
          .update({
            name: formData.name,
            description: formData.description || null,
            max_teams: formData.max_teams,
            min_teams: formData.min_teams,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Categoría actualizada');
      } else {
        // Create new category
        const { error } = await supabase.from('tournament_categories').insert({
          tournament_id: tournamentId,
          name: formData.name,
          description: formData.description || null,
          max_teams: formData.max_teams,
          min_teams: formData.min_teams,
        });

        if (error) throw error;
        toast.success('Categoría agregada');
      }

      resetForm();
      router.refresh();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`¿Eliminar la categoría "${categoryName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('tournament_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      toast.success('Categoría eliminada');
      router.refresh();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-[24px] text-white">
          CATEGORÍAS ({categories.length})
        </h2>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-4 rounded hover:bg-[#c5db23] transition-colors"
          >
            + Agregar Categoría
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <h3 className="font-heading text-[18px] text-white mb-4">
            {editingId ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Categoría A"
                required
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>

            <div>
              <label className="block font-body text-[12px] text-gray-400 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Nivel avanzado"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  Máximo Equipos *
                </label>
                <input
                  type="number"
                  value={formData.max_teams}
                  onChange={(e) =>
                    setFormData({ ...formData, max_teams: parseInt(e.target.value) })
                  }
                  min="2"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>

              <div>
                <label className="block font-body text-[12px] text-gray-400 mb-2">
                  Mínimo Equipos *
                </label>
                <input
                  type="number"
                  value={formData.min_teams}
                  onChange={(e) =>
                    setFormData({ ...formData, min_teams: parseInt(e.target.value) })
                  }
                  min="2"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md font-body text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#dbf228]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#dbf228] text-[#1b1b1b] font-body text-[14px] py-2 px-6 rounded hover:bg-[#c5db23] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <ButtonBallSpinner />}
                {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="bg-white/10 text-white font-body text-[14px] py-2 px-6 rounded hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-heading text-[18px] text-white">{category.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  disabled={loading || isAdding || editingId !== null}
                  className="text-blue-400 hover:text-blue-300 font-body text-[12px] disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  disabled={loading || isAdding || editingId !== null}
                  className="text-red-400 hover:text-red-300 font-body text-[12px] disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
            {category.description && (
              <p className="font-body text-[14px] text-gray-400 mb-3">{category.description}</p>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-gray-400">Inscriptos</span>
                <span
                  className={`font-body text-[14px] ${
                    (category.registrations_count || 0) >= category.max_teams
                      ? 'text-red-400'
                      : (category.registrations_count || 0) >= (category.min_teams ?? 0)
                        ? 'text-green-400'
                        : 'text-yellow-400'
                  }`}
                >
                  {category.registrations_count || 0} / {category.max_teams}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-gray-400">Mínimo requerido</span>
                <span className="font-body text-[14px] text-white">{category.min_teams ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
