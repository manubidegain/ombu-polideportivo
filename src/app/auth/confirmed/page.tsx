import Link from 'next/link';

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen bg-[#ededed] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="font-heading text-[32px] text-[#1b1b1b] mb-4">
          ¡EMAIL CONFIRMADO!
        </h1>

        {/* Message */}
        <p className="font-body text-[16px] text-gray-600 mb-8">
          Tu email ha sido verificado exitosamente. Ya puedes acceder a todas las funcionalidades del
          Polideportivo Ombú.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/reservas"
            className="block w-full bg-[#dbf228] hover:bg-[#c5db23] text-[#1b1b1b] font-heading text-[16px] py-3 rounded transition-colors"
          >
            HACER UNA RESERVA
          </Link>
          <Link
            href="/torneos"
            className="block w-full bg-[#1b1b1b] hover:bg-[#2a2a2a] text-white font-heading text-[16px] py-3 rounded transition-colors"
          >
            VER TORNEOS
          </Link>
          <Link
            href="/"
            className="block w-full text-gray-600 hover:text-[#1b1b1b] font-body text-[14px] py-2 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
