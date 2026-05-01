export function parsePayNumbers(payRange) {
  if (!payRange) return [];
  const text = String(payRange).replace(/,/g, "").toLowerCase();
  const matches = text.match(/[0-9]+(?:[.][0-9]+)?/g);
  return matches ? matches.map(Number) : [];
}

export function parsePayMidpoint(payRange) {
  const numbers = parsePayNumbers(payRange);
  if (!numbers.length) return null;
  return numbers.length === 1 ? numbers[0] : (numbers[0] + numbers[1]) / 2;
}

export function isHourlyPay(payRange) {
  const text = String(payRange || "").toLowerCase();
  const midpoint = parsePayMidpoint(payRange);
  return text.includes("hr") || text.includes("hour") || text.includes("hourly") || (midpoint !== null && midpoint > 0 && midpoint < 1000);
}

export function getHoursPerWeek(job) {
  const typedHours = Number(job.hoursPerWeek);
  if (Number.isFinite(typedHours) && typedHours > 0) return typedHours;
  if (job.employmentType === "Part-time") return 20;
  return 40;
}

export function getEstimatedAnnualPay(job) {
  const midpoint = parsePayMidpoint(job.payRange);
  if (midpoint === null) return null;

  const text = String(job.payRange || "").toLowerCase();

  if (isHourlyPay(job.payRange)) {
    return Math.round(midpoint * getHoursPerWeek(job) * 52);
  }

  if (text.includes("k") && midpoint < 1000) {
    return Math.round(midpoint * 1000);
  }

  return Math.round(midpoint);
}

export function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
