import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PricingRulesList } from './PricingRulesList';

export default async function PricingPage() {
  const supabase = await createServerClient();

  const [{ data: pricingRules }, { data: courts }, { data: timeslots }] = await Promise.all([
    supabase
      .from('pricing_rules')
      .select(`
        *,
        courts (name),
        timeslot_configs (start_time, day_of_week, courts (name))
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('courts')
      .select('*')
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('timeslot_configs')
      .select('*, courts (name)')
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time'),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[40px] text-white">PRECIOS</h1>
          <p className="font-body text-[16px] text-gray-400 mt-2">
            Configura las reglas de precios dinámicos
          </p>
        </div>
        <Link
          href="/admin/pricing/new"
          className="bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-6 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          + NUEVA REGLA
        </Link>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <p className="font-body text-[14px] text-blue-400">
          💡 Las reglas se aplican por prioridad (mayor primero). Puedes crear reglas generales y específicas que se sobrescriban entre sí.
        </p>
      </div>

      <PricingRulesList
        initialRules={pricingRules || []}
        courts={courts || []}
        timeslots={timeslots || []}
      />
    </div>
  );
}
