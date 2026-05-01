export const SAMPLE_JOBS = [
  {
    id: crypto.randomUUID(),
    company: "Northstar Customer Care (SAMPLE)",
    title: "Customer Support Specialist",
    location: "Remote, United States",
    workType: "Remote",
    payRange: "$22-$26/hr",
    employmentType: "Full-time",
    hoursPerWeek: "40",
    dateApplied: new Date().toISOString().slice(0, 10),
    applicationPortal: "https://example.com/northstar-careers/login",
    jobListing: "https://example.com/northstar-customer-support-specialist",
    status: "Screening",
    priority: "High",
    summary:
      "Remote support role focused on answering customer questions, documenting issues, using ticketing tools, escalating technical problems, and maintaining a positive customer experience.",
    notes:
      "Strong fit because the role values communication, patience, documentation, and comfort learning new software. Prepare examples about de-escalating frustrated customers and organizing follow-up tasks.",
    contactName: "Jamie Rivera",
    contactInfo: "jamie.rivera@example.com",
    followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    interviewDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    resumeVersion: "Customer_Support_Resume_v2.pdf",
    source: "LinkedIn",
    jobDescription:
      "Customer Support Specialist role serving remote customers through chat, email, phone, and ticketing tools. Responsibilities include documenting cases, troubleshooting basic account issues, escalating technical problems, and maintaining accurate follow-up notes.",
    interviewerNames: "Jamie Rivera, Support Team Lead",
    interviewQuestions:
      "What ticketing system does the team use?\nHow is success measured for the first 90 days?\nWhat does escalation from Tier 1 support usually look like?",
    starStories:
      "Customer de-escalation story: explain the situation, the angry customer issue, the steps taken to stay calm and document the problem, and the final resolution.\nOrganization story: describe managing several open tasks while keeping follow-ups clear.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    company: "BrightPath Operations Group (SAMPLE)",
    title: "Administrative Coordinator",
    location: "Orlando, FL",
    workType: "Hybrid",
    payRange: "$48,000-$56,000",
    employmentType: "Full-time",
    hoursPerWeek: "40",
    dateApplied: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    applicationPortal: "https://example.com/brightpath-applicant-portal",
    jobListing: "https://example.com/brightpath-administrative-coordinator",
    status: "Applied",
    priority: "Medium",
    summary:
      "Hybrid coordinator role supporting scheduling, email communication, records management, vendor follow-up, internal reporting, and day-to-day office workflow.",
    notes:
      "Use this sample to show salary tracking, application links, recruiter contact details, follow-up reminders, source tracking, and resume version history. Follow up if there is no reply after a few business days.",
    contactName: "Morgan Lee",
    contactInfo: "https://www.linkedin.com/in/sample-recruiter-profile",
    followUpDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    interviewDate: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    resumeVersion: "Administrative_Coordinator_Resume_v1.pdf",
    source: "Company Site",
    jobDescription:
      "Administrative Coordinator role supporting scheduling, inbox triage, vendor follow-up, recordkeeping, reporting, and team coordination in a hybrid office environment.",
    interviewerNames: "Morgan Lee, Operations Manager",
    interviewQuestions:
      "What are the busiest parts of the weekly workflow?\nWhich tools does the team use for scheduling and records?\nWhat would make someone successful in this role quickly?",
    starStories:
      "Scheduling story: describe coordinating moving pieces, communicating clearly, and preventing missed deadlines.\nDetail-oriented story: explain catching an error before it caused a bigger issue.",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function createSampleJobs() {
  return SAMPLE_JOBS.map((job) => ({ ...job, id: crypto.randomUUID() }));
}
