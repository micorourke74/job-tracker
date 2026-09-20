const ALLOWED_OPS = new Set(['KEEP','REMOVE','REORDER','REPHRASE','SPLIT','MERGE','ADD_FROM_VERIFIED_EVIDENCE']);
const PROTECTED_PATH_PATTERNS = [
  /(^|\.)employer$/,
  /(^|\.)title$/,
  /(^|\.)start_date$/,
  /(^|\.)end_date$/,
  /(^|\.)institution$/,
  /(^|\.)degree$/,
  /(^|\.)conferral_date$/,
  /(^|\.)name$/,
  /(^|\.)issuer$/,
  /(^|\.)issued$/,
  /(^|\.)expires$/,
  /(^|\.)email$/,
  /(^|\.)phone$/,
];

export function collectEvidenceIds(sourceTruth) {
  const ids = new Set();
  const walk = (value) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.id === 'string' && value.id) ids.add(value.id);
    if (Array.isArray(value.evidence_ids)) for (const id of value.evidence_ids) if (id) ids.add(id);
    for (const child of Object.values(value)) walk(child);
  };
  walk(sourceTruth);
  return ids;
}

function isProtectedPath(path) {
  return PROTECTED_PATH_PATTERNS.some(re => re.test(String(path || '')));
}

export function validateResumePatch(sourceTruth, patchOps) {
  const evidence = collectEvidenceIds(sourceTruth);
  const errors = [];
  const warnings = [];
  if (!Array.isArray(patchOps)) return { ok:false, errors:['patch must be an array'], warnings };

  patchOps.forEach((op, i) => {
    const p = `patch[${i}]`;
    if (!op || typeof op !== 'object') { errors.push(`${p}: operation must be an object`); return; }
    if (!ALLOWED_OPS.has(op.operation)) errors.push(`${p}: unsupported operation ${op.operation}`);
    if (!op.target_path) errors.push(`${p}: target_path is required`);
    const ids = Array.isArray(op.evidence_ids) ? op.evidence_ids.filter(Boolean) : [];
    if (op.operation !== 'KEEP' && ids.length === 0) errors.push(`${p}: substantive edit has no evidence_ids`);
    for (const id of ids) if (!evidence.has(id)) errors.push(`${p}: unknown evidence id ${id}`);
    if (isProtectedPath(op.target_path) && op.operation !== 'KEEP') {
      errors.push(`${p}: attempted modification of protected fact path ${op.target_path}`);
    }
    if (typeof op.confidence === 'number' && (op.confidence < 0 || op.confidence > 1)) {
      errors.push(`${p}: confidence must be 0..1`);
    }
    if (op.operation === 'REPHRASE' && String(op.old_text || '').trim() === String(op.new_text || '').trim()) {
      warnings.push(`${p}: REPHRASE does not change text`);
    }
  });
  return { ok: errors.length === 0, errors, warnings };
}
