export const fmtMoney = (n: number | string | null | undefined, currency = "$") => {
  const num = Number(n ?? 0);
  return `${currency}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
export const fmtNumber = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-US");
export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};
export const fmtDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};
