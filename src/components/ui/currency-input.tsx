import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({ value, onChange, placeholder = "0.00", className }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value ? String(value) : "");
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(displayValue.replace(/,/g, "")) || 0;
    onChange(parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, dots, and empty
    if (/^[0-9]*\.?[0-9]*$/.test(raw) || raw === "") {
      setDisplayValue(raw);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}
