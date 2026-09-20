import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeJobUrl, dedupeKey } from '../lib/normalize-job-url.mjs';
import { scoreJob } from '../lib/score-job.mjs';
import { validateResumePatch } from '../lib/validate-resume-patch.mjs';

test('normalizes tracking parameters and trailing slash', () => {
  assert.equal(
    normalizeJobUrl('https://EXAMPLE.com/jobs/123/?utm_source=x&foo=bar#apply'),
    'https://example.com/jobs/123?foo=bar'
  );
});

test('requisition id wins for dedupe', () => {
  assert.equal(dedupeKey({employer:'Acme', requisition_id:'R-123', url:'https://x'}), 'req:acme:r-123');
});

test('job score applies thresholds', () => {
  const s = scoreJob({mandatory:1,skill_overlap:.9,level_fit:1,geography:1,opportunity_quality:.8,recency:1,strategic_value:.8});
  assert.equal(s.band, 'PRIORITY');
  assert.ok(s.total >= 80);
});

test('hard reject overrides high score', () => {
  const s = scoreJob({mandatory:1,skill_overlap:1,level_fit:1,geography:1,opportunity_quality:1,recency:1,strategic_value:1,hard_rejects:['active clearance required']});
  assert.equal(s.band, 'REJECT');
});

test('patch rejects unsupported evidence', () => {
  const source = {employment:[{id:'employment_001',bullets:[{id:'bullet_1',text:'Supported users'}]}]};
  const r = validateResumePatch(source,[{target_path:'summary',operation:'REPHRASE',old_text:'x',new_text:'y',evidence_ids:['fake'],confidence:.8}]);
  assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/unknown evidence id fake/);
});

test('patch blocks protected factual changes', () => {
  const source = {employment:[{id:'employment_001',employer:'Acme'}]};
  const r = validateResumePatch(source,[{target_path:'employment.0.employer',operation:'REPHRASE',old_text:'Acme',new_text:'Better Acme',evidence_ids:['employment_001'],confidence:1}]);
  assert.equal(r.ok,false);
  assert.match(r.errors.join('\n'),/protected fact path/);
});

test('grounded bullet rephrase passes', () => {
  const source = {employment:[{id:'employment_001',bullets:[{id:'bullet_1',text:'Supported users'}]}]};
  const r = validateResumePatch(source,[{target_path:'employment.0.bullets.0.text',operation:'REPHRASE',old_text:'Supported users',new_text:'Provided end-user support',evidence_ids:['bullet_1'],confidence:.95}]);
  assert.equal(r.ok,true);
});
