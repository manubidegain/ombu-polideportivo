# Configuración de Notificaciones por Email

## 1. Configurar Resend

### Paso 1: Crear cuenta en Resend
1. Visita [resend.com](https://resend.com)
2. Crea una cuenta gratuita (permite 100 emails/día en el plan gratuito, 3,000/mes)
3. Verifica tu email

### Paso 2: Obtener API Key
1. En el dashboard de Resend, ve a **API Keys**
2. Click en **Create API Key**
3. Dale un nombre descriptivo (ej: "Polideportivo Ombú - Production")
4. Copia la API key (solo se muestra una vez)

### Paso 3: Configurar dominio (Opcional pero recomendado)
Para usar un dominio personalizado (ej: `reservas@polideportivoorembu.com`):

1. En Resend, ve a **Domains**
2. Click en **Add Domain**
3. Ingresa tu dominio (ej: `polideportivoorembu.com`)
4. Sigue las instrucciones para agregar los registros DNS:
   - **SPF**: Agrega un registro TXT para autenticación
   - **DKIM**: Agrega registros CNAME para firma de emails
   - **DMARC**: Agrega políticas de autenticación

**Si no tienes dominio personalizado:**
- Puedes usar el dominio de prueba de Resend
- Los emails se enviarán desde `onboarding@resend.dev`
- Actualiza `src/lib/email/send.ts` línea 22:
  ```typescript
  from: 'Polideportivo Ombú <onboarding@resend.dev>',
  ```

### Paso 4: Configurar variables de entorno
1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Agrega tu API key de Resend:
   ```env
   RESEND_API_KEY=re_123456789_tu_api_key_aqui
   ```

3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 2. Probar el envío de emails

### Prueba manual con la API route
```bash
curl -X POST http://localhost:3000/api/reservations/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "to": "tu-email@example.com",
    "userName": "Juan Pérez",
    "courtName": "Pádel Cerrada 1",
    "date": "2026-03-20",
    "startTime": "18:00",
    "duration": 60,
    "price": 1500
  }'
```

### Prueba desde la aplicación
1. Inicia sesión en la aplicación
2. Realiza una reserva
3. Después de confirmar, deberías recibir un email de confirmación

## 3. Personalizar el template de email

El template HTML está en `src/lib/email/templates.ts`. Puedes personalizarlo para:

- Cambiar colores
- Agregar el logo del polideportivo
- Modificar el contenido
- Agregar enlaces a redes sociales

## 4. Monitoreo

### Ver emails enviados
1. En Resend dashboard, ve a **Emails**
2. Verás todos los emails enviados con su estado:
   - ✅ **Delivered**: Email entregado exitosamente
   - ⏳ **Queued**: Email en cola
   - ❌ **Bounced**: Email rebotado (dirección no existe)
   - ❌ **Failed**: Error al enviar

### Logs en la aplicación
Los errores de envío se registran en la consola del servidor:
```bash
npm run dev
# Verás logs como:
# Error sending booking confirmation email: {...}
```

## 5. Mejoras futuras

### Agregar más tipos de emails
- Email de cancelación
- Recordatorio 24h antes de la reserva
- Email de bienvenida al registrarse
- Email de cambios en la reserva

### Agregar WhatsApp
Según la documentación (`docs/reservas-sistema.md`), el siguiente paso es integrar WhatsApp Business API para enviar notificaciones adicionales.

## 6. Troubleshooting

### El email no llega
1. **Revisa spam**: Los emails podrían estar en la carpeta de spam
2. **Verifica la API key**: Asegúrate de que `RESEND_API_KEY` esté correctamente configurada
3. **Revisa los logs**: Busca errores en la consola del servidor
4. **Verifica el dominio**: Si usas dominio personalizado, asegúrate de que los registros DNS estén configurados

### Error: "Missing required fields"
El endpoint de la API requiere todos estos campos:
- `to`: Email del destinatario
- `userName`: Nombre del usuario
- `courtName`: Nombre de la cancha
- `date`: Fecha de la reserva (formato: YYYY-MM-DD)
- `startTime`: Hora de inicio (formato: HH:MM)
- `duration`: Duración en minutos
- `price`: Precio de la reserva

### Error: "RESEND_API_KEY is not defined"
Asegúrate de:
1. Tener el archivo `.env.local` en la raíz del proyecto
2. La variable esté escrita correctamente: `RESEND_API_KEY=...`
3. Reiniciar el servidor después de agregar la variable

## 7. Límites del plan gratuito

**Resend Free Plan:**
- 100 emails/día
- 3,000 emails/mes
- 1 dominio verificado
- Retención de logs: 7 días

Si necesitas más, considera actualizar al plan Pro ($20/mes):
- 50,000 emails/mes
- Dominios ilimitados
- Retención de logs: 30 días
- Soporte prioritario
