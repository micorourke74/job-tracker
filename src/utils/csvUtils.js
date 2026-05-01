import { normalizeUrl, hydrateJob } from "./jobUtils.js";
import { getEstimatedAnnualPay } from "./payUtils.js";
import { daysSince } from "./dateUtils.js";

export function extractFieldAfterLabel(text, labels) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    for (const label of labels) {
      const pattern = new RegExp(`^${label}\\s*[:|-]\\s*(.+)$`, "i");
      const match = line.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
  }
  return "";
}

export function inferWorkType(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("remote")) return "Remote";
  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("on-site") || lower.includes("onsite") || lower.includes("in office")) return "On-site";
  return "";
}

export function inferPayRange(text) {
  const value = String(text || "");
  const hourly = value.match(/\$\s*\d+(?:\.\d+)?\s*(?:-|to|–)\s*\$?\s*\d+(?:\.\d+)?\s*(?:\/\s*hr|per hour|hourly|hr)/i);
  if (hourly) return hourly[0].replace(/\s+/g, " ").replace(/per hour/i, "/hr");
  const singleHourly = value.match(/\$\s*\d+(?:\.\d+)?\s*(?:\/\s*hr|per hour|hourly|hr)/i);
  if (singleHourly) return singleHourly[0].replace(/\s+/g, " ").replace(/per hour/i, "/hr");
  const salary = value.match(/\$\s*\d{2,3},?\d{3}\s*(?:-|to|–)\s*\$?\s*\d{2,3},?\d{3}/i);
  if (salary) return salary[0].replace(/\s+/g, " ");
  const kSalary = value.match(/\$?\s*\d{2,3}\s*k\s*(?:-|to|–)\s*\$?\s*\d{2,3}\s*k/i);
  if (kSalary) return kSalary[0].replace(/\s+/g, " ").toUpperCase();
  return "";
}

export function extractJobBasics(text) {
  const title = extractFieldAfterLabel(text, ["job title", "title", "role", "position"]);
  const company = extractFieldAfterLabel(text, ["company", "employer", "organization"]);
  const location = extractFieldAfterLabel(text, ["location", "job location"]);
  const payRange = extractFieldAfterLabel(text, ["pay", "pay range", "salary", "compensation"]) || inferPayRange(text);
  const workType = inferWorkType(text);
  return { title, company, location, payRange, workType };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => String(value).trim())) rows.push(row);
  return rows;
}

export function csvHeaderKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function mapImportedJob(headers, row) {
  const values = headers.reduce((acc, header, index) => {
    acc[csvHeaderKey(header)] = row[index] || "";
    return acc;
  }, {});

  const get = (...names) => {
    for (const name of names) {
      const value = values[csvHeaderKey(name)];
      if (String(value || "").trim()) return String(value).trim();
    }
    return "";
  };

  const now = new Date().toISOString();
  const company = get("Company");
  const title = get("Job Title", "Title");
  if (company.length < 2 || title.length < 2) return null;

  return hydrateJob({
    id: crypto.randomUUID(),
    company,
    title,
    location: get("Location"),
    workType: get("Work Type") || "On-site",
    payRange: get("Pay Range"),
    employmentType: get("Employment Type") || "Full-time",
    hoursPerWeek: get("Hours Per Week") || "40",
    dateApplied: get("Date Applied") || new Date().toISOString().slice(0, 10),
    applicationPortal: normalizeUrl(get("Application Portal")),
    jobListing: normalizeUrl(get("Job Listing", "Job " + "Post" + "ing")),
    status: get("Status") || "Applied",
    priority: get("Priority") || "Medium",
    summary: get("Summary"),
    notes: get("Notes"),
    contactName: get("Contact Name"),
    contactInfo: get("Contact Info"),
    followUpDate: get("Follow-up Date", "Follow Up Date"),
    interviewDate: get("Interview Date"),
    resumeVersion: get("Resume Version"),
    source: get("Source") || "Other",
    jobDescription: get("Job Description", "Description", "Listing Description"),
    interviewerNames: get("Interviewer Names", "Interviewers"),
    interviewQuestions: get("Interview Questions", "Questions to Ask"),
    starStories: get("STAR Stories", "STAR Notes", "Story Notes"),
    createdAt: get("Created At") || now,
    updatedAt: now,
  });
}

export function exportCsv(jobs) {
  const headers = [
    "Company",
    "Job Title",
    "Location",
    "Work Type",
    "Pay Range",
    "Employment Type",
    "Hours Per Week",
    "Estimated Annual Salary",
    "Date Applied",
    "Days Since Applied",
    "Application Portal",
    "Job Listing",
    "Status",
    "Priority",
    "Summary",
    "Notes",
    "Contact Name",
    "Contact Info",
    "Follow-up Date",
    "Interview Date",
    "Resume Version",
    "Source",
    "Job Description",
    "Interviewer Names",
    "Interview Questions",
    "STAR Stories",
    "Created At",
    "Updated At",
  ];

  const rows = jobs.map((job) => [
    job.company,
    job.title,
    job.location,
    job.workType,
    job.payRange,
    job.employmentType || "Unknown",
    job.hoursPerWeek || "",
    getEstimatedAnnualPay(job) ?? "",
    job.dateApplied,
    daysSince(job.dateApplied) ?? "",
    job.applicationPortal,
    job.jobListing,
    job.status,
    job.priority,
    job.summary,
    job.notes,
    job.contactName,
    job.contactInfo,
    job.followUpDate,
    job.interviewDate,
    job.resumeVersion,
    job.source,
    job.jobDescription,
    job.interviewerNames,
    job.interviewQuestions,
    job.starStories,
    job.createdAt || "",
    job.updatedAt || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `job-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
