# Application QA Gate

No application is submission-ready until every blocking check passes.

## Identity

- name matches source of truth
- email matches source of truth
- phone matches source of truth
- location matches source of truth
- LinkedIn/GitHub/portfolio URLs are correct

## Role

- correct employer
- correct job title
- correct requisition
- canonical application URL
- location/work arrangement understood
- no obvious closed/duplicate posting

## Documents

- correct company/role derivative attached
- no document from another employer
- master resume not overwritten
- resume truth verifier PASS
- ATS verifier PASS
- cover letter grounded and company-specific if used

## Screening questions

Every answer must be one of:
- FACT_FROM_SOURCE
- APPROVED_STANDING_ANSWER
- GROUNDED_GENERATED_RESPONSE
- USER_REQUIRED

Never infer:
- work authorization
- sponsorship
- veteran status
- disability status
- criminal history
- demographic identity
- clearance
- willingness to relocate
- salary expectation
- legal certification

unless an explicit standing answer exists.

## Free text

Generated responses must:
- answer the actual question
- use only verified experience
- remain concise
- not claim enthusiasm for facts we have not researched
- not fabricate product use, customers, metrics, or tenure

## Final submission blockers

Always stop for:
- CAPTCHA
- MFA
- e-signature
- legal attestation that requires the applicant
- unresolved required field
- conflicting source-of-truth fact
- unsupported generated claim
- site prohibition / anti-automation warning
- uncertainty about what the final button legally certifies

## Post-submit

Capture:
- confirmation text
- confirmation/reference number
- timestamp
- final posting URL
- documents used
- application answers/version
- next follow-up date

Never mark APPLIED merely because a form was filled.
