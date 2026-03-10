# Configuración de Recuperación de Contraseña

## Pasos Rápidos en Supabase Dashboard (5 minutos)

### 1. Configurar URL de Redirección

Ve a: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/auth/url-configuration

**Asegúrate de tener esta URL en Redirect URLs:**
```
http://localhost:3000/auth/update-password
```

---

### 2. Configurar Template de Email

Ve a: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/auth/templates

1. Click en **"Reset Password"**

2. **Subject:** Copia y pega:
   ```
   Recupera tu contraseña - Polideportivo Ombú
   ```

3. **Template HTML:** Abre el archivo `email-templates/reset-password-email.html` y copia todo su contenido en el editor de Supabase

4. Click **Save**

---

## Flujo Completo de Usuario

### 1. Usuario solicita reset
- Va a `/auth/login`
- Click en "¿Olvidaste tu contraseña?"
- Ingresa su email en `/auth/reset-password`
- Recibe email con link

### 2. Usuario recibe email
- Email profesional con diseño de Polideportivo Ombú
- Link válido por 1 hora
- Advertencia de seguridad si no solicitó el reset

### 3. Usuario hace click en el link
- Redirige a `/auth/update-password`
- Verifica que la sesión sea válida
- Si el link expiró, muestra error con opción de solicitar nuevo link

### 4. Usuario ingresa nueva contraseña
- Mínimo 6 caracteres
- Debe confirmar la contraseña
- Al enviar, actualiza la contraseña

### 5. Confirmación
- Redirige a `/auth/password-updated`
- Mensaje de éxito
- Botón para ir a login

---

## Archivos Creados

### Páginas del Flujo:
- `/src/app/auth/reset-password/page.tsx` - Solicitar reset
- `/src/app/auth/update-password/page.tsx` - Ingresar nueva contraseña
- `/src/app/auth/password-updated/page.tsx` - Confirmación de éxito

### Email Template:
- `/email-templates/reset-password-email.html` - Template del email

### Actualizado:
- `/src/app/auth/login/page.tsx` - Agregado link "¿Olvidaste tu contraseña?"

---

## Test Rápido

1. Inicia el servidor:
   ```bash
   bun run dev
   ```

2. Ve a: http://localhost:3000/auth/login

3. Click en "¿Olvidaste tu contraseña?"

4. Ingresa tu email

5. Revisa tu email - deberías recibir uno con diseño profesional

6. Click en "RESTABLECER CONTRASEÑA"

7. Ingresa tu nueva contraseña

8. Deberías ver la página de confirmación

---

## Características de Seguridad

✅ **Link de un solo uso**
- El link de reset solo puede usarse una vez
- Una vez que se actualiza la contraseña, el link queda invalidado

✅ **Expiración de 1 hora**
- Por seguridad, el link expira después de 1 hora
- El usuario puede solicitar un nuevo link si expira

✅ **Validación de sesión**
- La página de actualización verifica que la sesión sea válida
- Si el link es inválido o expiró, muestra un error claro

✅ **Confirmación de contraseña**
- Requiere que el usuario confirme la nueva contraseña
- Previene errores al escribir

✅ **Advertencia de seguridad**
- El email incluye una advertencia si el usuario no solicitó el reset
- Le recomienda al usuario cambiar su contraseña si alguien más intentó acceder

---

## Para Producción

1. Actualiza las URLs en Supabase para incluir tu dominio:
   ```
   https://tu-dominio.com/auth/update-password
   ```

2. Considera configurar SMTP personalizado (Resend) para mejor deliverability

---

## Troubleshooting

**❌ No recibo el email:**
- Revisa spam
- Verifica que guardaste el template en Supabase
- Revisa logs: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/logs/auth-logs

**❌ El link dice "expirado":**
- Los links expiran después de 1 hora
- Solicita un nuevo link desde `/auth/reset-password`

**❌ Error "Link inválido":**
- Verifica que agregaste `/auth/update-password` en Redirect URLs en Supabase
- Verifica que el servidor esté corriendo

**❌ La contraseña no se actualiza:**
- Verifica que ambas contraseñas coincidan
- La contraseña debe tener al menos 6 caracteres
- Revisa la consola del navegador para errores
