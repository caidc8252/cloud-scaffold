import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-400",
  secondary: "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
  ghost: "text-zinc-700 hover:bg-zinc-100",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
