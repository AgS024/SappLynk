/**
 * PageComponent
 *
 * Componente “contenedor” para reutilizar el mismo layout en distintas páginas.
 * La idea es evitar repetir siempre la misma estructura:
 * - cabecera con título (y opcionalmente botones a la derecha)
 * - contenido principal centrado con un ancho máximo
 *
 * Props:
 * - title: texto que se muestra como título principal de la página
 * - buttons: zona opcional para botones/acciones (por defecto vacío)
 * - children: contenido real de la página (lo que se quiera renderizar dentro)
 */
export default function PageComponent({ title, buttons = "", children }) {
  return (
    <>
      {/* Cabecera superior: título + acciones (si se pasan) */}
      <header className="relative bg-white border-b-2 border-red-600 after:pointer-events-none after:absolute after:inset-x-0 after:inset-y-0 after:border-y after:border-red-200">
        {/* Contenedor centrado con ancho máximo para que no ocupe toda la pantalla */}
        <div className="flex justify-between items-center mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Título principal de la página */}
          <h1 className="text-3xl font-bold tracking-tight text-black">{title}</h1>

          {/* Zona de botones/acciones: por ejemplo "Añadir", "Filtrar", etc. */}
          {buttons}
        </div>
      </header>

      {/* Contenido principal */}
      <main>
        {/* Mismo contenedor centrado para alinear el contenido con la cabecera */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
