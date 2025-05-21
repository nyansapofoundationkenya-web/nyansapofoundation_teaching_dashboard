import React from "react";

export default function Button({
  children,
  className = "",
  variant = "default",
  ...props
}) {
  const base =
    "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline:
      "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 focus:ring-gray-300",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
