# Google Calendar Integration Setup

Esta guía te ayudará a configurar la integración con Google Calendar para sincronizar automáticamente las reservas de cada cancha.

## ¿Para qué sirve?

Con esta integración, cada vez que se crea una reserva:
- Se crea automáticamente un evento en el Google Calendar de la cancha
- Los clientes reciben notificaciones automáticas de Google
- Se pueden ver todas las reservas en Google Calendar
- Las modificaciones y cancelaciones se sincronizan automáticamente

## Paso 1: Crear un Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Dale un nombre como "Ombu Polideportivo"

## Paso 2: Habilitar Google Calendar API

1. En el menú lateral, ve a **APIs & Services** → **Library**
2. Busca "Google Calendar API"
3. Haz clic en **Enable**

## Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **Create Credentials** → **OAuth 2.0 Client ID**
3. Si es la primera vez, configura la **OAuth consent screen**:
   - User Type: External (para testing) o Internal (si tenés Google Workspace)
   - App name: "Polideportivo Ombú"
   - User support email: tu email
   - Developer contact: tu email
   - Scopes: No es necesario agregar ninguno manualmente en este paso
   - Test users: Agregá tu email de Google para testing

4. Volvé a **Credentials** y crea el OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "Ombu Calendar Integration"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (desarrollo)
     - `https://tudominio.com/api/auth/google/callback` (producción)

5. Descargá el archivo JSON o copiá el **Client ID** y **Client Secret**

## Paso 4: Obtener Access Token y Refresh Token

Para obtener los tokens iniciales, necesitás crear una ruta temporal de autenticación:

### Opción A: Usando OAuth Playground (Recomendado)

1. Ve a [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Hacé clic en el ícono de Settings (⚙️) arriba a la derecha
3. Marcá la opción **"Use your own OAuth credentials"**
4. Ingresá tu **Client ID** y **Client Secret**
5. En "Step 1 - Select & authorize APIs":
   - Buscá "Google Calendar API v3"
   - Seleccioná: `https://www.googleapis.com/auth/calendar`
   - Hacé clic en **Authorize APIs**
6. Iniciá sesión con tu cuenta de Google
7. En "Step 2 - Exchange authorization code for tokens":
   - Hacé clic en **Exchange authorization code for tokens**
   - Guardá el **Access token** y **Refresh token** que aparecen

### Opción B: Crear ruta temporal en la app

Alternativamente, podés crear una ruta temporal en tu app (después la borrás):

```typescript
// src/app/api/auth/google/route.ts
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });

  return NextResponse.redirect(url);
}
```

Luego visitá `http://localhost:3000/api/auth/google` y seguí el flujo de autorización.

## Paso 5: Configurar Variables de Entorno

Agregá estas variables a tu `.env.local`:

```bash
# Google Calendar API
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_ACCESS_TOKEN=ya29.xxxxx  # Del paso 4
GOOGLE_REFRESH_TOKEN=1//xxxxx    # Del paso 4
```

## Paso 6: Crear Calendarios para Cada Cancha

Tenés dos opciones:

### Opción A: Usar Calendarios Separados (Recomendado)

1. En Google Calendar, creá un calendario nuevo para cada cancha:
   - "Cancha Pádel 1"
   - "Cancha Pádel 2"
   - "Cancha Fútbol 5"
   - etc.

2. Para obtener el ID de cada calendario:
   - Hacé clic en el calendario en la barra lateral
   - Clic en "Settings and sharing"
   - Bajá hasta "Integrate calendar"
   - Copiá el **Calendar ID** (ej: `abc123@group.calendar.google.com`)

### Opción B: Usar el Calendario Principal

También podés usar tu calendario principal (`primary`) para todas las canchas, pero se recomienda usar calendarios separados para mejor organización.

## Paso 7: Conectar Canchas a Calendarios

1. Iniciá sesión como admin en la app
2. Ve a `/admin/courts`
3. Para cada cancha:
   - Hacé clic en "Editar"
   - Ingresá el **Calendar ID**
   - Activá "Sincronización con Calendar"
   - Guardá los cambios

## Paso 8: Probar la Integración

1. Creá una reserva nueva desde el admin
2. Debería aparecer automáticamente en el Google Calendar correspondiente
3. Modificá la reserva (fecha, hora, etc.)
4. El evento en Calendar debería actualizarse automáticamente
5. Cancelá la reserva
6. El evento debería eliminarse del calendario

## Troubleshooting

### Error: "Access token expired"

Los access tokens expiran cada hora. El sistema debería usar el refresh token automáticamente, pero si falla:

1. Obtené un nuevo access token usando el refresh token
2. Actualizá la variable `GOOGLE_ACCESS_TOKEN` en `.env.local`
3. Reiniciá el servidor

### Error: "Calendar not found"

- Verificá que el Calendar ID esté correcto
- Asegurate de que la cuenta autenticada tenga acceso a ese calendario
- Si es un calendario compartido, verificá los permisos

### Error: "Insufficient permissions"

- Verificá que el scope `https://www.googleapis.com/auth/calendar` esté incluido
- Re-autorizá la aplicación en OAuth Consent Screen

### Las reservas no se sincronizan automáticamente

Por ahora, la sincronización se debe hacer manualmente desde el admin. Para sincronización automática:

1. Implementar webhooks de Supabase
2. O agregar la sincronización en las rutas API de creación de reservas

## Mejoras Futuras

- [ ] Sincronización automática al crear/modificar reservas
- [ ] Sincronización bidireccional (Calendar → App)
- [ ] Webhooks de Calendar para detectar cambios externos
- [ ] UI para re-sincronizar reservas existentes
- [ ] Manejo automático de refresh tokens
- [ ] Notificaciones de errores de sincronización
- [ ] Bulk sync de múltiples reservas

## Seguridad

**IMPORTANTE:**
- ⚠️ Nunca commitear el `.env.local` al repositorio
- ⚠️ Los access y refresh tokens son sensibles, guardálos de forma segura
- ⚠️ En producción, considerá usar un servicio de gestión de secretos (AWS Secrets Manager, Google Secret Manager, etc.)
- ⚠️ Rotá los tokens periódicamente
- ⚠️ Limitá el acceso a la API de Calendar solo a admins

## Costos

Google Calendar API es **gratuita** para uso normal:
- Hasta 1,000,000 de queries por día
- Sin cargo por eventos creados/modificados

Para uso comercial intensivo, consultá los [límites de uso](https://developers.google.com/calendar/api/guides/quota).
