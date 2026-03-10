# Configuración de Google Sign In

## Guía Completa para Implementar Google OAuth en Supabase

---

## Parte 1: Configurar Google Cloud Console (15 minutos)

### 1. Crear Proyecto en Google Cloud

1. Ve a: https://console.cloud.google.com/
2. Click en el selector de proyectos (arriba a la izquierda)
3. Click en **"Nuevo Proyecto"**
4. Nombre: `Polideportivo Ombú` (o el que prefieras)
5. Click **"Crear"**
6. Espera a que se cree y selecciónalo

---

### 2. Habilitar Google+ API

1. En el menú lateral, ve a **"APIs y servicios"** → **"Biblioteca"**
2. Busca: `Google+ API`
3. Click en **"Google+ API"**
4. Click **"Habilitar"**

---

### 3. Configurar Pantalla de Consentimiento OAuth

1. En el menú lateral, ve a **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**

2. Selecciona **"Externo"** (para usuarios fuera de tu organización)

3. Click **"Crear"**

4. **Información de la aplicación:**
   - Nombre de la aplicación: `Polideportivo Ombú`
   - Correo electrónico de asistencia: (tu email)
   - Logo de la aplicación: (opcional, puedes subir tu logo)

5. **Información de contacto del desarrollador:**
   - Correo electrónico: (tu email)

6. Click **"Guardar y continuar"**

7. **Alcances (Scopes):**
   - No necesitas agregar ninguno adicional
   - Click **"Guardar y continuar"**

8. **Usuarios de prueba (opcional en desarrollo):**
   - Puedes agregar emails de usuarios que puedan probar
   - Click **"Guardar y continuar"**

9. **Resumen:**
   - Revisa y click **"Volver al panel"**

---

### 4. Crear Credenciales OAuth 2.0

1. En el menú lateral, ve a **"APIs y servicios"** → **"Credenciales"**

2. Click **"Crear credenciales"** → **"ID de cliente de OAuth 2.0"**

3. **Tipo de aplicación:** Selecciona **"Aplicación web"**

4. **Nombre:** `Polideportivo Ombú Web Client`

5. **Orígenes de JavaScript autorizados:**
   ```
   http://localhost:3000
   ```
   (Más tarde agregarás tu dominio de producción)

6. **URIs de redirección autorizados:**

   Obtén tu URL de callback de Supabase:
   - Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca
   - Ve a **Authentication** → **Providers**
   - Busca **Google** y copia la **Callback URL (for OAuth)**
   - Debería verse algo así: `https://yoxlxplsamzyuxaldpca.supabase.co/auth/v1/callback`

   Agrega esta URL en **URIs de redirección autorizados**

7. Click **"Crear"**

8. **¡IMPORTANTE!** Se abrirá un modal con tus credenciales:
   - **Client ID:** (guárdalo, lo necesitarás)
   - **Client Secret:** (guárdalo, lo necesitarás)
   - Puedes descargar el JSON o copiarlos a un lugar seguro

---

## Parte 2: Configurar Supabase (5 minutos)

### 1. Habilitar Google como Provider

1. Ve a: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/auth/providers

2. Busca **"Google"** en la lista de providers

3. Click para expandir

4. **Habilita Google:**
   - Toggle **"Google Enabled"** a ON

5. **Configura las credenciales:**
   - **Google Client ID:** (pega el Client ID que copiaste de Google Cloud)
   - **Google Client Secret:** (pega el Client Secret que copiaste de Google Cloud)

6. **Configuración adicional (opcional):**
   - **Skip nonce check:** Déjalo OFF (más seguro)
   - **Allowed email domains:** Déjalo vacío (permite cualquier email de Google)

7. Click **"Save"**

---

### 2. Verificar Redirect URLs en Supabase

1. Ve a: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/auth/url-configuration

2. Verifica que tengas estas **Redirect URLs:**
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirm
   http://localhost:3000/auth/update-password
   ```

3. **Site URL:** debe ser `http://localhost:3000`

---

## Parte 3: Test Local (2 minutos)

### 1. Inicia el servidor

```bash
bun run dev
```

### 2. Prueba Login

1. Ve a: http://localhost:3000/auth/login

2. Deberías ver el botón **"Continuar con Google"** con el logo de Google

3. Click en el botón

4. Se abrirá una ventana popup de Google

5. Selecciona tu cuenta de Google

6. Acepta los permisos

7. Serás redirigido de vuelta a tu aplicación

8. ¡Deberías estar logueado!

### 3. Verifica en Supabase

1. Ve a: https://supabase.com/dashboard/project/yoxlxplsamzyuxaldpca/auth/users

2. Deberías ver tu usuario con el provider "google"

---

## Parte 4: Configuración de Producción

### Cuando despliegues a producción:

#### 1. En Google Cloud Console:

1. Ve a **"Credenciales"** → (tu OAuth Client)

2. **Orígenes de JavaScript autorizados:**
   - Agrega: `https://tu-dominio.com`

3. **URIs de redirección autorizados:**
   - Ya está configurado (usa la misma URL de Supabase)

4. Click **"Guardar"**

#### 2. En Supabase:

1. Ve a **URL Configuration**

2. **Site URL:**
   ```
   https://tu-dominio.com
   ```

3. **Redirect URLs:**
   ```
   https://tu-dominio.com/auth/callback
   https://tu-dominio.com/auth/confirm
   https://tu-dominio.com/auth/update-password
   ```

---

## Cómo Funciona

### Flujo de Autenticación:

1. **Usuario hace click en "Continuar con Google"**
   - Se llama a `supabase.auth.signInWithOAuth({ provider: 'google' })`

2. **Redirección a Google**
   - Usuario es redirigido a Google para autenticarse
   - Google muestra la pantalla de selección de cuenta y permisos

3. **Google valida y redirige**
   - Si el usuario acepta, Google redirige a: `https://[supabase-url]/auth/v1/callback`
   - Incluye un `code` en la URL

4. **Supabase intercambia el código**
   - Supabase usa el `code` para obtener el `access_token` de Google
   - Crea o actualiza el usuario en la base de datos

5. **Redirección final**
   - Supabase redirige a: `http://localhost:3000/auth/callback?code=...`
   - Tu aplicación intercepta esta URL en `/auth/callback/route.ts`

6. **Tu aplicación maneja el callback**
   - Intercambia el `code` por una sesión usando `exchangeCodeForSession()`
   - Crea/actualiza el perfil del usuario en `user_profiles`
   - Redirige al usuario a la página que solicitó (o home)

---

## Archivos Creados

### Componente:
- `/src/components/auth/GoogleSignInButton.tsx` - Botón reutilizable de Google Sign In

### Ruta de Callback:
- `/src/app/auth/callback/route.ts` - Maneja la respuesta de Google OAuth

### Actualizados:
- `/src/app/auth/login/page.tsx` - Agregado botón de Google
- `/src/app/auth/signup/page.tsx` - Agregado botón de Google

---

## Datos del Usuario de Google

Cuando un usuario se autentica con Google, Supabase obtiene:

```javascript
{
  id: "uuid-generado-por-supabase",
  email: "usuario@gmail.com",
  user_metadata: {
    email: "usuario@gmail.com",
    email_verified: true,
    full_name: "Nombre Apellido",
    name: "Nombre Apellido",
    picture: "https://lh3.googleusercontent.com/...",
    provider_id: "google-user-id",
    sub: "google-user-id"
  }
}
```

El callback crea/actualiza automáticamente el perfil con:
- `full_name` (del Google profile)
- `email`
- `email_notifications: true`
- `whatsapp_notifications: false`

---

## Troubleshooting

### ❌ Error: "redirect_uri_mismatch"

**Problema:** La URI de redirección no está autorizada en Google Cloud

**Solución:**
1. Verifica que la **Callback URL de Supabase** esté en las URIs autorizadas en Google Cloud
2. Debe ser exactamente: `https://[tu-proyecto].supabase.co/auth/v1/callback`
3. Guarda los cambios en Google Cloud y espera 1-2 minutos

---

### ❌ El botón de Google no hace nada

**Problema:** JavaScript no se está ejecutando o hay un error

**Solución:**
1. Abre la consola del navegador (F12)
2. Revisa si hay errores de JavaScript
3. Verifica que el componente `GoogleSignInButton` esté importado correctamente

---

### ❌ Error: "Access blocked: This app's request is invalid"

**Problema:** La pantalla de consentimiento no está configurada correctamente

**Solución:**
1. Ve a Google Cloud Console → **Pantalla de consentimiento**
2. Verifica que esté configurada y publicada
3. Si está en "Testing", agrega tu email a los usuarios de prueba

---

### ❌ Usuario se autentica pero no crea el perfil

**Problema:** Error en el callback al crear `user_profiles`

**Solución:**
1. Revisa los logs de servidor: terminal donde corre `bun run dev`
2. Verifica que la tabla `user_profiles` exista en Supabase
3. Verifica los permisos RLS de la tabla

---

### ❌ "Error al iniciar sesión con Google"

**Problema:** El intercambio de código falló

**Solución:**
1. Verifica que el **Client ID** y **Client Secret** en Supabase sean correctos
2. Verifica que Google+ API esté habilitada en Google Cloud
3. Revisa los logs en Supabase Dashboard → Logs → Auth logs

---

## Seguridad

### Mejores Prácticas:

✅ **Client Secret seguro:**
- El Client Secret solo se usa en el servidor de Supabase
- Nunca se expone al cliente

✅ **PKCE Flow:**
- Supabase usa PKCE (Proof Key for Code Exchange) automáticamente
- Protege contra ataques de intercepción de código

✅ **State Parameter:**
- Supabase incluye un `state` parameter para prevenir CSRF

✅ **Nonce Check:**
- Habilitado por defecto para validar la respuesta de Google

---

## Recursos Adicionales

- [Supabase Google OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
