# Source Audit — September 2026

This file records external open-source projects reviewed as design references for Career Automation.

No dependency or source code should be copied into this repository solely because it appears below. Check license, security posture, maintenance state, and platform Terms of Service before adopting anything.

## 1. vesaias/JobNavigator

Repository: https://github.com/vesaias/JobNavigator  
License: MIT  
Role: broad architecture reference

Useful patterns:
- direct-career-page discovery plus ATS-specific handlers
- Workday, Greenhouse, Lever, Ashby, Oracle HCM, Phenom, TalentBrew, Rippling, SmartRecruiters and generic browser fallback
- URL normalization and deduplication
- candidate persona / question bank
- per-resume job scoring
- resume and cover-letter generation
- application stage tracking
- scheduled discovery and health checks
- local/self-hosted deployment

Important caution from its own legal disclaimer:
- comply with each platform's Terms of Service
- some scraping features can violate platform terms
- do not spam employers or mass-submit
- AI-generated qualifications can hallucinate
- human verification is expected before submission

Decision:
Use the architecture as a reference. Do not copy questionable scraping behavior or auto-submit behavior. Prefer official employer pages, public ATS endpoints, normal browser navigation, and human/agent review gates.

## 2. srbhr/Resume-Matcher

Repository: https://github.com/srbhr/Resume-Matcher  
License: Apache-2.0  
Role: primary resume/CV transformation reference

Useful patterns:
- canonical master resume
- job-description keyword extraction
- diff-based edits rather than unconstrained full rewrites
- explicit allow/block paths for edits
- post-edit verification
- preservation of personal information and dates
- master-resume alignment validation
- AI-phrase cleanup
- prompt-injection sanitization
- cover-letter and outreach generation grounded in resume + job description
- preview/confirm workflow
- local model support

Decision:
Adopt these concepts strongly. Our per-job CV/resume pipeline must work from immutable source facts, generate a patch, verify it, and only then render a derivative.

## 3. Br1an67/OpenJobAutofill

Repository: https://github.com/Br1an67/OpenJobAutofill  
License: MIT  
Role: privacy and form-fill reference

Useful patterns:
- candidate profile stored locally
- field-semantic detection separated from actual private values
- AI may classify field names without receiving PII
- determined fields are filled; uncertain fields become pending
- visual distinction between filled and unresolved fields
- no automatic final-submit click
- human review emphasized for dates, declarations, IDs, and choices

Decision:
Adopt the privacy boundary and confidence/pending model. Our browser agent may reason about field semantics without unnecessarily exposing private values to external models.

## 4. browser-use/browser-use

Repository: https://github.com/browser-use/browser-use  
License: MIT  
Role: browser-agent reference

Useful patterns:
- local browser automation
- allowlisted/prohibited domains
- structured tools
- persistent browser sessions
- local or cloud execution
- explicit sensitive-data handling concepts

Decision:
Useful for local orchestration experiments. Do not adopt CAPTCHA evasion, stealth, proxy rotation, or anti-bot circumvention as part of this project. When a site blocks automation, stop or switch to an authorized/manual path.

## 5. nanobrowser/nanobrowser

Repository: https://github.com/nanobrowser/nanobrowser  
License: Apache-2.0  
Role: browser-agent architecture reference

Useful patterns:
- local Chrome/Edge execution
- planner + navigator separation
- multiple model providers
- local Ollama support
- visible interactive execution

Decision:
Useful as a reference for planner/navigator separation, especially if a local companion is later built.

## 6. xitanggg/open-resume

Repository: https://github.com/xitanggg/open-resume  
License: AGPL-3.0  
Role: ATS/PDF design reference

Useful patterns:
- local-first resume data
- ATS-readable PDF design
- parser-based readability checking
- fixed formatting to reduce layout errors

License caution:
AGPL is strong copyleft. Do not copy its implementation into this repository without deliberately accepting and satisfying AGPL obligations.

Decision:
Use as a behavior/design reference only unless licensing is revisited.

## 7. speedyapply/JobSpy

Repository: https://github.com/speedyapply/JobSpy  
License: MIT  
Role: optional discovery fallback

Useful patterns:
- normalized retrieval across multiple public job boards
- structured job records
- location/remote filtering
- salary extraction

Current cautions:
- scraping reliability varies by provider
- recent issues report Indeed hangs and incomplete LinkedIn data
- direct employer URLs may be missing for some results
- no repository security policy was detected during the September 2026 audit
- job-board scraping can trigger blocking or conflict with platform terms

Decision:
Do not make JobSpy the system of record. If used, restrict it to discovery hints, pin a tested commit, apply strict timeouts/rate limits, and verify every promising result against the employer's official career page before application.

## What we intentionally reject

Do not import or emulate projects whose primary behavior is:
- mass LinkedIn Easy Apply spam
- CAPTCHA bypass
- account/session theft
- credential harvesting
- anti-bot evasion
- fake identity/account generation
- fabricated resume augmentation
- indiscriminate high-volume submissions

High-volume auto-applier repositories can still be studied for UI/adapter ideas, but their submission strategy is not an acceptable architecture for this project.

The objective is a durable, truthful job-acquisition system, not application-count vanity metrics.
