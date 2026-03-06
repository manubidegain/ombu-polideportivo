import { createServerClient } from '@/lib/supabase/server';
import { PricingRuleForm } from '../PricingRuleForm';

export default async function NewPricingRulePage() {
  const supabase = await createServerClient();

  const [{ data: courts }, { data: timeslots }] = await Promise.all([
    supabase.from('courts').select('*').eq('status', 'active').order('name'),
    supabase
      .from('timeslot_configs')
      .select('*, courts (name)')
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time'),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">NUEVA REGLA DE PRECIO</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Crea una regla de precio dinámica
        </p>
      </div>

      <PricingRuleForm courts={courts || []} timeslots={timeslots || []} />
    </div>
  );
}
