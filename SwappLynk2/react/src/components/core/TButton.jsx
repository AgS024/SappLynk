import { Link } from "react-router-dom";

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
  let classes = [
    "flex",
    "whitespace-nowrap",
    "text-sm",
    "border",
    "border-2",
    "border-transparent",
    "transition-colors",
  ];

  // Estilos según si es link o botón normal
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

  // Tamaño: círculo o normal
  if (circle) {
    classes.push(
      "h-8",
      "w-8",
      "items-center",
      "justify-center",
      "rounded-full"
    );
  } else {
    // corregido: sin px duplicados
    classes.push("px-4", "py-2", "rounded-md");
  }

  // Estilos extra desde fuera
  if (className) {
    classes.push(className);
  }

  const finalClasses = classes.join(" ");

  // Renderizado según props (solo 1 tipo de elemento)
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
