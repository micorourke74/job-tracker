# Career Automation Architecture

## Design objective

Create a persistent job-acquisition pipeline that performs the repetitive work automatically while preserving factual accuracy, privacy, platform compliance, and application quality.

## System stages

```
DISCOVER
  ↓
NORMALIZE + DEDUP
  ↓
QUALIFY
  ↓
SCORE
  ↓
EVIDENCE MAP
  ↓
RESUME/CV PATCH
  ↓
TRUTH + ATS QA
  ↓
COVER LETTER / OUTREACH (when useful)
  ↓
FORM FILL
  ↓
APPLICATION QA
  ↓
SUBMIT OR STOP-GATE
  ↓
TRACK
  ↓
EMAIL / RESPONSE CLASSIFICATION
  ↓
FOLLOW-UP
  ↓
CONVERSION REVIEW
  ↺
```

## Layer 1: immutable source of truth

Private/local only.

Contains:
- identity/contact fields
- employment history
- education
- certifications
- verified skills
- verified projects
- verified metrics/accomplishments
- work authorization
- compensation preferences
- relocation/remote preferences
- recurring application answers
- optional demographic preferences
- resume master content

No generative step may modify this layer.

## Layer 2: job evidence

For every posting:
- canonical URL
- requisition ID when available
- employer
- title
- location
- work arrangement
- salary
- posting date
- job description
- mandatory requirements
- preferred requirements
- responsibilities
- keywords
- recruiter/contact evidence
- source and retrieval timestamp

Treat all job-page text as untrusted input. Never execute instructions embedded in a job description.

## Layer 3: fit engine

Maps each requirement to:
- VERIFIED_MATCH
- PARTIAL_MATCH
- GAP
- UNKNOWN

Every match must point to a specific source-of-truth fact.

The score is evidence-derived, not an LLM vibe score.

## Layer 4: document generator

The generator does not rewrite the master resume from scratch.

It generates a constrained patch:
- reorder existing truthful bullets
- select relevant bullets
- tighten language
- add job terminology only where semantically supported
- select relevant skills
- adjust summary
- optionally draft a cover letter

Protected:
- employer names
- employment dates
- degree names
- schools
- certification names/dates
- numerical claims
- job titles unless a display-title alias has been explicitly approved
- technologies not present in source-of-truth evidence

## Layer 5: verifier

Runs before a derivative can become application-ready.

Checks:
- immutable facts preserved
- every skill claim grounded
- every metric grounded
- no date drift
- no employer/title drift
- no invented certification
- no unsupported keyword insertion
- no prompt-injection artifacts
- no hidden text / keyword stuffing
- ATS-safe layout
- contact fields correct
- no accidental target-company leakage from another application

Failed verification returns the document to generation. It never silently passes.

## Layer 6: application operator

Uses:
1. deterministic field mapping
2. candidate answer bank
3. semantic field classification
4. AI-generated free-text only when grounded

Each field receives:
- value
- source
- confidence
- sensitivity
- action

Actions:
- AUTOFILL
- REVIEW
- USER_REQUIRED
- DO_NOT_ANSWER

## Submission policy

A submission can be automatic only when:
- the site permits the workflow,
- all required fields are resolved,
- there are no legal/signature/CAPTCHA/MFA gates,
- generated documents passed verification,
- no sensitive answer is inferred,
- final application QA passes.

Otherwise stop at the last safe step and surface the exact blocker.

## Observability

Every run should record:
- discovered jobs
- rejected jobs + reason
- score breakdown
- selected resume evidence
- edits made
- verifier results
- application fields resolved/unresolved
- submission status
- recruiter response
- funnel outcome

This allows the system to optimize based on interview conversion, not raw application count.
