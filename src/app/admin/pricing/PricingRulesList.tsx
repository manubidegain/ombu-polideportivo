'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import Link from 'next/link';

type PricingRule = Tables<'pricing_rules'> & {
  courts: { name: string } | null;
  timeslot_configs: { start_time: string; day_of_week: number; courts: { name: string } | null } | null;
};
type Court = Tables<'courts'>;
type Timeslot = Tables<'timeslot_configs'> & {
  courts: { name: string } | null;
};

interface PricingRulesListProps {
  initialRules: PricingRule[];
  courts: Court[];
  timeslots: Timeslot[];
}

export function PricingRulesList({ initialRules, courts, timeslots }: PricingRulesListProps) {
  const [rules, setRules] = useState<PricingRule[]>(initialRules);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (ruleId: string) => {
    if (!confirm('¿Estás seguro que quieres eliminar esta regla de precio?')) {
      return;
    }

    setDeleting(ruleId);
    const supabase = createClient();

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Error deleting pricing rule:', error);
      alert('Error al eliminar la regla de precio.');
      setDeleting(null);
      return;
    }

    setRules(rules.filter((r) => r.id !== ruleId));
    setDeleting(null);
    router.refresh();
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };

  const getRuleDescription = (rule: PricingRule) => {
    const parts: string[] = [];

    if (rule.courts) {
      parts.push(rule.courts.name);
    } else {
      parts.push('Todas las canchas');
    }

    if (rule.timeslot_configs) {
      parts.push(`${getDayName(rule.timeslot_configs.day_of_week)} ${rule.timeslot_configs.start_time}`);
    } else if (rule.day_of_week !== null) {
      parts.push(getDayName(rule.day_of_week));
    } else {
      parts.push('Todos los días');
    }

    if (rule.duration_minutes !== null) {
      const hours = rule.duration_minutes / 60;
      parts.push(`${hours}h`);
    }

    if (rule.start_date && rule.end_date) {
      parts.push(`${rule.start_date} a ${rule.end_date}`);
    } else if (rule.start_date) {
      parts.push(`Desde ${rule.start_date}`);
    } else if (rule.end_date) {
      parts.push(`Hasta ${rule.end_date}`);
    }

    return parts.join(' • ');
  };

  if (rules.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
        <p className="font-body text-[16px] text-gray-400 mb-4">
          No hay reglas de precios configuradas
        </p>
        <Link
          href="/admin/pricing/new"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[16px] py-2 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          CREAR PRIMERA REGLA
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                PRIORIDAD
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                DESCRIPCIÓN
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                PRECIO
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                TIPO
              </th>
              <th className="px-6 py-4 text-left font-heading text-[14px] text-white">
                ESTADO
              </th>
              <th className="px-6 py-4 text-right font-heading text-[14px] text-white">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-t border-white/10">
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  <span className="bg-[#dbf228] text-[#1b1b1b] px-3 py-1 rounded-full font-heading text-[12px]">
                    {rule.priority}
                  </span>
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  {getRuleDescription(rule)}
                  {rule.is_promotion && rule.promotion_name && (
                    <div className="mt-1">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">
                        🎉 {rule.promotion_name}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-body text-[18px] text-[#dbf228] font-bold">
                  ${rule.price}
                </td>
                <td className="px-6 py-4 font-body text-[12px] text-white">
                  {rule.is_promotion ? 'Promoción' : 'Regular'}
                </td>
                <td className="px-6 py-4 font-body text-[14px] text-white">
                  <span className={rule.is_active ? 'text-green-400' : 'text-gray-400'}>
                    {rule.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/pricing/${rule.id}/edit`}
                      className="bg-white/10 text-white font-body text-[12px] py-2 px-4 rounded hover:bg-white/20 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleting === rule.id}
                      className="bg-red-500/20 text-red-400 font-body text-[12px] py-2 px-4 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {deleting === rule.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
