"use client"

export default function Button({
    variant = "default",
    size = "auto",
    type = "button",
    onClick,
    children,
    icon,
    isOnlyIcon,
    className,
  }) {
    const baseClasses =
      "rounded-xl text-sm transition-all duration-200 ease-in-out flex items-center justify-center font-medium";
    const paddingClasses = isOnlyIcon
      ? "p-3"
      : icon
      ? "px-4 py-3"
      : "px-4 py-3";

    const variantClasses = {
      primary: "text-primary-1 bg-primary-3 hover:bg-yellow-400 shadow-md hover:shadow-lg",
      red: "text-white bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg",
      default: "text-foreground bg-background-light hover:bg-background-lighter border border-gray-600",
      dark: "text-foreground bg-background-lighter hover:bg-background border border-gray-600",
      white: "text-primary-1 bg-white hover:bg-gray-100 border border-gray-300",
      icon: "text-gray-400 hover:text-foreground bg-transparent hover:bg-background-light",
      facebook: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
    };

    const sizeClasses = {
      full: "w-full",
      auto: "",
    };

    return (
      <button
        type={type}
        className={`${baseClasses} ${paddingClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        onClick={onClick}
      >
        {icon && <span className={isOnlyIcon ? "" : "mr-2"}>{icon}</span>}
        {!isOnlyIcon && <span>{children}</span>}
      </button>
    );
  }