// Componente Link de React Router para navegación interna sin recargar la página
import { Link } from "react-router-dom";

/**
 * TButton
 *
 * Componente reutilizable de botón/enlace.
 * Se ha diseñado para unificar el estilo de botones en la aplicación y
 * permitir distintos comportamientos (botón normal, enlace interno o enlace externo)
 * usando una sola abstracción.
 *
 * Props principales:
 * - color: define el esquema de color del botón (indigo, red, green)
 * - to: ruta interna (React Router)
 * - href: enlace externo
 * - link: indica si el botón debe comportarse como un enlace textual
 * - circle: muestra el botón en formato circular
 * - onClick: función que se ejecuta al pulsar el botón
 * - className: clases adicionales opcionales
 * - children: contenido del botón (texto o iconos)
 */
export default function TButton({
  color = "indigo",
  to = "",
  circle = false,
  href = "",
  link = false,
  target = "_blank",
  onClick = () => {},
  className = "",
  children,
}) {
  // Clases base comunes a todos los botones
  let classes = [
    "flex",
    "whitespace-nowrap",
    "text-sm",
    "border",
    "border-2",
    "border-transparent",
    "transition-colors",
  ];

  /**
   * Estilos cuando el botón se comporta como un enlace
   * (sin fondo, solo texto coloreado)
   */
  if (link) {
    switch (color) {
      case "indigo":
        classes.push("text-indigo-500", "focus:border-indigo-500");
        break;
      case "red":
        classes.push("text-red-500", "focus:border-red-500");
        break;
      case "green":
        classes.push("text-emerald-500", "focus:border-emerald-500");
        break;
    }
  } else {
    /**
     * Estilos cuando el botón es un botón clásico con fondo
     * Se añade soporte para focus y hover
     */
    classes.push("text-white", "focus:ring-2", "focus:ring-offset-2");

    switch (color) {
      case "indigo":
        classes.push(
          "bg-indigo-600",
          "hover:bg-indigo-700",
          "focus:ring-indigo-500"
        );
        break;
      case "red":
        classes.push(
          "bg-red-600",
          "hover:bg-red-700",
          "focus:ring-red-500"
        );
        break;
      case "green":
        classes.push(
          "bg-emerald-500",
          "hover:bg-emerald-600",
          "focus:ring-emerald-400"
        );
        break;
    }
  }

  /**
   * Forma del botón:
   * - circular: usado normalmente para iconos
   * - rectangular: botón estándar con padding
   */
  if (circle) {
    classes.push("h-8", "w-8", "items-center", "justify-center", "rounded-full");
  } else {
    classes.push("px-4", "py-2", "rounded-md");
  }

  // Clases adicionales opcionales pasadas por props
  if (className) classes.push(className);

  // Conversión final del array de clases a string
  const finalClasses = classes.join(" ");

  /**
   * Renderizado condicional según el tipo de acción:
   * - href → enlace externo (<a>)
   * - to → navegación interna con React Router (<Link>)
   * - ninguno → botón normal (<button>)
   */
  if (href) {
    return (
      <a href={href} className={finalClasses} target={target}>
        {children}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} className={finalClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={finalClasses}>
      {children}
    </button>
  );
}
