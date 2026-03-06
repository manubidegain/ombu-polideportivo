import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Debes proporcionar un email');
    console.log('\nUso: bun run scripts/make-admin.ts <email>');
    console.log('Ejemplo: bun run scripts/make-admin.ts usuario@admin.com');
    process.exit(1);
  }

  console.log(`🔍 Buscando usuario con email: ${email}\n`);

  // Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error al listar usuarios:', listError);
    process.exit(1);
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`❌ No se encontró ningún usuario con email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  // Update user metadata to include admin role
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        ...user.user_metadata,
        role: 'admin'
      }
    }
  );

  if (updateError) {
    console.error('❌ Error al actualizar el rol:', updateError);
    process.exit(1);
  }

  console.log('✅ Usuario actualizado exitosamente!');
  console.log(`   ${email} ahora tiene el rol de ADMIN\n`);
  console.log('🎉 Ahora puedes acceder a /admin con este usuario');
}

makeAdmin();
