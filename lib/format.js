export const money = (n) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(n));
export const date = (d) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(
    new Date(
      typeof d === "string"
        ? d.replace(" ", "T") + (d.includes("Z") ? "" : "Z")
        : d,
    ),
  );
export const time = (d) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(
    new Date(
      typeof d === "string"
        ? d.replace(" ", "T") + (d.includes("Z") ? "" : "Z")
        : d,
    ),
  );
