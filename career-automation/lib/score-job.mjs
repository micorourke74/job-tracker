export const WEIGHTS = Object.freeze({
  mandatory: 30,
  skill_overlap: 20,
  level_fit: 15,
  geography: 10,
  opportunity_quality: 10,
  recency: 10,
  strategic_value: 5,
});

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function scoreJob(parts = {}) {
  const breakdown = {};
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const ratio = clamp01(parts[key]);
    const points = Math.round(ratio * weight * 100) / 100;
    breakdown[key] = { ratio, weight, points };
    total += points;
  }
  total = Math.round(total * 100) / 100;
  const hardRejects = Array.isArray(parts.hard_rejects) ? parts.hard_rejects.filter(Boolean) : [];
  let band = total >= 80 ? 'PRIORITY' : total >= 65 ? 'APPLY' : total >= 50 ? 'REVIEW' : 'ARCHIVE';
  if (hardRejects.length) band = 'REJECT';
  return { total, band, hard_rejects: hardRejects, breakdown };
}
