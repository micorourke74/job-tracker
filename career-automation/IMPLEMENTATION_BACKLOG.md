# Implementation Backlog

## P0 — data integrity
- define private source-of-truth store
- resolve every conflicting candidate fact before autonomous submission
- create approved recurring-answer bank
- add version IDs to master resume/profile
- derive all documents from immutable versions

## P0 — resume/CV engine
- parse current master resume into structured private profile
- implement evidence-map generation
- implement patch-based tailoring
- implement immutable-field verifier
- implement unsupported-skill/metric detector
- render ATS-safe PDF/DOCX derivative
- preserve artifact lineage per application

## P0 — discovery
- official employer pages
- Disney careers/internal opportunities
- public ATS sources
- Remote-US + Orlando filters
- dedup by requisition/canonical URL/content hash
- freshness checks

## P1 — browser application operator
- deterministic field mapper
- local/private value injection
- confidence states
- Workday adapter
- Greenhouse adapter
- Lever adapter
- Ashby adapter
- generic form fallback
- no automatic CAPTCHA bypass
- explicit legal/signature stop gates

## P1 — tracking
- connect discovered job -> application ledger
- store score breakdown
- store resume derivative/version
- confirmation capture
- follow-up scheduling
- rejection/interview outcome tracking

## P1 — communications
- recruiter/contact discovery
- grounded outreach generation
- inbox response classification
- interview request escalation
- rejection/ghost tracking

## P2 — optimization
- conversion rate by role family
- conversion by resume base variant
- conversion by source
- threshold adjustment
- stale lane detection after 25–30 qualified applications without screens

## P2 — local companion
Evaluate JobNavigator, Resume Matcher, OpenJobAutofill, browser-use, and Nanobrowser components for a private local runtime. Prefer integration via clean interfaces over copying entire projects.
