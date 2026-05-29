export const fmtMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n || 0);

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString() : "—";

export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString() : "—";

export const relTime = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s).getTime();
  const diff = Math.round((d - Date.now()) / 1000);
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(diff, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
};
