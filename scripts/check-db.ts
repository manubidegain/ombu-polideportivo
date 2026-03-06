import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkDatabase() {
  console.log('🔍 Checking Supabase connection...\n');

  // Check courts
  const { data: courts, error } = await supabase
    .from('courts')
    .select('*')
    .order('name');

  if (error) {
    console.error('❌ Error fetching courts:', error);
    return;
  }

  console.log('✅ Successfully connected to Supabase!');
  console.log(`\n📋 Found ${courts.length} courts:\n`);

  courts.forEach((court, index) => {
    console.log(`${index + 1}. ${court.name}`);
    console.log(`   - Type: ${court.type}`);
    console.log(`   - Covered: ${court.is_covered ? 'Yes' : 'No'}`);
    console.log(`   - Lighting: ${court.has_lighting ? 'Yes' : 'No'}`);
    console.log(`   - Status: ${court.status}`);
    console.log('');
  });
}

checkDatabase();
