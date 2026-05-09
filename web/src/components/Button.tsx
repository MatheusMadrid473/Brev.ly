import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'icon';
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'default', 
  isLoading, 
  children, 
  className = "",
  ...props 
}: ButtonProps) {

  let variantClasses = "";
  if (variant === 'primary') variantClasses = "bg-blue-base text-grayscale-white hover:bg-blue-dark";
  if (variant === 'secondary') variantClasses = "bg-grayscale-200 text-grayscale-500 hover:bg-grayscale-300";
  if (variant === 'ghost') variantClasses = "bg-transparent text-grayscale-400 hover:bg-grayscale-200";

  const sizeClasses = size === 'default' ? "px-6 py-3.5 text-sm" : "p-2.5";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-bold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {children}
    </button>
  );
}