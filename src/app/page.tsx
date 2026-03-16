import Link from "next/link";

// Imágenes locales - Nosotros Section
const imgNosotrosCancha = "/Diurno.webp"; // Vista diurna de las canchas
const imgNosotrosVista = "/Nocturno.webp"; // Vista nocturna

// Imágenes locales - Torneos Section
const imgTorneos = "/Ranking.webp"; // Imagen para sección de torneos

// Imágenes locales - Canchas Section
const imgPadel1 = "/Ombu.webp"; // Vista general del Ombú
const imgPadelAbierta = "/De arriba.webp"; // Vista aérea
const imgFutbol7 = "/F7.webp"; // Cancha de fútbol 7
const imgFutbol5 = "/F5.webp"; // Cancha de fútbol 5

// Imágenes locales - Clases Section
const imgClases = "/Paleta.webp"; // Imagen de paleta/clases

// Imágenes locales - Sponsors Section (usando imágenes existentes como placeholders)
const imgSponsorBanderas = "/image-4.webp";
const imgSponsorCamiseta = "/Atardecer.webp";
const imgSponsorMarca = "/Ombu.webp";
const imgSponsorRedes = "/Ranking.webp";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Nosotros Section */}
      <section className="bg-[#ededed] px-4 sm:px-8 md:px-20 lg:px-40 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="max-w-[1367px] mx-auto flex flex-col lg:flex-row gap-6 md:gap-10">
          {/* Imagen izquierda */}
          <div className="w-full lg:w-[639px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[712px] rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={imgNosotrosCancha}
              alt="Canchas del polideportivo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Contenido derecho */}
          <div className="w-full lg:w-[688px] flex flex-col gap-6 md:gap-10">
            {/* Imagen superior */}
            <div className="h-[200px] sm:h-[220px] md:h-[264px] rounded-lg overflow-hidden">
              <img
                src={imgNosotrosVista}
                alt="Vista nocturna"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Texto y botón */}
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="flex flex-col gap-4 md:gap-5">
                <h1 className="font-heading text-[28px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[1.1] uppercase text-[#1b1b1b]">
                  Tu club, tu lugar y tu segunda casa.
                </h1>
                <p className="font-body text-[16px] sm:text-[18px] md:text-[20px] leading-[1.4] text-[#1b1b1b]">
                  El punto de encuentro del deporte en Durazno. Un lugar dónde el fútbol y el pádel
                  se viven con amigos, buena energía y ganas de pasarla bien. Entre torneos y eventos
                  todos los meses el Ombú abre sus puertas para toda su gente, con tres canchas de pádel,
                  dos canchas de fútbol 7 y una cancha de fútbol 5.
                </p>
              </div>
              <Link
                href="https://maps.google.com/?q=Martín+Salaberry+2831,+Durazno"
                target="_blank"
                className="bg-[#1b1b1b] text-[#ededed] px-8 sm:px-12 md:px-20 py-3 md:py-4 rounded-lg font-heading text-[16px] sm:text-[18px] md:text-[20px] inline-block w-fit hover:bg-[#333] transition-colors"
              >
                Cómo llegar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Torneos Section */}
      <section className="relative px-4 sm:px-8 md:px-20 lg:px-40 py-16 sm:py-20 md:py-28 lg:py-32 min-h-[500px] sm:min-h-[600px] md:min-h-[800px] lg:min-h-[1056px] flex items-center">
        {/* Background Image with Gradient */}
        <div className="absolute inset-0">
          <img
            src={imgTorneos}
            alt="Torneos"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(269.76deg, rgba(27, 27, 27, 0) 0.11%, rgb(27, 27, 27) 81.95%)"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative max-w-full md:max-w-[707px] flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col text-[#ededed]">
            <h2 className="font-heading text-[28px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[1.1] uppercase mb-4">
              nuestros torneos para que disfrutes
            </h2>
            <p className="font-body text-[16px] sm:text-[18px] md:text-[20px] leading-[1.4]">
              En nuestra casa hacemos un torneo por mes (o quién dice que dos...) y nos encanta que seas parte y disfrutes nuestra casa como se debe.
            </p>
          </div>
          <Link
            href="/torneos"
            className="bg-white text-[#1b1b1b] px-8 sm:px-12 md:px-20 py-3 md:py-4 rounded-lg font-heading text-[16px] sm:text-[18px] md:text-[20px] inline-block w-fit hover:bg-gray-200 transition-colors"
          >
            Ver calendario
          </Link>
        </div>
      </section>

      {/* Sports Ticker */}
      <section className="bg-black text-white py-4 sm:py-6 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array(10).fill(['PÁDEL', 'FÚTBOL 7', 'FÚTBOL 5']).flat().map((sport, i) => (
            <span key={i} className="mx-4 sm:mx-6 md:mx-8 text-xl sm:text-2xl md:text-3xl font-heading">
              {sport}
            </span>
          ))}
        </div>
      </section>

      {/* Canchas Section */}
      <section className="bg-[#ededed] px-4 sm:px-8 md:px-20 lg:px-40 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="max-w-[1372px] mx-auto">
          {/* Título */}
          <h2 className="font-heading text-[28px] sm:text-[32px] md:text-[40px] text-center uppercase text-[#1b1b1b] mb-8 md:mb-12">
            NUESTRAS CANCHAS
          </h2>

          {/* Cards */}
          <div className="flex flex-col gap-6 md:gap-8 lg:gap-11">
            {/* Pádel Cerradas */}
            <div className="bg-[#dbf228] rounded-[20px] sm:rounded-[28px] md:rounded-[39px] flex flex-col md:flex-row items-stretch md:items-center md:h-[438px] relative overflow-hidden">
              {/* Mobile: Imagen arriba */}
              <div className="md:hidden w-full h-[180px] relative">
                <img
                  src={imgPadel1}
                  alt="Canchas de Pádel"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Desktop: Imagen derecha */}
              <div className="hidden md:block absolute right-0 top-0 w-[675px] h-full">
                <img
                  src={imgPadel1}
                  alt="Canchas de Pádel"
                  className="w-full h-full object-cover rounded-l-[39px]"
                />
              </div>

              {/* Contenido */}
              <div className="relative z-10 w-full md:w-[403px] flex flex-col gap-4 md:gap-6 p-6 sm:p-8 md:p-12">
                <div className="flex flex-col gap-3 md:gap-4">
                  <div>
                    <h3 className="font-heading text-[24px] sm:text-[28px] md:text-[32px] leading-[1] uppercase text-[#1b1b1b]">
                      CANCHAS PÁDEL
                    </h3>
                    <p className="font-body text-[18px] sm:text-[20px] md:text-[24px] italic text-[#1b1b1b]">cerradas</p>
                  </div>
                  <ul className="font-body text-[14px] sm:text-[16px] md:text-[18px] text-[#1b1b1b] list-disc ml-6 md:ml-8 space-y-1 md:space-y-1.5">
                    <li>Calidad Europea</li>
                    <li>Panorámicas</li>
                    <li>Cerradas</li>
                    <li>Iluminación y medidas establecidas por la federación</li>
                  </ul>
                </div>
                <Link
                  href="/reservas"
                  className="bg-[#1b1b1b] text-[#ededed] px-8 sm:px-12 md:px-16 py-2.5 md:py-3 rounded-lg font-heading text-[16px] md:text-[18px] inline-block w-fit hover:bg-[#333] transition-colors"
                >
                  Reservar
                </Link>
              </div>
            </div>

            {/* Pádel Abierta */}
            <div className="bg-[#dbf228] rounded-[20px] sm:rounded-[28px] md:rounded-[39px] flex flex-col md:flex-row items-stretch md:items-center md:h-[438px] relative overflow-hidden">
              {/* Mobile: Imagen arriba */}
              <div className="md:hidden w-full h-[180px] relative">
                <img
                  src={imgPadelAbierta}
                  alt="Cancha de Pádel Abierta"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Desktop: Imagen derecha */}
              <div className="hidden md:block absolute right-0 top-0 w-[675px] h-full">
                <img
                  src={imgPadelAbierta}
                  alt="Cancha de Pádel Abierta"
                  className="w-full h-full object-cover rounded-l-[39px]"
                />
              </div>

              {/* Contenido */}
              <div className="relative z-10 w-full md:w-[403px] flex flex-col gap-4 md:gap-6 p-6 sm:p-8 md:p-12">
                <div className="flex flex-col gap-3 md:gap-4">
                  <div>
                    <h3 className="font-heading text-[24px] sm:text-[28px] md:text-[32px] leading-none uppercase text-[#1b1b1b]">
                      CANCHA PÁDEL
                    </h3>
                    <p className="font-body text-[18px] sm:text-[20px] md:text-[24px] italic text-[#1b1b1b]">ABIERTA</p>
                  </div>
                  <ul className="font-body text-[14px] sm:text-[16px] md:text-[18px] text-[#1b1b1b] list-disc ml-6 md:ml-8 space-y-1 md:space-y-1.5">
                    <li>Calidad Europea</li>
                    <li>Panorámica</li>
                    <li>Abierta</li>
                    <li>Iluminación y medidas establecidas por la federación</li>
                  </ul>
                </div>
                <Link
                  href="/reservas"
                  className="bg-[#1b1b1b] text-[#ededed] px-8 sm:px-12 md:px-16 py-2.5 md:py-3 rounded-lg font-heading text-[16px] md:text-[18px] inline-block w-fit hover:bg-[#333] transition-colors"
                >
                  Reservar
                </Link>
              </div>
            </div>

            {/* Fútbol 7 */}
            <div className="bg-[#dbf228] rounded-[20px] sm:rounded-[28px] md:rounded-[39px] flex flex-col md:flex-row items-stretch md:items-center md:h-[438px] relative overflow-hidden">
              {/* Mobile: Imagen arriba */}
              <div className="md:hidden w-full h-[180px] relative">
                <img
                  src={imgFutbol7}
                  alt="Canchas de Fútbol 7"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Desktop: Imagen derecha */}
              <div className="hidden md:block absolute right-0 top-0 w-[675px] h-full">
                <img
                  src={imgFutbol7}
                  alt="Canchas de Fútbol 7"
                  className="w-full h-full object-cover rounded-l-[39px]"
                />
              </div>

              {/* Contenido */}
              <div className="relative z-10 w-full md:w-[403px] flex flex-col gap-4 md:gap-6 p-6 sm:p-8 md:p-12 md:py-24">
                <div className="flex flex-col gap-4 md:gap-6">
                  <h3 className="font-heading text-[28px] sm:text-[32px] md:text-[40px] leading-none uppercase text-[#1b1b1b]">
                    CANCHAS fútbol 7
                  </h3>
                  <ul className="font-body text-[16px] sm:text-[18px] md:text-[20px] text-[#1b1b1b] list-disc ml-6 md:ml-8 space-y-1">
                    <li>Sintética</li>
                    <li>Única en la región</li>
                    <li>Pasto, luces y medidas aprobadas por la FIFA</li>
                  </ul>
                </div>
                <Link
                  href="/reservas"
                  className="bg-[#1b1b1b] text-[#ededed] px-8 sm:px-12 md:px-20 py-3 md:py-4 rounded-lg font-heading text-[16px] sm:text-[18px] md:text-[20px] inline-block w-fit hover:bg-[#333] transition-colors"
                >
                  Reservar
                </Link>
              </div>
            </div>

            {/* Fútbol 5 */}
            <div className="bg-[#dbf228] rounded-[20px] sm:rounded-[28px] md:rounded-[39px] flex flex-col md:flex-row items-stretch md:items-center md:h-[438px] relative overflow-hidden">
              {/* Mobile: Imagen arriba */}
              <div className="md:hidden w-full h-[180px] relative">
                <img
                  src={imgFutbol5}
                  alt="Cancha de Fútbol 5"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Desktop: Imagen derecha */}
              <div className="hidden md:block absolute right-0 top-0 w-[675px] h-full">
                <img
                  src={imgFutbol5}
                  alt="Cancha de Fútbol 5"
                  className="w-full h-full object-cover rounded-l-[39px]"
                />
              </div>

              {/* Contenido */}
              <div className="relative z-10 w-full md:w-[403px] flex flex-col gap-4 md:gap-6 p-6 sm:p-8 md:p-12 md:py-24">
                <div className="flex flex-col gap-4 md:gap-6">
                  <h3 className="font-heading text-[28px] sm:text-[32px] md:text-[40px] leading-none uppercase text-[#1b1b1b]">
                    CANCHA fútbol 5
                  </h3>
                  <ul className="font-body text-[16px] sm:text-[18px] md:text-[20px] text-[#1b1b1b] list-disc ml-6 md:ml-8 space-y-1">
                    <li>Tamaño 20x40</li>
                    <li>Cancha Sintética</li>
                    <li>Iluminación profesional</li>
                  </ul>
                </div>
                <Link
                  href="/reservas"
                  className="bg-[#1b1b1b] text-[#ededed] px-8 sm:px-12 md:px-20 py-3 md:py-4 rounded-lg font-heading text-[16px] sm:text-[18px] md:text-[20px] inline-block w-fit hover:bg-[#333] transition-colors"
                >
                  Reservar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clases Section */}
      <section className="relative px-4 sm:px-8 md:px-20 lg:px-40 py-16 sm:py-20 md:py-28 lg:py-32 min-h-[500px] sm:min-h-[600px] md:min-h-[800px] lg:min-h-[1056px] flex items-center">
        {/* Background Image with Gradient */}
        <div className="absolute inset-0">
          <img
            src={imgClases}
            alt="Clases de pádel"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(269.76deg, rgba(0, 61, 137, 0) 0.11%, rgb(0, 61, 137) 81.95%)"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative max-w-full md:max-w-[558px] flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col text-[#ededed]">
            <h2 className="font-heading text-[28px] sm:text-[32px] md:text-[40px] lg:text-[48px] leading-[1.1] uppercase mb-4">
              aprendé pádel con los mejores
            </h2>
            <p className="font-body text-[16px] sm:text-[18px] md:text-[20px] leading-[1.5]">
              Nunca es tarde para empezar a jugar a un deporte.
              En nuestro polideportivo tenemos a los mejores profesores para que aprender de gusto! solicitá mas info y nos contactaremos contigo.
            </p>
          </div>
          <Link
            href="/contacto"
            className="bg-white text-[#1b1b1b] px-8 sm:px-12 md:px-20 py-3 md:py-4 rounded-lg font-heading text-[16px] sm:text-[18px] md:text-[20px] inline-block w-fit hover:bg-gray-200 transition-colors"
          >
            Contacto
          </Link>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="bg-[#1b1b1b] px-4 sm:px-8 md:px-20 lg:px-40 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="max-w-[1370px] mx-auto flex flex-col gap-8 md:gap-12 lg:gap-16 items-center">
          <h2 className="font-heading text-[24px] sm:text-[28px] md:text-[32px] lg:text-[40px] text-white uppercase w-full">
            ¿Queres ser sponsor de el Ombú?
          </h2>

          {/* Grid de Cards */}
          <div className="flex flex-col gap-4 md:gap-6 w-full">
            {/* Primera fila - en mobile: stack vertical */}
            <div className="flex flex-col md:flex-row gap-4 md:h-[291px]">
              {/* Banderas en torneos - Grande */}
              <div className="relative w-full md:w-[67%] h-[200px] md:h-full rounded-[20px] sm:rounded-[28px] md:rounded-[43px] overflow-hidden flex items-center justify-center px-8 sm:px-16 md:px-32 lg:px-44 py-12 md:py-24">
                <div className="absolute inset-0 bg-[#1b1b1b]">
                  <img
                    src={imgSponsorBanderas}
                    alt="Banderas en torneos"
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                <p className="relative font-heading text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] text-[#ededed] text-center md:whitespace-nowrap">
                  Banderas en torneos
                </p>
              </div>

              {/* Logo en camiseta - Pequeño */}
              <div className="relative w-full md:w-[33%] h-[200px] md:h-full rounded-[20px] sm:rounded-[28px] md:rounded-[43px] overflow-hidden flex items-center justify-center px-6 sm:px-8 md:px-6 py-12 md:py-24">
                <div className="absolute inset-0 bg-[#1b1b1b]">
                  <img
                    src={imgSponsorCamiseta}
                    alt="Logo en camiseta"
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
                <p className="relative font-heading text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] text-[#ededed] text-center md:whitespace-nowrap">
                  Logo en camiseta
                </p>
              </div>
            </div>

            {/* Segunda fila - en mobile: stack vertical */}
            <div className="flex flex-col md:flex-row gap-4 md:h-[291px]">
              {/* Repercusión de la marca - Pequeño */}
              <div className="relative w-full md:w-[33%] h-[200px] md:h-full rounded-[20px] sm:rounded-[28px] md:rounded-[43px] overflow-hidden flex items-center justify-center px-6 sm:px-8 md:px-6 py-12 md:py-24">
                <div className="absolute inset-0 bg-[#1b1b1b]">
                  <img
                    src={imgSponsorMarca}
                    alt="Repercusión de la marca"
                    className="w-full h-full object-cover opacity-30"
                  />
                </div>
                <p className="relative font-heading text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] text-[#ededed] text-center">
                  Repercusión de<br />la marca
                </p>
              </div>

              {/* Aumento en redes sociales - Grande */}
              <div className="relative w-full md:w-[67%] h-[200px] md:h-full rounded-[20px] sm:rounded-[28px] md:rounded-[43px] overflow-hidden flex items-center justify-center px-8 sm:px-16 md:px-32 lg:px-44 py-12 md:py-24">
                <div className="absolute inset-0 bg-[#1b1b1b]">
                  <img
                    src={imgSponsorRedes}
                    alt="Aumento en redes sociales"
                    className="w-full h-full object-cover opacity-30"
                  />
                </div>
                <p className="relative font-heading text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] text-[#ededed] text-center md:whitespace-nowrap">
                  Aumento en redes sociales
                </p>
              </div>
            </div>
          </div>

          {/* Botón */}
          <Link
            href="/contacto"
            className="bg-white text-[#1b1b1b] px-8 sm:px-12 md:px-20 py-3 md:py-4 rounded-lg font-heading text-[16px] sm:text-[18px] md:text-[20px] inline-block hover:bg-gray-200 transition-colors"
          >
            Solicitar más información
          </Link>
        </div>
      </section>
    </div>
  );
}
