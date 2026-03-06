# Configuración de Usuario Admin

Hay dos formas de tener acceso al panel de administración:

## Opción 1: Usar un email que termine en @admin.com (MÁS FÁCIL)

1. Crea un nuevo usuario en http://localhost:3001/auth/signup con un email que termine en `@admin.com`
   - Ejemplo: `tu-nombre@admin.com`
2. Verifica el email (revisa tu bandeja de entrada)
3. Inicia sesión en http://localhost:3001/auth/login
4. Ya puedes acceder a http://localhost:3001/admin

## Opción 2: Asignar rol de admin a un usuario existente (REQUIERE SERVICE_ROLE_KEY)

1. Ve a tu dashboard de Supabase: https://yoxlxplsamzyuxaldpca.supabase.co
2. Navega a **Settings > API**
3. Copia el **service_role key** (¡es un secret key, no lo compartas!)
4. Actualiza el archivo `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
   ```
5. Ejecuta el script para hacer admin a tu usuario:
   ```bash
   bun run scripts/make-admin.ts tu-email@ejemplo.com
   ```
6. Cierra sesión y vuelve a iniciar sesión para que se actualice el token
7. Ya puedes acceder a http://localhost:3001/admin

## Opción 3: Actualizar manualmente desde Supabase (MANUAL)

1. Ve a tu dashboard de Supabase: https://yoxlxplsamzyuxaldpca.supabase.co
2. Navega a **Authentication > Users**
3. Encuentra tu usuario y haz clic en él
4. En la sección **User Metadata**, agrega:
   ```json
   {
     "role": "admin"
   }
   ```
5. Guarda los cambios
6. Cierra sesión en la app y vuelve a iniciar sesión
7. Ya puedes acceder a http://localhost:3001/admin

## Verificar si tienes acceso admin

Si al intentar acceder a http://localhost:3001/admin te redirige a la página principal o al login, es porque tu usuario aún no tiene el rol de admin configurado.
