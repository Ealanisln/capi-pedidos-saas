const units = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciseis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidos",
  "veintitres",
  "veinticuatro",
  "veinticinco",
  "veintiseis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];

const tens: Record<number, string> = {
  30: "treinta",
  40: "cuarenta",
  50: "cincuenta",
  60: "sesenta",
  70: "setenta",
  80: "ochenta",
  90: "noventa",
};

const hundreds: Record<number, string> = {
  100: "cien",
  200: "doscientos",
  300: "trescientos",
  400: "cuatrocientos",
  500: "quinientos",
  600: "seiscientos",
  700: "setecientos",
  800: "ochocientos",
  900: "novecientos",
};

function sectionToWords(value: number): string {
  if (value === 0) return "";
  if (value <= 29) return units[value];
  if (value < 100) {
    const ten = Math.floor(value / 10) * 10;
    const unit = value % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} y ${units[unit]}`;
  }
  if (value === 100) return hundreds[100];
  const hundred = Math.floor(value / 100) * 100;
  const rest = value % 100;
  return `${hundreds[hundred] ?? "ciento"}${rest ? ` ${sectionToWords(rest)}` : ""}`;
}

function integerToWords(value: number): string {
  if (value === 0) return "cero";
  if (value < 1000) return sectionToWords(value);
  if (value < 1000000) {
    const thousands = Math.floor(value / 1000);
    const rest = value % 1000;
    const prefix = thousands === 1 ? "mil" : `${integerToWords(thousands)} mil`;
    return `${prefix}${rest ? ` ${sectionToWords(rest)}` : ""}`;
  }
  const millions = Math.floor(value / 1000000);
  const rest = value % 1000000;
  const prefix = millions === 1 ? "un millon" : `${integerToWords(millions)} millones`;
  return `${prefix}${rest ? ` ${integerToWords(rest)}` : ""}`;
}

export function amountToWordsMx(value: number | string | { toString(): string } | null | undefined) {
  const amount = Math.max(0, Number(value ?? 0));
  const pesos = Math.floor(amount);
  const cents = Math.round((amount - pesos) * 100);
  const pesoLabel = pesos === 1 ? "peso" : "pesos";
  const words = integerToWords(pesos)
    .replace(/uno$/u, "un")
    .replace(/veintiuno$/u, "veintiun")
    .replace(/ y uno$/u, " y un");
  return `${words} ${pesoLabel} ${String(cents).padStart(2, "0")}/100 M.N.`;
}
