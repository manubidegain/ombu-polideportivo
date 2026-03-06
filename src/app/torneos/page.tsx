export default function TorneosPage() {
  return (
    <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#dbf228]/10 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[#dbf228]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="font-heading text-[56px] text-white mb-4">PRÓXIMAMENTE</h1>
          <h2 className="font-heading text-[32px] text-[#dbf228] mb-6">TORNEOS</h2>
          <p className="font-body text-[18px] text-gray-400 mb-8">
            Estamos trabajando en esta sección para que puedas participar en torneos emocionantes.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-8">
          <h3 className="font-heading text-[20px] text-white mb-4">¿Qué podrás hacer?</h3>
          <ul className="space-y-3 text-left">
            <li className="font-body text-[16px] text-gray-300 flex items-start gap-3">
              <span className="text-[#dbf228] mt-1">✓</span>
              <span>Inscribirte en torneos de pádel y fútbol</span>
            </li>
            <li className="font-body text-[16px] text-gray-300 flex items-start gap-3">
              <span className="text-[#dbf228] mt-1">✓</span>
              <span>Ver fixtures y resultados en tiempo real</span>
            </li>
            <li className="font-body text-[16px] text-gray-300 flex items-start gap-3">
              <span className="text-[#dbf228] mt-1">✓</span>
              <span>Recibir notificaciones sobre tus partidos</span>
            </li>
            <li className="font-body text-[16px] text-gray-300 flex items-start gap-3">
              <span className="text-[#dbf228] mt-1">✓</span>
              <span>Competir con otros jugadores</span>
            </li>
          </ul>
        </div>

        <a
          href="/"
          className="inline-block bg-[#dbf228] text-[#1b1b1b] font-heading text-[18px] py-3 px-8 rounded-md hover:bg-[#c5db23] transition-colors"
        >
          VOLVER AL INICIO
        </a>
      </div>
    </div>
  );
}
