# Configuración de Emails en Supabase

## 1. Configurar URL de Redirección

1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca
2. Ve a **Authentication** → **URL Configuration**
3. Actualiza las siguientes URLs:

   **Site URL:**
   ```
   https://tu-dominio-produccion.com
   ```
   (Durante desarrollo puedes usar `http://localhost:3000`)

   **Redirect URLs (agregar):**
   ```
   http://localhost:3000/auth/confirm
   https://tu-dominio-produccion.com/auth/confirm
   http://localhost:3000/auth/callback
   https://tu-dominio-produccion.com/auth/callback
   ```

4. Guarda los cambios

---

## 2. Configurar Template de Email de Confirmación

1. En Supabase Dashboard, ve a **Authentication** → **Email Templates**
2. Selecciona **Confirm signup**
3. Reemplaza el contenido con el template HTML del archivo `email-templates/confirmation-email.html`

### Importante: Variables de Supabase

El template usa las siguientes variables que Supabase reemplaza automáticamente:

- `{{ .ConfirmationURL }}` - El link de confirmación único para el usuario

### Configuración del Subject (Asunto)

En el campo "Subject", usa:
```
Confirma tu email - Polideportivo Ombú
```

---

## 3. Configurar Redirect URL en el Código

Cuando el usuario hace signup, necesitamos especificar la URL de redirección. Esto ya está configurado en el código, pero verifica que esté correcto:

**En `src/app/auth/signup/SignupForm.tsx`:**

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
  },
});
```

---

## 4. Otros Templates de Email (Opcional pero Recomendado)

### Password Reset (Recuperación de Contraseña)

1. Ve a **Authentication** → **Email Templates** → **Reset Password**
2. Subject: `Recupera tu contraseña - Polideportivo Ombú`
3. Puedes usar un template similar al de confirmación, cambiando el texto

### Magic Link (Login sin contraseña)

1. Ve a **Authentication** → **Email Templates** → **Magic Link**
2. Subject: `Tu link de acceso - Polideportivo Ombú`

---

## 5. Variables de Entorno

Asegúrate de tener estas variables en `.env.local`:

```bash
# Para desarrollo
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Para producción (actualizar cuando despliegues)
# NEXT_PUBLIC_SITE_URL=https://tu-dominio-produccion.com
```

---

## 6. Configurar SMTP Personalizado (Recomendado para Producción)

Por defecto, Supabase usa su propio servidor SMTP con límites:
- 4 emails/hora (tier gratuito)
- Pueden caer en spam

### Opción 1: Usar Resend (Ya tienes la API Key)

1. Ve a **Project Settings** → **Auth** → **SMTP Settings**
2. Activa "Enable Custom SMTP"
3. Configura:
   ```
   Host: smtp.resend.com
   Port: 465 (con SSL) o 587 (con TLS)
   Username: resend
   Password: [Tu API Key de Resend]
   From Email: noreply@tu-dominio.com
   ```

### Opción 2: Usar Gmail

1. Ve a **Project Settings** → **Auth** → **SMTP Settings**
2. Configura:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: tu-email@gmail.com
   Password: [Contraseña de aplicación de Gmail]
   From Email: tu-email@gmail.com
   ```

---

## 7. Testing

### Test en Desarrollo

1. Inicia el servidor: `bun run dev`
2. Ve a `http://localhost:3000/auth/signup`
3. Registra un nuevo usuario
4. Revisa tu email
5. Haz clic en "CONFIRMAR EMAIL"
6. Deberías ser redirigido a `/auth/confirmed`

### Verificar en Supabase Dashboard

1. Ve a **Authentication** → **Users**
2. Busca el usuario que creaste
3. Verifica que el campo `email_confirmed_at` tenga una fecha

---

## Troubleshooting

### Los emails no llegan

1. Verifica la configuración SMTP
2. Revisa la carpeta de spam
3. Verifica los logs en Supabase Dashboard → **Logs** → **Auth**
4. Si usas SMTP personalizado, verifica las credenciales

### El link de confirmación no funciona

1. Verifica que las Redirect URLs estén configuradas correctamente
2. Verifica que `NEXT_PUBLIC_SITE_URL` esté correcto
3. Revisa la consola del navegador para errores
4. Verifica los logs de servidor: `bun run dev` en terminal

### El template no se ve bien

1. Algunos clientes de email no soportan todas las propiedades CSS
2. El template usa CSS inline que es compatible con la mayoría de clientes
3. Prueba en diferentes clientes: Gmail, Outlook, Apple Mail

---

## Recursos Adicionales

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Resend Documentation](https://resend.com/docs)
