# Runbook

## Each automated search cycle

1. Search for newly posted roles in the target lanes.
2. Remove duplicates against the application ledger.
3. Verify the role is active when possible.
4. Extract mandatory and preferred requirements.
5. Score the role using OPERATING_RULES.md.
6. Discard weak or disqualifying jobs.
7. For strong matches, produce:
   - canonical posting URL
   - company
   - title
   - location
   - work arrangement
   - compensation if stated
   - posting date if stated
   - fit score
   - mandatory requirements
   - truthful candidate-match evidence
   - gaps / risks
   - recommended resume variant
   - next action
8. For application-ready roles, tailor materials.
9. Complete application steps only when supported by an authorized browser workflow.
10. Pause at mandatory stop points.
11. Record the outcome.
12. Reassess conversion metrics weekly.

## Resume discipline

The master resume is immutable.
Every job-specific resume is a derivative.

Naming:
`Michael_ORourke_<Company>_<Role>_<YYYY-MM-DD>.pdf`

Do not overwrite the canonical master.

## Duplicate key

Primary:
`company + requisition_id`

Fallback:
`normalized_company + normalized_title + location`

## High-priority escalation

A job should be surfaced immediately when:
- score >= 85; or
- Disney internal / Disney tech-adjacent and score >= 70; or
- posted within 24 hours and score >= 80; or
- recruiter directly contacts the candidate.

## Weekly review

Measure:
- qualified applications
- screens
- screen rate
- interviews
- interview rate
- offers
- rejection rate
- ghost rate
- performance by role family
- performance by resume variant

Update targeting rules based on evidence, not application volume.
