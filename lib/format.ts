export const currency = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);

export const number = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);

export const percent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;
