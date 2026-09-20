# Per-Job Resume / CV Pipeline

Every serious application gets its own evaluated document package.

## Inputs

- immutable candidate source of truth
- canonical master resume
- verified job posting
- fit/evidence map
- document policy

## Step 1 — Parse the job

Extract separately:
- mandatory qualifications
- preferred qualifications
- responsibilities
- products/platforms
- technical keywords
- business-domain language
- soft-skill evidence
- measurable outcome language

Do not treat repeated keywords as proof that a skill should appear on the resume.

## Step 2 — Build evidence map

For each important requirement, identify the exact candidate evidence.

Example:

```
Requirement: Microsoft 365 support
Status: VERIFIED_MATCH
Evidence: skills.microsoft365 + employment.<id>.bullets[...]
Allowed wording: Microsoft 365, Outlook, Teams, OneDrive
```

If evidence is absent, mark GAP. Never manufacture a bridge.

## Step 3 — Choose document strategy

A. SUPPORT: help desk / service desk / technical support  
B. SAAS: product support / customer technical support  
C. QA: software QA / testing  
D. AI_OPS: AI support / evaluation / automation operations  
E. INTERNAL: Disney/internal mobility  
F. GENERAL_IT: application/IT analyst

Start from the closest approved base variant, then tailor.

## Step 4 — Generate a patch, not a replacement

Allowed operations:
- KEEP
- REMOVE
- REORDER
- REPHRASE
- SPLIT
- MERGE
- ADD_FROM_VERIFIED_EVIDENCE

Each change should include:
- target path
- old text
- proposed text
- evidence IDs
- reason

No evidence IDs = reject the change.

## Step 5 — Truthfulness verifier

Hard failure if:
- employer/date/degree/certification changed
- unsupported skill added
- number or percentage invented
- job title materially inflated
- responsibility converted into a false accomplishment
- preferred qualification presented as actual experience without evidence

## Step 6 — ATS verifier

Check:
- text extracts in sensible reading order
- standard section names
- no tables/text boxes for core content
- no icons replacing essential contact information
- no hidden/white text
- conventional fonts and spacing
- URL text readable
- one or two pages based on content, never padded
- PDF contains selectable text
- important job terminology appears naturally where supported

ATS optimization means clarity and semantic alignment, not keyword stuffing.

## Step 7 — Human-language verifier

Remove:
- generic AI filler
- inflated adjectives
- repetitive sentence openings
- suspiciously copied job-description phrasing
- claims that sound senior beyond the evidence
- unnecessary jargon

## Step 8 — Render derivative

Naming:
`Michael_ORourke_<Company>_<Role>_<YYYY-MM-DD>.<ext>`

Master remains unchanged.

## Step 9 — Package

For each priority job produce:
- tailored resume/CV
- cover letter only when useful/required
- 2–4 sentence application note when useful
- recruiter outreach when a legitimate contact is found
- interview evidence map for later use

## Quality target

A tailored resume should look like the same real person emphasizing the most relevant parts of his actual experience, not like a different candidate generated for each posting.
