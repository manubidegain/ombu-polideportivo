export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#1b1b1b] text-white py-12 px-4 sm:px-8 md:px-16 lg:px-[140px]">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-[32px] sm:text-[40px] md:text-[48px] text-[#dbf228] mb-8">
          POLÍTICA DE PRIVACIDAD
        </h1>

        <div className="space-y-8 font-body text-[16px] leading-relaxed">
          <section>
            <p className="text-gray-300 mb-4">
              Última actualización: {new Date().toLocaleDateString('es-UY', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-gray-300">
              En Polideportivo Ombú nos tomamos muy en serio la privacidad de nuestros usuarios. Esta política describe cómo recopilamos,
              usamos y protegemos tu información personal cuando utilizás nuestra plataforma de reservas.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              1. INFORMACIÓN QUE RECOPILAMOS
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>Recopilamos la siguiente información cuando te registrás y usás nuestro servicio:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Información de cuenta:</strong> nombre completo, dirección de correo electrónico, número de teléfono</li>
                <li><strong>Información de autenticación:</strong> credenciales de inicio de sesión y tokens de acceso de Google OAuth</li>
                <li><strong>Información de reservas:</strong> detalles de tus reservas de canchas, fechas, horarios y jugadores invitados</li>
                <li><strong>Información de pago:</strong> historial de transacciones (no almacenamos datos de tarjetas de crédito)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              2. CÓMO USAMOS TU INFORMACIÓN
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>Utilizamos tu información para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Gestionar tu cuenta y proporcionar acceso a nuestros servicios</li>
                <li>Procesar y confirmar tus reservas de canchas</li>
                <li>Enviarte notificaciones importantes sobre tus reservas</li>
                <li>Sincronizar tus reservas con tu calendario de Google (si lo autorizás)</li>
                <li>Mejorar nuestros servicios y la experiencia del usuario</li>
                <li>Comunicarnos contigo sobre cambios en nuestro servicio</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              3. INTEGRACIÓN CON GOOGLE
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Nuestra aplicación usa Google OAuth para la autenticación y Google Calendar API para la sincronización de eventos.
              </p>
              <p>
                <strong>Permisos solicitados:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acceso a tu información básica de perfil (nombre y correo electrónico)</li>
                <li>Acceso a tu Google Calendar para crear y gestionar eventos de reservas</li>
              </ul>
              <p>
                Podés revocar el acceso a Google en cualquier momento desde tu cuenta de Google en{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dbf228] hover:underline"
                >
                  https://myaccount.google.com/permissions
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              4. COMPARTIR INFORMACIÓN
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                No vendemos, alquilamos ni compartimos tu información personal con terceros para fines de marketing.
                Compartimos tu información únicamente en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Con tu consentimiento:</strong> cuando nos autorizás explícitamente</li>
                <li><strong>Proveedores de servicios:</strong> utilizamos Supabase para almacenamiento de datos y autenticación, y Google para OAuth y Calendar</li>
                <li><strong>Requisitos legales:</strong> si es requerido por ley o para proteger nuestros derechos</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              5. SEGURIDAD DE DATOS
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encriptación de datos en tránsito (HTTPS/TLS)</li>
                <li>Almacenamiento seguro en Supabase con encriptación en reposo</li>
                <li>Autenticación mediante tokens seguros</li>
                <li>Acceso restringido a datos personales</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              6. TUS DERECHOS
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>Tenés derecho a:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acceder</strong> a tu información personal que almacenamos</li>
                <li><strong>Rectificar</strong> datos incorrectos o desactualizados</li>
                <li><strong>Eliminar</strong> tu cuenta y datos asociados</li>
                <li><strong>Exportar</strong> tus datos en un formato legible</li>
                <li><strong>Revocar</strong> el acceso a servicios de terceros (Google)</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, contactanos en{' '}
                <a
                  href="mailto:polideportivocentrounion@gmail.com"
                  className="text-[#dbf228] hover:underline"
                >
                  polideportivocentrounion@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              7. RETENCIÓN DE DATOS
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario para proporcionar nuestros servicios.
                Si eliminás tu cuenta, borraremos tu información personal dentro de los 30 días, salvo que estemos obligados legalmente a conservarla.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              8. COOKIES Y TECNOLOGÍAS SIMILARES
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Utilizamos cookies y tecnologías similares para mantener tu sesión iniciada, recordar tus preferencias y mejorar la seguridad.
                Estas cookies son esenciales para el funcionamiento del sitio.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              9. CAMBIOS A ESTA POLÍTICA
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos
                publicando la nueva política en esta página y actualizando la fecha de "Última actualización".
                Te recomendamos revisar esta política periódicamente.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[24px] text-[#dbf228] mb-4">
              10. CONTACTO
            </h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Si tenés preguntas o inquietudes sobre esta política de privacidad, podés contactarnos en:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-2 mt-4">
                <p><strong>Polideportivo Ombú</strong></p>
                <p>Martín Salaberry 2831, Durazno, Uruguay</p>
                <p>Email: <a href="mailto:polideportivocentrounion@gmail.com" className="text-[#dbf228] hover:underline">polideportivocentrounion@gmail.com</a></p>
                <p>Teléfono: <a href="tel:+59895303311" className="text-[#dbf228] hover:underline">+598 95 303 311</a></p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
