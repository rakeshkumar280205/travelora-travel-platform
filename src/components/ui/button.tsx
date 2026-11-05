import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "light" | "dark";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-label"?: string;
  onClick?: () => void;
};

const variants = {
  primary: "bg-gold text-deep-green hover:bg-white focus-visible:outline-forest",
  light: "border border-white/35 text-white hover:border-white hover:bg-white hover:text-deep-green focus-visible:outline-gold",
  dark: "bg-deep-green text-white hover:bg-forest focus-visible:outline-gold",
};

const baseClassName =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-medium transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  "aria-label": ariaLabel,
  onClick,
}: ButtonProps) {
  const classes = `${baseClassName} ${variants[variant]} ${className}`;

  if (href) {
    const external = href.startsWith("mailto:");
    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel ?? (external ? "Start a conversation by email" : undefined)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
