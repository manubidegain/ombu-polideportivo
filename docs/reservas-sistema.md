# Sistema de Reservas - Polideportivo Ombú

## 1. Overview del Sistema

### Descripción General
Sistema completo de gestión de reservas para un polideportivo con múltiples canchas de pádel y fútbol. Permite a los usuarios reservar canchas con diferentes duraciones, gestionar precios dinámicos, y recibir confirmaciones automáticas vía WhatsApp y Email.

### Objetivos del Sistema
- **Para Clientes**:
  - Reservar canchas de forma rápida e intuitiva
  - Ver disponibilidad en tiempo real
  - Gestionar reservas (ver historial, cancelar)
  - Recibir confirmaciones automáticas
  - Crear reservas recurrentes

- **Para Administradores**:
  - Gestionar inventario de canchas
  - Configurar precios dinámicos por horario/día/promoción
  - Bloquear fechas para eventos/torneos/mantenimiento
  - Visualizar todas las reservas
  - Configurar horarios y duraciones permitidas

### Usuarios del Sistema
1. **Clientes** - Usuarios que reservan canchas
2. **Administradores** - Personal del polideportivo que gestiona el sistema

---

## 2. Modelo de Datos

### Inventario de Canchas
**2 Canchas de Pádel Cerradas**
**1 Cancha de Pádel Abierta**
**1 Cancha de Fútbol 5 Abierta**
**1 Cancha de Fútbol 7 Cerrada**

### 2.1 Diagrama de Relaciones

```
users (Supabase Auth)
  |
  └─── reservations
          ├─── court_id → courts
          ├─── user_id → users
          └─── recurring_parent_id → reservations (self-reference)

courts
  ├─── timeslot_configs (1:N)
  ├─── reservations (1:N)
  └─── blocked_dates (1:N)

pricing_rules (standalone, matched by rules)
```

### 2.2 Tabla: `courts`

**Propósito**: Almacenar información de cada cancha disponible.

```sql
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,  -- "Pádel Cerrada 1", "Pádel Cerrada 2", "Pádel Abierta", "Fútbol 5", "Fútbol 7"
  type TEXT NOT NULL,  -- "padel-cerrada", "padel-abierta", "futbol-5", "futbol-7"
  sport TEXT NOT NULL, -- "padel", "futbol"
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_courts_type ON courts(type);
CREATE INDEX idx_courts_sport ON courts(sport);
```

**Datos Iniciales**:
```sql
INSERT INTO courts (name, type, sport, image_url) VALUES
  ('Pádel Cerrada 1', 'padel-cerrada', 'padel', '...'),
  ('Pádel Cerrada 2', 'padel-cerrada', 'padel', '...'),
  ('Pádel Abierta', 'padel-abierta', 'padel', '...'),
  ('Fútbol 5', 'futbol-5', 'futbol', '...'),
  ('Fútbol 7', 'futbol-7', 'futbol', '...');
```

### 2.3 Tabla: `timeslot_configs`

**Propósito**: Configurar los horarios disponibles y duraciones permitidas por cancha y día de la semana.

```sql
CREATE TABLE timeslot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,  -- Ej: '08:00'
  end_time TIME NOT NULL,    -- Ej: '23:00'
  allowed_durations INT[] NOT NULL, -- [60, 90] en minutos
  max_concurrent_bookings INT DEFAULT 1, -- Cuántas reservas simultáneas se permiten
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(court_id, day_of_week)
);

CREATE INDEX idx_timeslot_configs_court ON timeslot_configs(court_id);
```

**Ejemplo de Configuración**:
```sql
-- Pádel Cerrada 1: Lunes a Viernes, 8am-11pm, 60 o 90 min
INSERT INTO timeslot_configs (court_id, day_of_week, start_time, end_time, allowed_durations, max_concurrent_bookings)
VALUES
  ('court-id-1', 1, '08:00', '23:00', ARRAY[60, 90], 1),  -- Lunes
  ('court-id-1', 2, '08:00', '23:00', ARRAY[60, 90], 1),  -- Martes
  ('court-id-1', 3, '08:00', '23:00', ARRAY[60, 90], 1),  -- Miércoles
  -- ... etc
```

### 2.4 Tabla: `pricing_rules`

**Propósito**: Definir precios dinámicos según tipo de cancha, día, horario, duración, y si tiene luz o promoción.

```sql
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_type TEXT NOT NULL,  -- "padel-cerrada", "padel-abierta", etc.
  day_type TEXT NOT NULL,    -- "weekday" (L-V), "weekend" (S-D)
  time_start TIME NOT NULL,  -- Inicio del rango horario
  time_end TIME NOT NULL,    -- Fin del rango horario
  duration INT NOT NULL,     -- 60 o 90 minutos
  price DECIMAL(10,2) NOT NULL,
  has_lighting BOOLEAN DEFAULT false,  -- Si el precio incluye iluminación
  is_promotion BOOLEAN DEFAULT false,
  promotion_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pricing_rules_type ON pricing_rules(court_type);
CREATE INDEX idx_pricing_rules_day ON pricing_rules(day_type);
```

**Ejemplo de Reglas de Precio**:
```sql
-- Pádel Cerrada: Lun-Vie 14:00-18:00, 60min, sin luz = $1000
INSERT INTO pricing_rules (court_type, day_type, time_start, time_end, duration, price, has_lighting)
VALUES ('padel-cerrada', 'weekday', '14:00', '18:00', 60, 1000.00, false);

-- Pádel Cerrada: Lun-Vie 18:00-23:00, 60min, con luz = $1500
INSERT INTO pricing_rules (court_type, day_type, time_start, time_end, duration, price, has_lighting)
VALUES ('padel-cerrada', 'weekday', '18:00', '23:00', 60, 1500.00, true);

-- Pádel Cerrada: Sábado todo el día, 90min, con luz = $2200
INSERT INTO pricing_rules (court_type, day_type, time_start, time_end, duration, price, has_lighting)
VALUES ('padel-cerrada', 'weekend', '08:00', '23:00', 90, 2200.00, true);

-- Promoción: Pádel Abierta, Lun-Vie 08:00-14:00, 60min = $800
INSERT INTO pricing_rules (court_type, day_type, time_start, time_end, duration, price, has_lighting, is_promotion, promotion_name)
VALUES ('padel-abierta', 'weekday', '08:00', '14:00', 60, 800.00, false, true, 'Happy Morning');
```

### 2.5 Tabla: `reservations`

**Propósito**: Almacenar todas las reservas realizadas por los usuarios.

```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INT NOT NULL CHECK (duration IN (60, 90)),
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  is_recurring BOOLEAN DEFAULT false,
  recurring_parent_id UUID REFERENCES reservations(id),  -- Si es parte de serie recurrente
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,

  CONSTRAINT no_overlap EXCLUDE USING gist (
    court_id WITH =,
    date WITH =,
    tsrange(start_time, (start_time + (duration || ' minutes')::interval)::time) WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX idx_reservations_court ON reservations(court_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_status ON reservations(status);
```

**Notas**:
- `EXCLUDE` constraint previene overlapping de reservas en la misma cancha
- `recurring_parent_id` enlaza reservas recurrentes a la reserva original

### 2.6 Tabla: `blocked_dates`

**Propósito**: Bloquear fechas/horarios específicos por torneos, mantenimiento, o eventos privados.

```sql
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id),  -- NULL = todas las canchas
  date DATE NOT NULL,
  start_time TIME,  -- NULL = día completo
  end_time TIME,    -- NULL = día completo
  reason TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tournament', 'maintenance', 'private-event')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX idx_blocked_dates_court ON blocked_dates(court_id);
```

**Ejemplos**:
```sql
-- Bloquear todas las canchas el 25 de diciembre
INSERT INTO blocked_dates (court_id, date, reason, type)
VALUES (NULL, '2025-12-25', 'Navidad', 'private-event');

-- Bloquear Pádel Cerrada 1 el 15 de marzo de 10am a 2pm por mantenimiento
INSERT INTO blocked_dates (court_id, date, start_time, end_time, reason, type)
VALUES ('court-id-1', '2025-03-15', '10:00', '14:00', 'Mantenimiento de piso', 'maintenance');

-- Bloquear Fútbol 7 todo el 20 de marzo por torneo
INSERT INTO blocked_dates (court_id, date, reason, type)
VALUES ('court-futbol7-id', '2025-03-20', 'Torneo Local', 'tournament');
```

### 2.7 Tabla: `users` (Profile Extension)

**Propósito**: Extender el perfil de usuario de Supabase Auth con información adicional.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. Lógica de Negocio

### 3.1 Cálculo de Disponibilidad

**Algoritmo para determinar slots disponibles**:

```typescript
function getAvailableSlots(courtId: string, date: Date, duration: 60 | 90) {
  // 1. Obtener configuración de horarios para ese día de la semana
  const dayOfWeek = date.getDay();
  const config = await getTimeslotConfig(courtId, dayOfWeek);

  if (!config) return [];
  if (!config.allowed_durations.includes(duration)) return [];

  // 2. Generar todos los slots posibles en intervalos de 30 min
  const allSlots = generateTimeSlots(
    config.start_time,
    config.end_time,
    duration
  );

  // 3. Filtrar slots que ya están reservados
  const reservations = await getReservations(courtId, date, 'confirmed');
  const bookedSlots = reservations.map(r => ({
    start: r.start_time,
    end: addMinutes(r.start_time, r.duration)
  }));

  const availableSlots = allSlots.filter(slot =>
    !hasOverlap(slot, bookedSlots)
  );

  // 4. Filtrar slots que están bloqueados
  const blockedRanges = await getBlockedRanges(courtId, date);
  const finalSlots = availableSlots.filter(slot =>
    !hasOverlap(slot, blockedRanges)
  );

  // 5. Verificar max_concurrent_bookings
  const slotsWithCapacity = finalSlots.filter(slot => {
    const concurrentCount = countConcurrentBookings(slot, reservations);
    return concurrentCount < config.max_concurrent_bookings;
  });

  return slotsWithCapacity;
}
```

### 3.2 Sistema de Duraciones Variables

**Problema**: Un usuario puede elegir 1 hora o 1.5 horas para la misma cancha.

**Solución**:
- Los slots se generan en intervalos de 30 minutos
- Duraciones de 60 min: 08:00, 08:30, 09:00, 09:30, ...
- Duraciones de 90 min: 08:00, 08:30, 09:00, 09:30, ...
- El sistema valida overlap al momento de reservar

**Ejemplo**:
```
Reserva 1: 08:00 - 09:00 (60 min)
Reserva 2: 09:00 - 10:30 (90 min) ✓ OK
Reserva 3: 08:30 - 10:00 (90 min) ✗ OVERLAP con Reserva 1
```

### 3.3 Precios Dinámicos

**Algoritmo para calcular precio**:

```typescript
function calculatePrice(
  courtType: string,
  date: Date,
  startTime: string,
  duration: number
): number {
  const dayOfWeek = date.getDay();
  const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday';

  // Buscar regla de precio que coincida
  const pricingRule = await db.pricing_rules.findFirst({
    where: {
      court_type: courtType,
      day_type: dayType,
      time_start: { lte: startTime },
      time_end: { gt: startTime },
      duration: duration
    },
    orderBy: {
      is_promotion: 'desc'  // Priorizar promociones
    }
  });

  if (!pricingRule) {
    throw new Error('No pricing rule found');
  }

  return pricingRule.price;
}
```

**Consideraciones**:
- `has_lighting` se usa para diferenciación de precios (ej: después de las 6pm)
- Las promociones tienen prioridad sobre precios normales
- Si no hay regla, se debe configurar un precio por defecto

### 3.4 Reservas Simultáneas

**Configuración**: `max_concurrent_bookings` en `timeslot_configs`.

**Caso de Uso**: Permitir que varias personas reserven el mismo slot (ej: clases grupales, o pádel con múltiples grupos).

**Implementación**:
```typescript
function canBook(courtId: string, date: Date, startTime: string): boolean {
  const config = await getTimeslotConfig(courtId, date.getDay());
  const existingBookings = await countBookingsAt(courtId, date, startTime);

  return existingBookings < config.max_concurrent_bookings;
}
```

**Nota**: Para el Ombú, típicamente será `1` (una reserva a la vez).

### 3.5 Validaciones Críticas

#### 3.5.1 No Overlap de Reservas
Implementado a nivel de base de datos con `EXCLUDE` constraint:
```sql
CONSTRAINT no_overlap EXCLUDE USING gist (
  court_id WITH =,
  date WITH =,
  tsrange(start_time, (start_time + (duration || ' minutes')::interval)::time) WITH &&
) WHERE (status = 'confirmed')
```

#### 3.5.2 Respeto de Días Bloqueados
```typescript
async function validateNotBlocked(
  courtId: string,
  date: Date,
  startTime: string,
  duration: number
): Promise<boolean> {
  const blockedRanges = await db.blocked_dates.findMany({
    where: {
      OR: [
        { court_id: courtId },
        { court_id: null }  // Bloqueos globales
      ],
      date: date
    }
  });

  for (const block of blockedRanges) {
    // Si es bloqueo de día completo
    if (!block.start_time && !block.end_time) {
      return false;
    }

    // Si hay overlap con el rango bloqueado
    const bookingEnd = addMinutes(startTime, duration);
    if (hasTimeOverlap(startTime, bookingEnd, block.start_time, block.end_time)) {
      return false;
    }
  }

  return true;
}
```

#### 3.5.3 Cancelación 24h Antes
```typescript
async function canCancel(reservationId: string): Promise<boolean> {
  const reservation = await db.reservations.findUnique({
    where: { id: reservationId }
  });

  if (!reservation || reservation.status === 'cancelled') {
    return false;
  }

  const reservationDateTime = combineDateAndTime(
    reservation.date,
    reservation.start_time
  );

  const hoursUntilReservation = differenceInHours(
    reservationDateTime,
    new Date()
  );

  return hoursUntilReservation >= 24;
}
```

#### 3.5.4 Duración Permitida
```typescript
async function isDurationAllowed(
  courtId: string,
  dayOfWeek: number,
  duration: number
): Promise<boolean> {
  const config = await getTimeslotConfig(courtId, dayOfWeek);

  if (!config) return false;

  return config.allowed_durations.includes(duration);
}
```

---

## 4. Flujos de Usuario

### 4.1 Flujo de Reserva (Cliente)

**Paso 1: Selección de Deporte**
```
┌─────────────────────────────────────┐
│  RESERVAR CANCHA                    │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐    ┌──────────┐      │
│  │  PÁDEL   │    │  FÚTBOL  │      │
│  │          │    │          │      │
│  │  🏸      │    │  ⚽      │      │
│  └──────────┘    └──────────┘      │
│                                     │
└─────────────────────────────────────┘
```

**Paso 2: Selección de Cancha**
```
┌─────────────────────────────────────┐
│  PÁDEL - Selecciona tu cancha       │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────┐                │
│  │ Pádel Cerrada 1 │ [Ver]          │
│  │ Panorámica      │                │
│  └─────────────────┘                │
│                                     │
│  ┌─────────────────┐                │
│  │ Pádel Cerrada 2 │ [Ver]          │
│  │ Panorámica      │                │
│  └─────────────────┘                │
│                                     │
│  ┌─────────────────┐                │
│  │ Pádel Abierta   │ [Ver]          │
│  │ Al aire libre   │                │
│  └─────────────────┘                │
│                                     │
└─────────────────────────────────────┘
```

**Paso 3: Vista de Calendario**
```
┌─────────────────────────────────────┐
│  Pádel Cerrada 1                    │
├─────────────────────────────────────┤
│                                     │
│  Marzo 2025          [<]  [>]       │
│  ┌──┬──┬──┬──┬──┬──┬──┐            │
│  │Lu│Ma│Mi│Ju│Vi│Sa│Do│            │
│  ├──┼──┼──┼──┼──┼──┼──┤            │
│  │  │  │  │ 1│ 2│ 3│ 4│            │
│  │ 5│ 6│ 7│ 8│ 9│10│11│            │
│  │12│13│14│15│16│17│18│ ← Hoy      │
│  │19│20│21│22│23│24│25│            │
│  │26│27│28│29│30│31│  │            │
│  └──┴──┴──┴──┴──┴──┴──┘            │
│                                     │
│  Fecha seleccionada: 20 Marzo 2025  │
│                                     │
│  [Continuar] →                      │
└─────────────────────────────────────┘
```

**Paso 4: Selección de Duración**
```
┌─────────────────────────────────────┐
│  ¿Cuánto tiempo necesitas?          │
├─────────────────────────────────────┤
│                                     │
│  ○ 1 hora                           │
│     $1,500                          │
│                                     │
│  ○ 1 hora y media                   │
│     $2,200                          │
│                                     │
│  [Continuar] →                      │
└─────────────────────────────────────┘
```

**Paso 5: Selección de Timeslot**
```
┌─────────────────────────────────────┐
│  20 Marzo 2025 - 1 hora             │
├─────────────────────────────────────┤
│                                     │
│  Mañana                             │
│  ┌──────────┐ ┌──────────┐         │
│  │ 08:00    │ │ 09:00    │ (tomado)│
│  │ $1,000   │ │ -        │         │
│  └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐         │
│  │ 10:00    │ │ 11:00    │         │
│  │ $1,000   │ │ $1,000   │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  Tarde                              │
│  ┌──────────┐ ┌──────────┐         │
│  │ 14:00    │ │ 15:00    │         │
│  │ $1,000   │ │ $1,000   │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  Noche (con luz)                    │
│  ┌──────────┐ ┌──────────┐         │
│  │ 18:00    │ │ 19:00    │         │
│  │ $1,500   │ │ $1,500   │         │
│  └──────────┘ └──────────┘         │
│                                     │
└─────────────────────────────────────┘
```

**Paso 6: Formulario de Confirmación**
```
┌─────────────────────────────────────┐
│  Confirmar Reserva                  │
├─────────────────────────────────────┤
│                                     │
│  Cancha: Pádel Cerrada 1            │
│  Fecha: 20 Marzo 2025               │
│  Hora: 18:00 - 19:00                │
│  Precio: $1,500                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Nombre completo               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Email                         │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Teléfono (WhatsApp)           │  │
│  └───────────────────────────────┘  │
│                                     │
│  ☐ Reserva recurrente (semanal)    │
│                                     │
│  ☐ Agregar a Google Calendar       │
│                                     │
│  [Confirmar Reserva]                │
└─────────────────────────────────────┘
```

**Paso 7: Confirmación Exitosa**
```
┌─────────────────────────────────────┐
│  ✓ Reserva Confirmada               │
├─────────────────────────────────────┤
│                                     │
│  Tu reserva ha sido confirmada      │
│                                     │
│  📧 Te enviamos un email a:         │
│     juan@example.com                │
│                                     │
│  📱 Y un WhatsApp al:               │
│     +598 95 123 456                 │
│                                     │
│  Detalles:                          │
│  - Cancha: Pádel Cerrada 1          │
│  - Fecha: 20 Marzo 2025             │
│  - Hora: 18:00 - 19:00              │
│  - Precio: $1,500 (pagar en lugar)  │
│                                     │
│  [Ver Mis Reservas] [Volver]        │
└─────────────────────────────────────┘
```

### 4.2 Flujo de Cancelación

```
Mis Reservas
↓
Seleccionar reserva a cancelar
↓
Validar: ¿Más de 24h de anticipación?
├─ Sí → Confirmar cancelación
│         ↓
│         Actualizar status a 'cancelled'
│         ↓
│         Enviar notificación de cancelación
│         ↓
│         Eliminar evento de Google Calendar
│         ↓
│         Mostrar confirmación
│
└─ No → Mostrar error: "No se puede cancelar con menos de 24h"
```

### 4.3 Flujo de Reserva Recurrente

```
Usuario marca "Reserva recurrente"
↓
Mostrar opciones:
- Frecuencia: Semanal (mismo día/hora cada semana)
- Fecha final: Selector de fecha
↓
Preview de reservas generadas:
"Se crearán 8 reservas:"
- 20 Marzo 2025, 18:00
- 27 Marzo 2025, 18:00
- 03 Abril 2025, 18:00
- ...
↓
Usuario confirma
↓
Validar disponibilidad de TODAS las fechas
├─ Todas disponibles → Crear todas las reservas
│                      ↓
│                      Marcar como serie recurrente
│                      ↓
│                      Enviar confirmación
│
└─ Alguna no disponible → Mostrar fechas conflictivas
                           ↓
                           Permitir ajustar o cancelar
```

### 4.4 Flujo Admin

**Dashboard de Reservas**
```
Vista de calendario maestro
├─ Ver todas las canchas
├─ Filtrar por fecha/cancha/usuario
├─ Ver detalles de reserva
└─ Cancelar reserva (admin override)
```

**Gestión de Canchas**
```
CRUD de canchas
├─ Crear nueva cancha
├─ Editar cancha existente
├─ Desactivar cancha
└─ Ver estadísticas de uso
```

**Configuración de Precios**
```
Lista de reglas de precio
├─ Crear nueva regla
├─ Editar regla existente
├─ Eliminar regla
└─ Ver preview de precios por horario
```

**Bloqueo de Fechas**
```
Calendario de bloqueos
├─ Seleccionar cancha (o todas)
├─ Seleccionar fecha(s)
├─ Seleccionar horario (o día completo)
├─ Especificar razón y tipo
└─ Confirmar bloqueo
    ↓
    Sistema verifica reservas existentes
    ├─ Sin conflictos → Bloquear
    └─ Con conflictos → Mostrar advertencia
                        ↓
                        Opción: Cancelar reservas o ajustar bloqueo
```

---

## 5. API / Funciones

### 5.1 API Routes Next.js

#### GET `/api/courts`
Listar todas las canchas activas.

**Response**:
```json
{
  "courts": [
    {
      "id": "uuid",
      "name": "Pádel Cerrada 1",
      "type": "padel-cerrada",
      "sport": "padel",
      "image_url": "https://...",
      "is_active": true
    }
  ]
}
```

#### GET `/api/courts/[id]/availability`
Obtener disponibilidad de una cancha para un rango de fechas.

**Query Params**:
- `date`: YYYY-MM-DD
- `duration`: 60 | 90

**Response**:
```json
{
  "date": "2025-03-20",
  "available_slots": [
    {
      "start_time": "08:00",
      "price": 1000,
      "has_lighting": false
    },
    {
      "start_time": "10:00",
      "price": 1000,
      "has_lighting": false
    },
    {
      "start_time": "18:00",
      "price": 1500,
      "has_lighting": true
    }
  ],
  "blocked_ranges": [
    {
      "start_time": "14:00",
      "end_time": "16:00",
      "reason": "Mantenimiento"
    }
  ]
}
```

#### POST `/api/reservations`
Crear una nueva reserva.

**Request Body**:
```json
{
  "court_id": "uuid",
  "date": "2025-03-20",
  "start_time": "18:00",
  "duration": 60,
  "user_name": "Juan Pérez",
  "user_email": "juan@example.com",
  "user_phone": "+59895123456",
  "is_recurring": false,
  "add_to_google_calendar": true
}
```

**Response**:
```json
{
  "reservation": {
    "id": "uuid",
    "court_id": "uuid",
    "court_name": "Pádel Cerrada 1",
    "date": "2025-03-20",
    "start_time": "18:00",
    "duration": 60,
    "price": 1500,
    "status": "confirmed",
    "google_calendar_event_id": "..."
  }
}
```

#### DELETE `/api/reservations/[id]`
Cancelar una reserva.

**Response**:
```json
{
  "success": true,
  "message": "Reserva cancelada exitosamente"
}
```

**Errores**:
```json
{
  "error": "Cannot cancel reservation less than 24 hours before",
  "hours_until_reservation": 12
}
```

#### GET `/api/reservations/me`
Obtener reservas del usuario autenticado.

**Response**:
```json
{
  "reservations": [
    {
      "id": "uuid",
      "court_name": "Pádel Cerrada 1",
      "date": "2025-03-20",
      "start_time": "18:00",
      "duration": 60,
      "price": 1500,
      "status": "confirmed",
      "can_cancel": true
    }
  ]
}
```

### 5.2 Supabase Edge Functions

#### `send-booking-confirmation`

**Trigger**: POST a Edge Function después de crear reserva.

**Proceso**:
1. Recibir datos de reserva
2. Generar mensaje para WhatsApp
3. Enviar vía WhatsApp Business API
4. Generar email HTML
5. Enviar vía Resend

**WhatsApp Template**:
```
¡Reserva confirmada! 🎾

Cancha: {court_name}
Fecha: {date_formatted}
Hora: {start_time} - {end_time}
Precio: ${price} (pagar en el lugar)

Ubicación: Martín Salaberry 2831, Durazno

¡Te esperamos!

Para cancelar, ingresa a: {cancel_url}
(hasta 24hs antes)
```

**Email Template** (HTML):
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <h1>¡Reserva Confirmada!</h1>
  <p>Hola {user_name},</p>
  <p>Tu reserva ha sido confirmada con éxito.</p>

  <table>
    <tr><td>Cancha:</td><td>{court_name}</td></tr>
    <tr><td>Fecha:</td><td>{date_formatted}</td></tr>
    <tr><td>Hora:</td><td>{start_time} - {end_time}</td></tr>
    <tr><td>Precio:</td><td>${price}</td></tr>
  </table>

  <a href="{google_calendar_link}">Agregar a Google Calendar</a>
  <a href="{cancel_url}">Cancelar reserva</a>
</body>
</html>
```

#### `cancel-reservation`

**Trigger**: DELETE reserva.

**Proceso**:
1. Validar 24h de anticipación
2. Si es serie recurrente, preguntar: ¿cancelar solo esta o todas?
3. Actualizar status a 'cancelled'
4. Eliminar de Google Calendar
5. Enviar notificación de cancelación

#### `create-recurring-bookings`

**Trigger**: POST reserva con `is_recurring: true`.

**Proceso**:
1. Validar fecha final
2. Generar lista de fechas (semanal)
3. Para cada fecha:
   - Validar disponibilidad
   - Si alguna no está disponible, retornar error con lista de conflictos
4. Si todas disponibles, crear todas las reservas en transacción
5. Marcar `recurring_parent_id`
6. Enviar confirmación única con todas las fechas

#### `sync-google-calendar`

**Proceso**:
1. OAuth flow para obtener token de usuario
2. Crear evento en Google Calendar
3. Guardar `google_calendar_event_id` en reserva
4. Si se cancela, eliminar evento

**Google Calendar Event**:
```json
{
  "summary": "Pádel - Polideportivo Ombú",
  "location": "Martín Salaberry 2831, Durazno",
  "description": "Reserva de Pádel Cerrada 1\nPrecio: $1500",
  "start": {
    "dateTime": "2025-03-20T18:00:00-03:00",
    "timeZone": "America/Montevideo"
  },
  "end": {
    "dateTime": "2025-03-20T19:00:00-03:00",
    "timeZone": "America/Montevideo"
  },
  "reminders": {
    "useDefault": false,
    "overrides": [
      {"method": "popup", "minutes": 24 * 60}
    ]
  }
}
```

---

## 6. Integraciones

### 6.1 WhatsApp Business API

**Setup**:
1. Crear cuenta en Meta Business
2. Obtener WhatsApp Business API access
3. Configurar número de teléfono verificado
4. Crear template de mensaje aprobado

**Envío de Mensajes**:
```typescript
import axios from 'axios';

async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  params: string[]
) {
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components: [
          {
            type: 'body',
            parameters: params.map(p => ({ type: 'text', text: p }))
          }
        ]
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}
```

**Template Example**:
```
Nombre: booking_confirmation

¡Reserva confirmada! 🎾

Cancha: {{1}}
Fecha: {{2}}
Hora: {{3}}
Precio: ${{4}}

¡Te esperamos en Polideportivo Ombú!

Cancelar: {{5}}
```

### 6.2 Resend (Email)

**Setup**:
```bash
npm install resend
```

**Envío de Email**:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendBookingConfirmation(
  to: string,
  booking: Reservation
) {
  const { data, error } = await resend.emails.send({
    from: 'Polideportivo Ombú <reservas@polideportivocombu.com>',
    to: to,
    subject: `Reserva Confirmada - ${booking.court_name}`,
    html: renderBookingConfirmationEmail(booking),
    reply_to: 'polideportivocentrounion@gmail.com'
  });

  if (error) {
    console.error('Error sending email:', error);
    throw error;
  }

  return data;
}
```

**React Email Template** (opcional):
```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button
} from '@react-email/components';

export function BookingConfirmationEmail({ booking }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc' }}>
        <Container>
          <Heading>¡Reserva Confirmada!</Heading>
          <Text>Hola {booking.user_name},</Text>
          <Text>Tu reserva ha sido confirmada con éxito.</Text>

          <table>
            <tr>
              <td>Cancha:</td>
              <td>{booking.court_name}</td>
            </tr>
            <tr>
              <td>Fecha:</td>
              <td>{formatDate(booking.date)}</td>
            </tr>
            <tr>
              <td>Hora:</td>
              <td>{booking.start_time} - {booking.end_time}</td>
            </tr>
            <tr>
              <td>Precio:</td>
              <td>${booking.price}</td>
            </tr>
          </table>

          <Button href={booking.google_calendar_link}>
            Agregar a Google Calendar
          </Button>

          <Button href={booking.cancel_url}>
            Cancelar reserva
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### 6.3 Google Calendar

**OAuth Setup**:
1. Crear proyecto en Google Cloud Console
2. Habilitar Google Calendar API
3. Configurar OAuth consent screen
4. Crear OAuth 2.0 credentials
5. Agregar scopes: `https://www.googleapis.com/auth/calendar.events`

**Auth Flow**:
```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 1. Generar URL de autorización
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events']
  });
}

// 2. Intercambiar code por tokens
async function getTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}
```

**Crear Evento**:
```typescript
async function createCalendarEvent(
  booking: Reservation,
  accessToken: string
) {
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: `Pádel - ${booking.court_name}`,
    location: 'Martín Salaberry 2831, Durazno, Uruguay',
    description: `Reserva en Polideportivo Ombú\nPrecio: $${booking.price}`,
    start: {
      dateTime: combineDateAndTime(booking.date, booking.start_time),
      timeZone: 'America/Montevideo'
    },
    end: {
      dateTime: combineDateAndTime(booking.date, addMinutes(booking.start_time, booking.duration)),
      timeZone: 'America/Montevideo'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }  // 24h antes
      ]
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event
  });

  return response.data.id;  // Guardar este ID en la reserva
}
```

**Eliminar Evento**:
```typescript
async function deleteCalendarEvent(
  eventId: string,
  accessToken: string
) {
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId
  });
}
```

---

## 7. Casos Edge

### 7.1 Dos Slots Consecutivos vs Un Slot Largo

**Pregunta**: ¿Qué pasa si se reservan 2 slots consecutivos de 1h en vez de 1 slot de 1.5h?

**Respuesta**: Ambos son válidos, pero:
- **Precio**: Puede ser diferente (2x 1h ≠ 1x 1.5h según pricing rules)
- **Disponibilidad**: Si solo hay 1 slot de 1h disponible a las 18:00, no se puede reservar 2 slots
- **Recomendación**: El UI debe sugerir la opción más económica

**Implementación**:
```typescript
// Al seleccionar duración de 1.5h, mostrar también opción de 2x1h si está disponible
function getSuggestedOptions(courtId: string, date: Date, startTime: string) {
  const options = [];

  // Opción 1: Slot de 90 min
  if (isSlotAvailable(courtId, date, startTime, 90)) {
    options.push({
      type: 'single',
      duration: 90,
      price: calculatePrice(courtType, date, startTime, 90)
    });
  }

  // Opción 2: 2 slots consecutivos de 60 min
  const nextSlot = addMinutes(startTime, 60);
  if (
    isSlotAvailable(courtId, date, startTime, 60) &&
    isSlotAvailable(courtId, date, nextSlot, 60)
  ) {
    const price1 = calculatePrice(courtType, date, startTime, 60);
    const price2 = calculatePrice(courtType, date, nextSlot, 60);
    options.push({
      type: 'consecutive',
      duration: 120,
      price: price1 + price2
    });
  }

  return options;
}
```

### 7.2 Cambio de Horario de Verano

**Problema**: Uruguay cambia de horario en marzo y octubre.

**Solución**:
- Usar timestamps con timezone-aware (`TIMESTAMPTZ`)
- Siempre almacenar en UTC
- Convertir a timezone local al mostrar
- Usar librería `date-fns-tz` para manejo correcto

```typescript
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

const TIMEZONE = 'America/Montevideo';

function convertToUTC(localDate: Date): Date {
  return zonedTimeToUtc(localDate, TIMEZONE);
}

function convertToLocal(utcDate: Date): Date {
  return utcToZonedTime(utcDate, TIMEZONE);
}
```

### 7.3 Bloqueo de Fecha con Reservas Existentes

**Escenario**: Admin intenta bloquear una fecha que ya tiene reservas confirmadas.

**Solución**:
1. Detectar conflictos
2. Mostrar advertencia:
   ```
   Hay 3 reservas existentes en esta fecha:
   - 18:00 - 19:00: Juan Pérez
   - 19:00 - 20:30: María García
   - 20:30 - 21:30: Pedro López

   Opciones:
   [ ] Cancelar todas las reservas y notificar a los usuarios
   [ ] Ajustar el rango de bloqueo para evitar conflictos
   [Cancelar]
   ```
3. Si admin confirma cancelación, enviar notificación a afectados

### 7.4 Errores de WhatsApp/Email

**Escenario**: La API de WhatsApp o Resend falla.

**Solución**:
- Reserva se crea exitosamente de todas formas
- Se guarda error en tabla `notification_failures`
- Se intenta reenvío automático (máx 3 intentos)
- Admin puede ver notificaciones fallidas y reenviar manualmente

```typescript
async function sendNotifications(booking: Reservation) {
  try {
    await sendWhatsAppMessage(booking);
  } catch (error) {
    await logNotificationFailure('whatsapp', booking.id, error);
    // No fallar la reserva por esto
  }

  try {
    await sendEmail(booking);
  } catch (error) {
    await logNotificationFailure('email', booking.id, error);
  }
}
```

### 7.5 Fallo de Google Calendar Sync

**Escenario**: Usuario autoriza Google Calendar pero la sincronización falla.

**Solución**:
- Reserva se crea exitosamente
- Guardar `google_calendar_event_id: null`
- Mostrar notificación: "Reserva creada, pero no se pudo sincronizar con Google Calendar"
- Permitir retry manual desde el perfil

### 7.6 Reserva Recurrente con Día Bloqueado

**Escenario**: Usuario crea reserva recurrente, pero una de las fechas cae en día bloqueado.

**Solución**:
1. Al generar preview, marcar fechas bloqueadas:
   ```
   Se crearán 8 reservas:
   ✓ 20 Marzo 2025, 18:00
   ✓ 27 Marzo 2025, 18:00
   ✗ 03 Abril 2025, 18:00 (Bloqueado: Torneo)
   ✓ 10 Abril 2025, 18:00
   ...
   ```
2. Permitir opciones:
   - Crear solo las disponibles (saltar bloqueadas)
   - Cancelar toda la operación
   - Ajustar fechas manualmente

---

## 8. Seguridad

### 8.1 Row Level Security (RLS)

**Tabla `reservations`**:
```sql
-- Usuarios pueden ver solo sus propias reservas
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden crear reservas para sí mismos
CREATE POLICY "Users can create own reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden cancelar sus propias reservas
CREATE POLICY "Users can cancel own reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Admins pueden ver todas las reservas
CREATE POLICY "Admins can view all reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admins pueden actualizar cualquier reserva
CREATE POLICY "Admins can update any reservation"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

**Tabla `courts`**:
```sql
-- Lectura pública
CREATE POLICY "Anyone can view active courts"
  ON courts FOR SELECT
  USING (is_active = true);

-- Solo admins pueden modificar
CREATE POLICY "Only admins can modify courts"
  ON courts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### 8.2 Validación de Permisos

**Middleware de Admin**:
```typescript
export async function requireAdmin(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}
```

**Uso**:
```typescript
// app/api/admin/courts/route.ts
export async function POST(req: Request) {
  await requireAdmin(req);

  // Proceder con lógica de admin
}
```

### 8.3 Rate Limiting

Prevenir abuso de API:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests por minuto
  analytics: true
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  // Proceder con la reserva
}
```

### 8.4 Prevención de Reservas Duplicadas (Race Conditions)

**Problema**: Dos usuarios intentan reservar el mismo slot simultáneamente.

**Solución 1: Database Constraint**
Ya implementado con `EXCLUDE` constraint:
```sql
CONSTRAINT no_overlap EXCLUDE USING gist (
  court_id WITH =,
  date WITH =,
  tsrange(start_time, (start_time + (duration || ' minutes')::interval)::time) WITH &&
) WHERE (status = 'confirmed')
```

**Solución 2: Optimistic Locking**
```typescript
async function createReservation(data: ReservationData) {
  try {
    const reservation = await db.reservations.create({ data });
    return { success: true, reservation };
  } catch (error) {
    if (error.code === '23P01') {  // Exclusion violation
      return {
        success: false,
        error: 'Slot no longer available'
      };
    }
    throw error;
  }
}
```

**Solución 3: Transacciones con Lock**
```typescript
async function createReservationWithLock(data: ReservationData) {
  return await db.$transaction(async (tx) => {
    // Verificar disponibilidad con lock
    const existing = await tx.$queryRaw`
      SELECT * FROM reservations
      WHERE court_id = ${data.court_id}
      AND date = ${data.date}
      AND status = 'confirmed'
      AND tsrange(start_time, (start_time + (duration || ' minutes')::interval)::time)
      && tsrange(${data.start_time}, (${data.start_time} + (${data.duration} || ' minutes')::interval)::time)
      FOR UPDATE
    `;

    if (existing.length > 0) {
      throw new Error('Slot not available');
    }

    // Crear reserva
    return await tx.reservations.create({ data });
  });
}
```

### 8.5 Sanitización de Inputs

**Validación con Zod**:
```typescript
import { z } from 'zod';

const reservationSchema = z.object({
  court_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.enum([60, 90]),
  user_name: z.string().min(2).max(100),
  user_email: z.string().email(),
  user_phone: z.string().regex(/^\+?[\d\s-]{8,}$/),
  is_recurring: z.boolean().optional(),
  add_to_google_calendar: z.boolean().optional()
});

export async function POST(req: Request) {
  const body = await req.json();

  // Validar y sanitizar
  const validatedData = reservationSchema.parse(body);

  // Proceder con datos validados
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests - Lógica de Disponibilidad

```typescript
describe('getAvailableSlots', () => {
  it('should return available slots for a given date and duration', async () => {
    // Mock data
    const courtId = 'test-court-id';
    const date = new Date('2025-03-20');
    const duration = 60;

    // Mock existing reservations
    const existingReservations = [
      { start_time: '09:00', duration: 60 }
    ];

    const slots = await getAvailableSlots(courtId, date, duration);

    expect(slots).toContainEqual({ start_time: '08:00', price: 1000 });
    expect(slots).not.toContainEqual({ start_time: '09:00' });
  });

  it('should exclude blocked time ranges', async () => {
    // Test blocking logic
  });

  it('should respect max_concurrent_bookings', async () => {
    // Test concurrent bookings limit
  });
});
```

### 9.2 Integration Tests - Flujo de Reserva

```typescript
describe('Reservation Flow', () => {
  it('should create a reservation successfully', async () => {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        court_id: 'test-court-id',
        date: '2025-03-20',
        start_time: '18:00',
        duration: 60,
        user_name: 'Test User',
        user_email: 'test@example.com',
        user_phone: '+59895123456'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reservation).toBeDefined();
    expect(data.reservation.status).toBe('confirmed');
  });

  it('should prevent overlapping reservations', async () => {
    // Create first reservation
    await createReservation({ ... });

    // Try to create overlapping reservation
    const response = await createReservation({
      same_court: true,
      same_time: true
    });

    expect(response.status).toBe(409);  // Conflict
  });
});
```

### 9.3 E2E Tests - User Flows

```typescript
import { test, expect } from '@playwright/test';

test('User can make a reservation', async ({ page }) => {
  await page.goto('/reservas');

  // Select sport
  await page.click('text=PÁDEL');

  // Select court
  await page.click('text=Pádel Cerrada 1');

  // Select date
  await page.click('[data-date="2025-03-20"]');

  // Select duration
  await page.click('text=1 hora');

  // Select timeslot
  await page.click('[data-time="18:00"]');

  // Fill form
  await page.fill('input[name="user_name"]', 'Juan Pérez');
  await page.fill('input[name="user_email"]', 'juan@example.com');
  await page.fill('input[name="user_phone"]', '+59895123456');

  // Confirm
  await page.click('button:has-text("Confirmar Reserva")');

  // Assert success
  await expect(page.locator('text=Reserva Confirmada')).toBeVisible();
});
```

### 9.4 Testing de Notificaciones

```typescript
describe('Notifications', () => {
  it('should send WhatsApp message on booking confirmation', async () => {
    const mockWhatsApp = jest.fn();

    await createReservation({ ... });

    expect(mockWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+59895123456',
        template: 'booking_confirmation'
      })
    );
  });

  it('should send email on booking confirmation', async () => {
    const mockEmail = jest.fn();

    await createReservation({ ... });

    expect(mockEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'juan@example.com',
        subject: expect.stringContaining('Reserva Confirmada')
      })
    );
  });

  it('should handle notification failures gracefully', async () => {
    // Mock WhatsApp failure
    mockWhatsApp.mockRejectedValue(new Error('API Error'));

    const result = await createReservation({ ... });

    // Reservation should still be created
    expect(result.success).toBe(true);

    // Failure should be logged
    const failures = await db.notification_failures.findMany({
      where: { reservation_id: result.reservation.id }
    });
    expect(failures).toHaveLength(1);
  });
});
```

---

## 10. Roadmap de Implementación

### **Fase 1: Setup Base** (Semana 1)

#### 1.1 Configurar Supabase
- [x] Crear proyecto en Supabase
- [x] Configurar variables de entorno
- [x] Instalar `@supabase/supabase-js` y `@supabase/auth-helpers-nextjs`

#### 1.2 Crear Schema de Base de Datos
- [x] Crear tabla `courts`
- [x] Crear tabla `timeslot_configs`
- [x] Crear tabla `pricing_rules`
- [x] Crear tabla `reservations` (con EXCLUDE constraint)
- [x] Crear tabla `blocked_dates`
- [x] Crear tabla `users` (profile extension)
- [x] Configurar RLS policies
- [x] Insertar datos iniciales (5 canchas)

#### 1.3 Configurar Supabase Auth
- [x] Habilitar Email/Password auth
- [x] Configurar SMTP para emails (opcional: usar Supabase SMTP)
- [x] Crear función de perfil automático (trigger)

#### 1.4 TypeScript Types
- [x] Generar types desde Supabase: `npx supabase gen types typescript --project-id <project-id> > types/database.types.ts`
- [x] Crear types adicionales para DTOs

**Criterios de Aceptación**:
- Base de datos completamente configurada
- Types TypeScript disponibles
- Auth funcional (registro/login)

---

### **Fase 2: Admin Panel** (Semana 2)

#### 2.1 Admin: CRUD de Canchas
- [ ] Página `/admin/canchas`
- [ ] Tabla de canchas existentes
- [ ] Formulario crear/editar cancha
- [ ] Botón activar/desactivar cancha
- [ ] Upload de imágenes (Supabase Storage)

#### 2.2 Admin: Configuración de Timeslots
- [ ] Página `/admin/horarios`
- [ ] Por cada cancha, configurar horarios por día de semana
- [ ] Selector de duraciones permitidas (60, 90, o ambas)
- [ ] Configurar `max_concurrent_bookings`
- [ ] Preview de horarios configurados

#### 2.3 Admin: Gestión de Precios
- [ ] Página `/admin/precios`
- [ ] Tabla de reglas de precio existentes
- [ ] Formulario crear/editar pricing rule
- [ ] Filtros por tipo de cancha / día
- [ ] Preview de precios por horario (calendario visual)

#### 2.4 Admin: Bloqueo de Fechas
- [ ] Página `/admin/bloqueos`
- [ ] Calendario para seleccionar fecha
- [ ] Formulario: cancha (o todas), horario (o día completo), razón, tipo
- [ ] Validación de conflictos con reservas existentes
- [ ] Opción de cancelar reservas existentes

**Criterios de Aceptación**:
- Admin puede gestionar todas las configuraciones
- Validaciones funcionan correctamente
- Interfaz intuitiva y responsive

---

### **Fase 3: Reservas Core** (Semana 3-4)

#### 3.1 Página Selección de Canchas (por Deporte)
- [ ] `/reservas` - Grid de deportes (Pádel, Fútbol)
- [ ] `/reservas/padel` - Grid de canchas de pádel
- [ ] `/reservas/futbol` - Grid de canchas de fútbol
- [ ] Mostrar imagen, nombre, características de cada cancha
- [ ] Botón "Reservar" para cada cancha

#### 3.2 Calendario de Disponibilidad
- [ ] `/reservas/[courtId]` - Vista de calendario mensual
- [ ] Marcar días con disponibilidad limitada
- [ ] Marcar días bloqueados
- [ ] Selector de mes (navegación)
- [ ] Al seleccionar día, pasar a selector de duración

#### 3.3 Sistema de Timeslots Dinámicos
- [ ] Componente `DurationSelector` (1h / 1.5h)
- [ ] Al seleccionar duración, generar slots disponibles
- [ ] Mostrar precio por slot
- [ ] Indicar si tiene iluminación
- [ ] Marcar slots ocupados
- [ ] Agrupar por mañana/tarde/noche

#### 3.4 Formulario de Reserva
- [ ] Componente `BookingForm`
- [ ] Campos: nombre, email, teléfono
- [ ] Checkbox: reserva recurrente
- [ ] Checkbox: agregar a Google Calendar
- [ ] Resumen de reserva (cancha, fecha, hora, precio)
- [ ] Validación de campos
- [ ] Submit button

#### 3.5 Validación de Disponibilidad en Tiempo Real
- [ ] API Route: `GET /api/courts/[id]/availability`
- [ ] Función: `getAvailableSlots(courtId, date, duration)`
- [ ] Implementar lógica de overlap
- [ ] Implementar validación de bloqueos
- [ ] Implementar check de `max_concurrent_bookings`
- [ ] API Route: `POST /api/reservations`
- [ ] Validación server-side completa
- [ ] Manejo de race conditions (optimistic locking)

**Criterios de Aceptación**:
- Usuario puede reservar cancha exitosamente
- No se permiten reservas overlapping
- Precios se calculan correctamente
- Interfaz responsive y fluida

---

### **Fase 4: Integraciones** (Semana 5)

#### 4.1 Edge Function: Envío WhatsApp
- [ ] Crear Edge Function `send-booking-confirmation`
- [ ] Configurar WhatsApp Business API
- [ ] Crear template de mensaje aprobado
- [ ] Implementar envío de WhatsApp
- [ ] Manejo de errores (logging)
- [ ] Testing con números reales

#### 4.2 Edge Function: Envío Email
- [ ] Instalar Resend
- [ ] Crear template HTML de email
- [ ] Implementar envío con Resend
- [ ] Email de confirmación
- [ ] Email de cancelación
- [ ] Testing de emails

#### 4.3 Google Calendar Integration
- [ ] Setup OAuth en Google Cloud Console
- [ ] Implementar flujo de autorización
- [ ] Almacenar tokens de usuario (encriptados)
- [ ] Función: crear evento en Calendar
- [ ] Función: eliminar evento de Calendar
- [ ] Guardar `google_calendar_event_id` en reserva

#### 4.4 Sistema de Cancelación (24h)
- [ ] API Route: `DELETE /api/reservations/[id]`
- [ ] Validar 24h de anticipación
- [ ] Actualizar status a 'cancelled'
- [ ] Eliminar de Google Calendar
- [ ] Enviar notificación de cancelación
- [ ] Edge Function: `cancel-reservation`

**Criterios de Aceptación**:
- Notificaciones WhatsApp y Email funcionan correctamente
- Google Calendar se sincroniza
- Cancelación funciona con validación de 24h
- Manejo de errores robusto

---

### **Fase 5: Features Avanzadas** (Semana 6)

#### 5.1 Reservas Recurrentes
- [x] Componente `RecurringBooking` (configuración)
- [x] Selector de frecuencia: Semanal / Quincenal
- [x] Selector de fecha final
- [x] Preview de reservas a generar
- [x] Validación de disponibilidad de todas las fechas
- [x] Detección de conflictos con reservas existentes
- [x] Detección de fechas bloqueadas
- [x] Crear reservas en transacción
- [x] Marcar `recurring_parent_id`
- [x] Lógica implementada en ReservationForm (admin)
- [x] Cancelación de series (una o todas)
- [x] Indicador visual de reservas recurrentes en tabla

#### 5.2 Historial de Usuario
- [ ] Página `/perfil/reservas`
- [ ] Tabla de reservas confirmadas (futuras)
- [ ] Tabla de reservas pasadas
- [ ] Tabla de reservas canceladas
- [ ] Botón "Cancelar" (si >24h)
- [ ] Filtros por fecha/cancha
- [ ] Exportar a PDF (opcional)

#### 5.3 Dashboard de Reservas (Admin)
- [ ] Página `/admin/dashboard`
- [ ] Calendario maestro con todas las reservas
- [ ] Filtros: cancha, fecha, usuario
- [ ] Ver detalles de reserva
- [ ] Cancelar reserva (admin override)
- [ ] Estadísticas: reservas por día/semana/mes
- [ ] Gráficos de ocupación

**Criterios de Aceptación**:
- Reservas recurrentes funcionan correctamente
- Usuario puede ver y gestionar su historial
- Admin tiene visibilidad completa del sistema
- Estadísticas útiles disponibles

---

## Resumen de Dependencias

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "resend": "^3.0.0",
    "googleapis": "^128.0.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^2.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "zustand": "^4.4.0",
    "@upstash/ratelimit": "^1.0.0",
    "@upstash/redis": "^1.25.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@playwright/test": "^1.40.0",
    "vitest": "^1.0.0"
  }
}
```

---

## Estimaciones

| Fase | Duración | Complejidad |
|------|----------|-------------|
| Fase 1: Setup Base | 1 semana | Media |
| Fase 2: Admin Panel | 1 semana | Media |
| Fase 3: Reservas Core | 2 semanas | Alta |
| Fase 4: Integraciones | 1 semana | Alta |
| Fase 5: Features Avanzadas | 1 semana | Media |
| **Total** | **6 semanas** | - |

---

## Próximos Pasos

1. **Revisar y aprobar este documento**
2. **Setup inicial de Supabase**
3. **Crear schema de base de datos**
4. **Comenzar con Fase 1**

---

**Fin del Documento**
