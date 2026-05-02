import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  fullWidth = false,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label className="text-sm text-foreground font-medium">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          px-4 py-3
          bg-input-background
          border border-border
          rounded-[var(--radius-lg)]
          text-foreground
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring
          transition-all duration-200
          ${error ? "border-warm-coral" : ""}
          ${className}
        `}
      />
      {error && (
        <span className="text-sm text-warm-coral">
          {error}
        </span>
      )}
    </div>
  );
}
