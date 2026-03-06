import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PricingRuleForm } from '../../PricingRuleForm';

interface EditPricingRulePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPricingRulePage({ params }: EditPricingRulePageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [{ data: rule }, { data: courts }, { data: timeslots }] = await Promise.all([
    supabase.from('pricing_rules').select('*').eq('id', id).single(),
    supabase.from('courts').select('*').eq('status', 'active').order('name'),
    supabase
      .from('timeslot_configs')
      .select('*, courts (name)')
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time'),
  ]);

  if (!rule) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-heading text-[40px] text-white">EDITAR REGLA DE PRECIO</h1>
        <p className="font-body text-[16px] text-gray-400 mt-2">
          Modifica la configuración de la regla
        </p>
      </div>

      <PricingRuleForm rule={rule} courts={courts || []} timeslots={timeslots || []} />
    </div>
  );
}
