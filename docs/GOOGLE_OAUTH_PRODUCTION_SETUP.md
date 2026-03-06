# Configuración de Google OAuth para Producción

Esta guía te ayudará a configurar Google OAuth para que funcione en producción (`v2.ombupolideportivo.com`) en lugar de `localhost`.

## Problema Actual
Cuando intentas conectar Google Calendar en producción, te redirige a `localhost:3000` porque esa es la URL configurada en Google Cloud Console.

## Solución: 2 Pasos

### Paso 1: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona el proyecto `ombu-polideportivo`
3. Ve a **Settings** → **Environment Variables**
4. Agrega o actualiza las siguientes variables (para el ambiente **Production**):

```
GOOGLE_REDIRECT_URI = https://v2.ombupolideportivo.com/api/auth/google/callback
NEXT_PUBLIC_APP_URL = https://v2.ombupolideportivo.com
```

**IMPORTANTE**: Las demás variables ya deberían estar configuradas. Si no están, agregalas también:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`

5. **Re-deploy** el proyecto para que las variables tomen efecto:
   - Ve a la pestaña **Deployments**
   - Haz clic en los tres puntos del último deployment
   - Selecciona **Redeploy**

### Paso 2: Actualizar Google Cloud Console

Necesitás agregar la URL de producción como URI de redirección autorizada:

1. **Ve a [Google Cloud Console](https://console.cloud.google.com/)**

2. **Selecciona tu proyecto** (el que tiene el Client ID: `666731679574...`)

3. **Ve a APIs & Services → Credentials**
   - URL directa: https://console.cloud.google.com/apis/credentials

4. **Edita tus credenciales OAuth 2.0**:
   - Busca el cliente OAuth que tiene el ID: `666731679574-2p7vq1m1q68jtuqjdt8df3n4rotq9gqf`
   - Haz clic en el nombre para editarlo

5. **Agrega URIs de redirección autorizadas**:

   En la sección **"URIs de redireccionamiento autorizados"**, agrega:

   ```
   https://v2.ombupolideportivo.com/api/auth/google/callback
   ```

   **IMPORTANTE**: NO borres la URI de localhost si querés seguir desarrollando localmente:
   - Mantené: `http://localhost:3000/api/auth/google/callback`
   - Agregá: `https://v2.ombupolideportivo.com/api/auth/google/callback`

6. **También actualiza los Orígenes de JavaScript autorizados**:

   Agrega (si no está ya):
   ```
   https://v2.ombupolideportivo.com
   ```

   Y mantené localhost:
   ```
   http://localhost:3000
   ```

7. **Guarda los cambios** haciendo clic en **"Guardar"** o **"Save"**

8. **Actualiza la pantalla de consentimiento OAuth** (OAuth Consent Screen):
   - Ve a **APIs & Services → OAuth consent screen**
   - Verifica que estos campos estén correctos:
     - **Application home page**: `https://v2.ombupolideportivo.com`
     - **Authorized domains**: Agrega `ombupolideportivo.com` (sin subdominios)
     - **Privacy Policy**: `https://v2.ombupolideportivo.com/privacidad`
     - **Terms of Service** (opcional): Puedes dejarlo vacío o agregar una URL

### Paso 3: Verificar que Todo Funciona

1. **Espera unos minutos** después de guardar los cambios en Google Cloud (puede tomar hasta 5-10 minutos en propagarse)

2. **Limpia la caché** de tu navegador o usa modo incógnito

3. **Accede a tu sitio en producción**:
   ```
   https://v2.ombupolideportivo.com/admin/settings
   ```

4. **Intenta conectar Google Calendar**:
   - Haz clic en "Conectar con Google"
   - Deberías ser redirigido a Google
   - Después de autorizar, deberías volver a `v2.ombupolideportivo.com` (NO a localhost)

## Desarrollo Local

Para seguir trabajando en local, mantené las configuraciones de localhost tanto en Google Cloud Console como en tu archivo `.env.local`.

El archivo `.env.local` (para desarrollo) ya tiene:
```
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

El archivo `.env.production` (para referencia, Vercel usa sus propias variables) tiene:
```
GOOGLE_REDIRECT_URI=https://v2.ombupolideportivo.com/api/auth/google/callback
NEXT_PUBLIC_APP_URL=https://v2.ombupolideportivo.com
```

## Problemas Comunes

### Error: "redirect_uri_mismatch"
- Verifica que la URL en Google Cloud Console sea EXACTAMENTE:
  `https://v2.ombupolideportivo.com/api/auth/google/callback`
- Sin `/` al final
- Con `https://` (no `http://`)
- Espera unos minutos después de guardar cambios en Google Cloud

### Sigue redirigiendo a localhost
- Verifica que las variables de entorno en Vercel estén configuradas correctamente
- Haz un re-deploy después de cambiar las variables
- Limpia la caché del navegador

### Error 403: access_denied
- Verifica que el dominio `ombupolideportivo.com` esté en "Authorized domains" en OAuth Consent Screen
- Verifica que la pantalla de consentimiento esté publicada (no en modo "Testing")

### Usar dominio personalizado
Si en el futuro querés cambiar a `ombupolideportivo.com` (sin el `v2.`):
1. Actualiza las variables en Vercel
2. Actualiza las URIs en Google Cloud Console
3. Re-deploy

## Testing Checklist

- [ ] Variables de entorno configuradas en Vercel
- [ ] Re-deploy realizado en Vercel
- [ ] URIs de redirección agregadas en Google Cloud Console
- [ ] Orígenes autorizados agregados en Google Cloud Console
- [ ] Pantalla de consentimiento actualizada con dominio correcto
- [ ] Esperar 5-10 minutos para propagación
- [ ] Probar conexión en modo incógnito
- [ ] Verificar que redirige a v2.ombupolideportivo.com (no localhost)
