import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "light" | "dark";
  className?: string;
  onClick?: () => void;
};

const variants = {
  primary: "bg-gold text-deep-green hover:bg-white",
  light: "border border-white/35 text-white hover:border-white hover:bg-white hover:text-deep-green",
  dark: "bg-deep-green text-white hover:bg-forest",
};

const baseClassName =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm font-medium transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export function Button({ children, href, variant = "primary", className = "", ...props }: ButtonProps) {
  const classes = `${baseClassName} ${variants[variant]} ${className}`;

  if (href) {
    const external = href.startsWith("mailto:");
    return (
      <Link
        href={href}
        className={classes}
        onClick={props.onClick}
        {...(external ? { "aria-label": "Start a conversation by email" } : {})}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
