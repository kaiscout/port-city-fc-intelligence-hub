export const currency = (value: number | null | undefined, compact = false) =>
  value == null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
        notation: compact ? "compact" : "standard",
      }).format(value);

export const number = (value: number | null | undefined, compact = false) =>
  value == null
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
        notation: compact ? "compact" : "standard",
      }).format(value);

export const percent = (value: number | null | undefined, digits = 1) =>
  value == null ? "Unavailable" : `${value.toFixed(digits)}%`;
