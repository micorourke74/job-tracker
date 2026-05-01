export const STORAGE_KEY = "job_tracker_applications_v3";
export const FOCUS_STORAGE_KEY = "job_tracker_current_focus_v1";
export const THEME_STORAGE_KEY = "job_tracker_theme_v1";
export const DEFAULT_CURRENT_FOCUS = "Help Desk · IT Support · Desktop Support";
export const CHROME_EXTENSION_URL = "https://github.com/micorourke74/job-tracker/tree/main/job-tracker-extension";
export const KOFI_URL = "https://ko-fi.com/micorourke";

export const STATUS_OPTIONS = [
  "Saved",
  "Applied",
  "In Review",
  "Screening",
  "Interview",
  "Assessment",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
];

export const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
export const WORK_TYPE_OPTIONS = ["On-site", "Hybrid", "Remote"];
export const EMPLOYMENT_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Unknown"];
export const CLOSED_STATUSES = ["Rejected", "Ghosted", "Withdrawn"];
export const ACTIVE_STATUSES = ["Applied", "In Review", "Screening", "Interview", "Assessment", "Offer"];

export const SOURCE_OPTIONS = [
  "LinkedIn",
  "Indeed",
  "Company Site",
  "Referral",
  "Recruiter",
  "Glassdoor",
  "ZipRecruiter",
  "Other",
];

export const EMPTY_JOB = {
  company: "",
  title: "",
  location: "",
  workType: "On-site",
  payRange: "",
  employmentType: "Full-time",
  hoursPerWeek: "40",
  dateApplied: new Date().toISOString().slice(0, 10),
  applicationPortal: "",
  jobListing: "",
  status: "Applied",
  priority: "Medium",
  summary: "",
  notes: "",
  contactName: "",
  contactInfo: "",
  followUpDate: "",
  interviewDate: "",
  resumeVersion: "",
  source: "LinkedIn",
  jobDescription: "",
  interviewerNames: "",
  interviewQuestions: "",
  starStories: "",
};
