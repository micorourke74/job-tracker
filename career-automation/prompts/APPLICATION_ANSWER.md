# Application Answer Contract

Answer one application question using only approved candidate data.

Inputs:
- QUESTION
- SOURCE_OF_TRUTH
- APPROVED_QA_BANK
- JOB_EVIDENCE

Classify first:
- FACTUAL_PROFILE
- ROLE_SPECIFIC_FREE_TEXT
- LEGAL_ATTESTATION
- DEMOGRAPHIC
- COMPENSATION
- UNKNOWN

Rules:
- Never infer sensitive or legal answers.
- Never fabricate experience.
- Never claim a technology unless evidence exists.
- Never claim a numerical result unless verified.
- Keep free-text answers concise and directly responsive.
- If a standing answer exists, use it exactly unless the question materially differs.
- If required information is absent or conflicting, return USER_REQUIRED.

Output:
- classification
- proposed_answer
- evidence_ids
- confidence
- action: AUTOFILL | REVIEW | USER_REQUIRED | DO_NOT_ANSWER
- reason
