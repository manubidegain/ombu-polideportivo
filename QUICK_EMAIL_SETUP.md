# Guía Rápida - Configuración de Email

## Pasos Inmediatos en Supabase Dashboard

### 1. Configurar URLs de Redirección (5 minutos)

Ve a: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/auth/url-configuration

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs (agregar todas):**
```
http://localhost:3000/auth/confirm
http://localhost:3000/auth/callback
http://localhost:3000/auth/update-password
```

---

### 2. Actualizar Templates de Email (5 minutos)

Ve a: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/auth/templates

#### A) Confirmación de Email

1. Click en **"Confirm signup"**
2. **Subject:** `Confirma tu email - Polideportivo Ombú`
3. **Template HTML:** Copia el contenido de `email-templates/confirmation-email.html`
4. Click **Save**

#### B) Recuperación de Contraseña

1. Click en **"Reset Password"**
2. **Subject:** `Recupera tu contraseña - Polideportivo Ombú`
3. **Template HTML:** Copia el contenido de `email-templates/reset-password-email.html`
4. Click **Save**

---

### 3. Test Rápido

1. Inicia el servidor:
   ```bash
   bun run dev
   ```

2. Ve a: http://localhost:3000/auth/signup

3. Registra un usuario de prueba con tu email

4. Revisa tu email - deberías recibir uno con diseño profesional de Polideportivo Ombú

5. Click en "CONFIRMAR EMAIL"

6. Deberías ver la página de confirmación exitosa

---

## ¿Qué cambió?

✅ **Antes:**
- Email feo genérico de Supabase
- Redirección a localhost rota
- No había página de confirmación
- No había flujo de recuperación de contraseña

✅ **Ahora:**
- Emails profesionales con tu branding (confirmación + reset)
- Redirección funcional
- Páginas de confirmación con diseño bonito
- Flujo completo de recuperación de contraseña
- Link "¿Olvidaste tu contraseña?" en login
- Mejor experiencia de usuario

---

## Para Producción (cuando despliegues)

1. Actualiza `.env.local` → `.env.production`:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
   ```

2. En Supabase, agrega las URLs de producción:
   ```
   https://tu-dominio.com/auth/confirm
   https://tu-dominio.com/auth/callback
   https://tu-dominio.com/auth/update-password
   ```

3. (Recomendado) Configura SMTP personalizado con Resend para evitar límites de emails

---

## Archivos Creados

### Confirmación de Email:
- `/src/app/auth/confirm/route.ts` - Maneja la confirmación de email
- `/src/app/auth/confirmed/page.tsx` - Página de éxito
- `/src/app/auth/error/page.tsx` - Página de error
- `/email-templates/confirmation-email.html` - Template del email

### Recuperación de Contraseña:
- `/src/app/auth/reset-password/page.tsx` - Solicitar reset
- `/src/app/auth/update-password/page.tsx` - Ingresar nueva contraseña
- `/src/app/auth/password-updated/page.tsx` - Confirmación de éxito
- `/email-templates/reset-password-email.html` - Template del email

### Documentación:
- `SUPABASE_EMAIL_SETUP.md` - Documentación completa
- `PASSWORD_RESET_SETUP.md` - Guía específica de reset de contraseña

---

## Troubleshooting Rápido

**❌ No recibo el email:**
- Revisa spam
- Verifica que guardaste el template en Supabase
- Revisa logs: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/logs/auth-logs

**❌ El link no funciona:**
- Verifica que agregaste las Redirect URLs en Supabase
- Verifica que el servidor esté corriendo

**❌ El email se ve mal:**
- Algunos clientes de email tienen limitaciones CSS
- El template funciona bien en Gmail, Outlook y Apple Mail
