const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-MX");

type NumericValue = number | string | { toString(): string } | null | undefined;

export function formatMoney(value: NumericValue) {
  return `${currencyFormatter.format(Number(value ?? 0))} MXN`;
}

export function formatNumber(value: NumericValue) {
  return numberFormatter.format(Number(value ?? 0));
}
