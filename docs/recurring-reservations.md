# Reservas Recurrentes - Implementación Técnica

## Overview

El sistema de reservas recurrentes permite a los administradores crear múltiples reservas automáticamente con una frecuencia semanal o quincenal. Esta funcionalidad es útil para clientes que necesitan reservar la misma cancha regularmente (ej: todos los martes a las 19:00).

## Modelo de Datos

### Campos en la tabla `reservations`

```sql
-- Indica si la reserva es parte de una serie recurrente
is_recurring BOOLEAN NOT NULL DEFAULT FALSE

-- ID de la reserva padre (primera reserva de la serie)
recurrence_parent_id UUID REFERENCES reservations(id) ON DELETE SET NULL

-- Fecha final de la serie recurrente
recurrence_end_date DATE

-- Constraint: Si is_recurring=true, debe tener fecha final
CHECK (is_recurring = FALSE OR (recurrence_end_date IS NOT NULL AND recurrence_end_date > reservation_date))
```

### Estructura de una Serie Recurrente

```
Reserva Padre (Parent):
├── id: "abc-123"
├── is_recurring: true
├── recurrence_parent_id: null
├── recurrence_end_date: "2025-06-01"
├── reservation_date: "2025-03-06"

Reservas Hijas (Children):
├── Reserva 1:
│   ├── id: "def-456"
│   ├── is_recurring: true
│   ├── recurrence_parent_id: "abc-123"
│   ├── recurrence_end_date: "2025-06-01"
│   └── reservation_date: "2025-03-13"
│
├── Reserva 2:
│   ├── id: "ghi-789"
│   ├── is_recurring: true
│   ├── recurrence_parent_id: "abc-123"
│   ├── recurrence_end_date: "2025-06-01"
│   └── reservation_date: "2025-03-20"
│
└── ...
```

## Flujo de Creación

### 1. Interfaz de Usuario

El formulario de creación de reservas (`ReservationForm.tsx`) incluye:

```tsx
// Checkbox para habilitar reservas recurrentes
<input
  type="checkbox"
  checked={formData.is_recurring}
  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
/>

// Selector de frecuencia
<select value={formData.recurrence_frequency}>
  <option value="weekly">Semanal</option>
  <option value="biweekly">Quincenal</option>
</select>

// Selector de fecha final
<input
  type="date"
  min={formData.reservation_date}
  value={formData.recurrence_end_date}
/>

// Preview de reservas a crear
{formData.reservation_date && formData.recurrence_end_date && (
  <div>
    ℹ️ Se crearán aproximadamente{' '}
    {Math.ceil(
      (new Date(formData.recurrence_end_date).getTime() -
        new Date(formData.reservation_date).getTime()) /
        (1000 * 60 * 60 * 24 * (formData.recurrence_frequency === 'weekly' ? 7 : 14))
    ) + 1}{' '}
    reservas desde {formData.reservation_date} hasta {formData.recurrence_end_date}
  </div>
)}
```

### 2. Generación de Fechas

```typescript
// Generar todas las fechas de la serie
const allDates = [];
const startDate = new Date(formData.reservation_date);
const endDate = new Date(formData.recurrence_end_date);
const increment = formData.recurrence_frequency === 'weekly' ? 7 : 14;

let currentDate = new Date(startDate);
while (currentDate <= endDate) {
  allDates.push(currentDate.toISOString().split('T')[0]);
  currentDate.setDate(currentDate.getDate() + increment);
}

// Ejemplo de resultado:
// ['2025-03-06', '2025-03-13', '2025-03-20', '2025-03-27', ...]
```

### 3. Validación de Conflictos

Antes de crear las reservas, el sistema valida:

#### a) Conflictos con Reservas Existentes

```typescript
const { data: existingReservations } = await supabase
  .from('reservations')
  .select('reservation_date, customer_name')
  .eq('court_id', formData.court_id)
  .eq('start_time', formData.start_time)
  .in('reservation_date', allDates)
  .in('status', ['confirmed', 'pending']);

if (existingReservations && existingReservations.length > 0) {
  throw new Error(
    `Conflicto: Ya existen reservas en las siguientes fechas: ${conflictDates}`
  );
}
```

#### b) Fechas Bloqueadas

```typescript
const { data: blockedDates } = await supabase
  .from('blocked_dates')
  .select('date, reason')
  .eq('court_id', formData.court_id)
  .in('date', allDates);

if (blockedDates && blockedDates.length > 0) {
  throw new Error(
    `Fechas bloqueadas encontradas: ${blockedList}`
  );
}
```

### 4. Creación de Reservas

Si no hay conflictos, se crean las reservas:

```typescript
// 1. Crear reserva padre
const { data: parentReservation } = await supabase
  .from('reservations')
  .insert([{
    ...baseReservation,
    reservation_date: formData.reservation_date,
    is_recurring: true,
    recurrence_end_date: formData.recurrence_end_date,
  }])
  .select()
  .single();

// 2. Crear reservas hijas (saltar la primera fecha que es el padre)
const childReservations = allDates.slice(1).map((date) => ({
  ...baseReservation,
  reservation_date: date,
  is_recurring: true,
  recurrence_parent_id: parentReservation.id,
  recurrence_end_date: formData.recurrence_end_date,
}));

// 3. Insertar todas las reservas hijas
await supabase
  .from('reservations')
  .insert(childReservations);
```

## Flujo de Cancelación

### Detección de Serie Recurrente

Cuando se intenta cancelar una reserva, el sistema:

1. Verifica si `is_recurring = true`
2. Obtiene el `recurrence_parent_id` (o usa el ID actual si es el padre)
3. Cuenta cuántas reservas futuras hay en la serie

```typescript
const reservation = reservations.find((r) => r.id === id);
const parentId = reservation.recurrence_parent_id || id;

const { data: seriesReservations } = await supabase
  .from('reservations')
  .select('id, reservation_date, status')
  .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
  .in('status', ['confirmed', 'pending']);

const futureReservations = seriesReservations?.filter(
  (r) => new Date(r.reservation_date) >= new Date(reservation.reservation_date)
);
```

### Opciones de Cancelación

El sistema presenta dos opciones al usuario:

#### Opción 1: Cancelar Solo Esta Reserva

```typescript
const { error } = await supabase
  .from('reservations')
  .update({ status: 'cancelled' })
  .eq('id', id);
```

#### Opción 2: Cancelar Toda la Serie (desde esta fecha en adelante)

```typescript
const { error } = await supabase
  .from('reservations')
  .update({ status: 'cancelled' })
  .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`)
  .gte('reservation_date', reservation.reservation_date)
  .in('status', ['confirmed', 'pending']);
```

### Interfaz de Usuario

```typescript
if (futureReservations.length > 1) {
  // Primer confirm: ¿Cancelar solo esta o continuar?
  if (!confirm('Esta reserva es parte de una serie recurrente.\n\n¿Qué deseas cancelar?\n\n- OK: Cancelar solo esta reserva\n- Cancelar: No cancelar nada')) {
    return;
  }

  // Segundo confirm: ¿Cancelar toda la serie?
  const cancelSeries = confirm(
    `¿Quieres cancelar TODA la serie recurrente?\n\nSe cancelarán ${futureReservations.length} reserva(s) futuras incluyendo esta.`
  );

  if (cancelSeries) {
    // Cancelar toda la serie
  } else {
    // Cancelar solo esta reserva
  }
}
```

## Indicadores Visuales

### En la Tabla de Reservas

Las reservas recurrentes muestran un badge distintivo:

```tsx
{reservation.is_recurring && (
  <span className="bg-[#dbf228]/20 text-[#dbf228] px-2 py-0.5 rounded text-[10px]">
    RECURRENTE
  </span>
)}
```

## Casos de Uso

### Caso 1: Cliente Regular

**Escenario**: Un cliente quiere reservar Pádel Cerrada 1 todos los martes a las 19:00 durante 3 meses.

**Pasos**:
1. Admin selecciona usuario, cancha y horario
2. Marca "Reserva recurrente"
3. Selecciona frecuencia "Semanal"
4. Selecciona fecha de inicio: 2025-03-11 (martes)
5. Selecciona fecha final: 2025-06-10
6. Sistema muestra: "Se crearán aproximadamente 13 reservas"
7. Admin confirma
8. Sistema valida disponibilidad de todas las fechas
9. Si no hay conflictos, crea las 13 reservas

### Caso 2: Cancelación Parcial

**Escenario**: El cliente necesita cancelar solo una reserva de la serie porque viaja.

**Pasos**:
1. Admin va a la lista de reservas
2. Encuentra la reserva del 2025-04-15
3. Hace clic en "Cancelar"
4. Sistema pregunta: "¿Cancelar solo esta o toda la serie?"
5. Admin selecciona "Solo esta"
6. Sistema cancela solo la reserva del 2025-04-15
7. El resto de la serie permanece activa

### Caso 3: Cancelación Total

**Escenario**: El cliente se lesiona y debe cancelar todas sus reservas futuras.

**Pasos**:
1. Admin va a la lista de reservas
2. Encuentra cualquier reserva futura de la serie
3. Hace clic en "Cancelar"
4. Sistema pregunta: "¿Cancelar solo esta o toda la serie?"
5. Admin selecciona "Toda la serie"
6. Sistema pregunta confirmación: "¿Cancelar 10 reservas futuras?"
7. Admin confirma
8. Sistema cancela todas las reservas desde esa fecha en adelante

### Caso 4: Conflicto Detectado

**Escenario**: Al intentar crear una serie recurrente, una de las fechas ya está reservada.

**Pasos**:
1. Admin completa el formulario de reserva recurrente
2. Sistema genera fechas: [2025-03-13, 2025-03-20, 2025-03-27, ...]
3. Sistema detecta que 2025-03-20 ya tiene una reserva confirmada
4. Sistema muestra error: "Conflicto: Ya existen reservas en las siguientes fechas: 2025-03-20 (Juan Pérez)"
5. Admin puede:
   - Ajustar la fecha de inicio
   - Ajustar la fecha final
   - Cambiar de cancha o horario

## Limitaciones Actuales

1. **Solo Admin**: Actualmente solo los administradores pueden crear reservas recurrentes
2. **No se pueden editar series**: Para modificar una serie, hay que cancelarla y crear una nueva
3. **No se detectan conflictos dinámicos**: Si alguien reserva una fecha después de crear la serie recurrente, no se detecta automáticamente

## Mejoras Futuras

1. **Permitir a usuarios crear reservas recurrentes**: Agregar la misma funcionalidad en el flujo de reservas del usuario
2. **Edición de series**: Permitir modificar el horario, precio o cancha de toda la serie
3. **Notificaciones de conflictos**: Notificar al admin si una reserva recurrente tiene conflictos con nuevas reservas
4. **Vista de calendario**: Mostrar todas las reservas de una serie en un calendario visual
5. **Excepciones**: Permitir modificar reservas individuales dentro de una serie sin romper la relación
6. **Patrones más complejos**: Soporte para frecuencias mensuales, cada N días, etc.

## Consultas SQL Útiles

### Ver todas las series recurrentes activas

```sql
SELECT
  r.id as parent_id,
  r.reservation_date as start_date,
  r.recurrence_end_date as end_date,
  c.name as court_name,
  r.start_time,
  COUNT(*) as total_reservations,
  COUNT(*) FILTER (WHERE r.status = 'confirmed') as confirmed_count,
  COUNT(*) FILTER (WHERE r.status = 'cancelled') as cancelled_count
FROM reservations r
JOIN courts c ON c.id = r.court_id
WHERE r.is_recurring = true
  AND r.recurrence_parent_id IS NULL
  AND r.recurrence_end_date >= CURRENT_DATE
GROUP BY r.id, c.name
ORDER BY r.reservation_date;
```

### Ver todas las reservas de una serie específica

```sql
SELECT
  r.id,
  r.reservation_date,
  r.start_time,
  r.duration_minutes,
  r.price,
  r.status,
  r.customer_name,
  r.is_recurring,
  r.recurrence_parent_id
FROM reservations r
WHERE r.id = 'parent-id-here'
   OR r.recurrence_parent_id = 'parent-id-here'
ORDER BY r.reservation_date;
```

### Cancelar toda una serie desde una fecha específica

```sql
UPDATE reservations
SET status = 'cancelled'
WHERE (id = 'parent-id' OR recurrence_parent_id = 'parent-id')
  AND reservation_date >= '2025-04-01'
  AND status IN ('confirmed', 'pending');
```

## Integración con Notificaciones

Cuando se crea una serie recurrente, se pueden enviar:

1. **Email de confirmación de serie**: Incluir lista de todas las fechas
2. **Recordatorios**: Enviar recordatorio 24h antes de cada reserva
3. **Notificación de cancelación de serie**: Informar al usuario cuando se cancela toda la serie

### Ejemplo de Email

```
Asunto: Serie de Reservas Confirmada - Pádel Cerrada 1

Hola Juan,

Tu serie de reservas recurrentes ha sido confirmada:

📍 Cancha: Pádel Cerrada 1
⏰ Horario: 19:00 - 20:00 (60 min)
📅 Frecuencia: Semanal (Martes)
💰 Precio por reserva: $1,500

Fechas confirmadas:
✓ 11 de marzo de 2025
✓ 18 de marzo de 2025
✓ 25 de marzo de 2025
✓ 1 de abril de 2025
... (9 fechas más)

Total: 13 reservas
Total a pagar: $19,500

Recibirás recordatorios 24 horas antes de cada reserva.

¡Te esperamos en Polideportivo Ombú!
```

## Conclusión

El sistema de reservas recurrentes simplifica la gestión de clientes regulares y reduce el trabajo administrativo. La detección de conflictos y las opciones flexibles de cancelación aseguran que el sistema sea robusto y fácil de usar.
