# Configuración de Emails con Resend

Este proyecto utiliza [Resend](https://resend.com) para el envío de emails transaccionales.

## Configuración Inicial

### 1. Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. Verifica tu email

### 2. Obtener API Key

1. En el dashboard de Resend, ve a "API Keys"
2. Haz clic en "Create API Key"
3. Dale un nombre (ej: "Ombu Polideportivo Production")
4. Copia la API key generada

### 3. Configurar dominio (Producción)

Para enviar emails desde tu propio dominio en producción:

1. En Resend, ve a "Domains"
2. Haz clic en "Add Domain"
3. Ingresa tu dominio (ej: `ombupolideportivo.com`)
4. Sigue las instrucciones para agregar los registros DNS:
   - SPF
   - DKIM
   - DMARC
5. Espera a que los registros se verifiquen (puede tardar hasta 48 horas)

### 4. Variables de entorno

Actualiza tu archivo `.env.local`:

```bash
# Resend API Key (obtenida en paso 2)
RESEND_API_KEY=re_your_actual_api_key_here

# URL de tu aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Desarrollo
# NEXT_PUBLIC_APP_URL=https://ombupolideportivo.com  # Producción
```

## Modo Testing (Desarrollo)

En desarrollo, Resend te permite enviar emails sin verificar el dominio:

- Los emails se enviarán desde `onboarding@resend.dev`
- Solo podrás enviar emails a direcciones que agregues en "Testing Emails" en el dashboard de Resend
- Límite de 100 emails por día

Para agregar emails de prueba:
1. Ve a "Testing Emails" en el dashboard de Resend
2. Agrega los emails que quieras usar para pruebas

## Emails que se envían

### 1. Invitación a reserva (usuario existente)

**Trigger:** Cuando el dueño de una reserva invita a un usuario que ya tiene cuenta

**Contenido:**
- Nombre del organizador
- Detalles de la reserva (cancha, fecha, hora)
- Link directo a la reserva para aceptar/rechazar
- Botón de acción: "Ver Invitación"

**Destinatario:** Email del usuario invitado

### 2. Invitación a reserva (usuario nuevo)

**Trigger:** Cuando el dueño de una reserva invita a un email que no tiene cuenta

**Contenido:**
- Nombre del organizador
- Detalles de la reserva (cancha, fecha, hora)
- Explicación de que necesita registrarse
- Link a la página de login/registro
- Botón de acción: "Registrarse y Aceptar"

**Destinatario:** Email del invitado

## Personalización del email "from"

### Desarrollo/Testing
```typescript
from: 'onboarding@resend.dev'
```

### Producción (después de verificar dominio)
```typescript
from: 'Polideportivo Ombú <invitaciones@ombupolideportivo.com>'
// o
from: 'Polideportivo Ombú <noreply@ombupolideportivo.com>'
```

## Templates de Email

Los templates están definidos en:
- `/src/app/api/send-invitation/route.ts`

Son HTML inline con estilos CSS embebidos para máxima compatibilidad con clientes de email.

### Personalización

Para modificar los templates:

1. Abre el archivo de la API route
2. Busca la variable `emailHtml`
3. Modifica el HTML según necesites
4. Mantén los estilos inline para compatibilidad

## Testing

### Enviar email de prueba manualmente

Puedes probar el envío de emails creando una invitación en la aplicación:

1. Inicia sesión en la app
2. Ve a "Mis Reservas"
3. Haz clic en "Gestionar" en una reserva
4. Invita a un jugador usando un email de prueba

### Verificar envío en Resend

1. Ve al dashboard de Resend
2. Haz clic en "Logs"
3. Verás todos los emails enviados, con:
   - Estado (delivered, bounced, etc.)
   - Destinatario
   - Asunto
   - Fecha/hora
   - Posibilidad de ver el contenido HTML

## Límites y Pricing

### Plan gratuito de Resend
- 3,000 emails/mes
- 100 emails/día
- Soporte por email

### Plan Pro ($20/mes)
- 50,000 emails/mes
- 1,000 emails/día
- Webhooks
- Dominios personalizados ilimitados
- Soporte prioritario

Ver más en: https://resend.com/pricing

## Troubleshooting

### Email no se envía

1. Verifica que `RESEND_API_KEY` esté configurada correctamente
2. Revisa los logs del servidor (`console.error` en la API route)
3. Verifica en el dashboard de Resend si hay errores
4. Asegúrate de que el email destinatario esté en "Testing Emails" (desarrollo)

### Email va a spam

En producción, para evitar que los emails vayan a spam:

1. ✅ Verifica tu dominio con SPF, DKIM y DMARC
2. ✅ Usa un dominio real (no `@gmail.com` o `@yahoo.com`)
3. ✅ Mantén una buena reputación (evita bounce rates altos)
4. ✅ Incluye un link de "darse de baja" si es necesario
5. ✅ No uses palabras spam en el asunto

### Error "Failed to send email"

Si ves este error en el toast:

1. Revisa la consola del navegador para más detalles
2. Verifica que la API route esté funcionando: `/api/send-invitation`
3. Asegúrate de que el usuario esté autenticado
4. Revisa los logs del servidor

## Mejoras futuras

- [ ] Agregar más templates (confirmación de reserva, recordatorio, etc.)
- [ ] Usar un servicio de templates de Resend en vez de HTML inline
- [ ] Agregar tracking de apertura de emails
- [ ] Implementar webhooks para actualizar estado de invitaciones
- [ ] Agregar opción de "reenviar invitación"
- [ ] Email de notificación cuando alguien acepta/rechaza una invitación
