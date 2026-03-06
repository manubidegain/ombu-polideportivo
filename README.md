# Ombu Polideportivo

Web application for managing sports facilities, including court reservations, player rankings, and promotional landing pages.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Runtime**: Bun 1.3.10
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI**: React 19
- **Icons**: Lucide React
- **Font**: Krona One (Google Fonts)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Resend

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── reservas/     # Court booking pages
│   ├── rankings/     # Player ranking pages
│   ├── torneos/      # Tournaments pages
│   ├── tienda/       # Store pages
│   └── api/          # API routes
├── components/
│   ├── landing/      # Landing page components
│   ├── bookings/     # Booking system components
│   ├── rankings/     # Ranking components
│   └── common/       # Shared components (Navbar, Footer)
```

## Getting Started

### 1. Install dependencies:

```bash
bun install
# or
npm install
```

### 2. Set up environment variables:

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then configure:
- Supabase URL and API keys
- Resend API key (for email notifications)

See [docs/email-setup.md](docs/email-setup.md) for detailed email configuration.

### 3. Run the development server:

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### ✅ Implemented
- **Landing page** with hero section
- **Navbar** with navigation links and social sidebar
- **Footer** with contact information
- **Torneos section** - Tournament showcase
- **Canchas section** - Court information with cards
- **Sports ticker** - Infinite scroll marquee
- **Clases section** - Padel classes information
- **Sponsors section** - Call to action for sponsors
- **User Authentication** - Login/Signup with Supabase
- **Court Reservation System** - Book courts with real-time availability
- **Dynamic Pricing** - Price calculation based on court, time, and duration
- **Email Notifications** - Booking confirmations via Resend
- **Recurring Reservations** - Weekly/biweekly automatic reservations (Admin)
- **Conflict Detection** - Validates availability before creating recurring series
- **Series Cancellation** - Cancel individual or entire recurring reservation series
- **Responsive Design** - Fully responsive across all pages and components
- **Calendar Picker** - Easy date selection with collapsible month view
- **Past Time Blocking** - Prevents reservations for past dates and times

### 🔜 Coming Soon
- WhatsApp notifications
- Google Calendar integration
- User-facing recurring reservations
- User reservation history (/mis-reservas)
- Enhanced admin dashboard with statistics
- Player rankings and leaderboards
- Tournament registration
- Online store for sports equipment
- Payment integration

## Design

El diseño está basado en Figma y utiliza:
- **Colores**: Negro (#1b1b1b), Blanco, Amarillo (#FAFF00), Azul (#004AAD)
- **Tipografía**: Krona One (Bold, uppercase)
- **Estilo**: Moderno, deportivo, con alto contraste

## Development

- **Dev server**: `bun dev`
- **Build**: `bun run build`
- **Start production**: `bun start`
- **Lint**: `bun run lint`

## Contacto

- **Teléfono**: +598 95 303 311
- **Email**: polideportivocentrounion@gmail.com
- **Dirección**: Martín Salaberry 2831, Durazno, Uruguay
