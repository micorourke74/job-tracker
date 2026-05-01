import { EMPTY_JOB, CLOSED_STATUSES } from "../constants.js";
import { daysUntil, daysSince } from "./dateUtils.js";

export function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.includes("@") && !trimmed.includes("/")) return `mailto:${trimmed}`;
  return `https://${trimmed}`;
}

export function openUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return;
  window.open(normalized, "_blank", "noopener,noreferrer");
}

export function statusClass(status) {
  return `badge badge-${status.toLowerCase().replaceAll(" ", "-")}`;
}

export function priorityClass(priority) {
  return `priority priority-${priority.toLowerCase()}`;
}

export function getPercent(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function averageNumber(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

export function hydrateJob(job) {
  const legacyJobListing = job.jobListing || job["job" + "Post" + "ing"] || "";

  return {
    ...EMPTY_JOB,
    ...job,
    id: job.id || crypto.randomUUID(),
    jobListing: legacyJobListing,
    employmentType: job.employmentType || "Full-time",
    hoursPerWeek: job.hoursPerWeek || "40",
    status: job.status || "Applied",
    priority: job.priority || "Medium",
    source: job.source || "Other",
  };
}

export function isUsableJob(job) {
  return String(job.company || "").trim().length >= 2 && String(job.title || "").trim().length >= 2;
}

export function isSampleJob(job) {
  return String(job.company || "").toLowerCase().includes("(sample)");
}

export function getCompleteness(job) {
  const fields = [job.company, job.title, job.location, job.payRange, job.dateApplied, job.status, job.priority, job.source, job.jobListing || job.applicationPortal];
  const filled = fields.filter((value) => String(value || "").trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export function getStaleInfo(job) {
  if (!job || CLOSED_STATUSES.includes(job.status) || job.status === "Offer" || job.followUpDate || job.interviewDate) return null;
  if (!["Applied", "In Review", "Screening", "Assessment", "Interview"].includes(job.status)) return null;
  const age = daysSince(job.dateApplied);
  if (age === null || age < 7) return null;
  return {
    label: "Follow-up suggested",
    text: `${age}d with no follow-up set`,
    age,
  };
}

export function getNextAction(job) {
  const interviewDays = daysUntil(job.interviewDate);
  const followDays = daysUntil(job.followUpDate);

  if (interviewDays !== null) {
    return {
      label: "Interview",
      days: interviewDays,
      date: job.interviewDate,
      text: interviewDays < 0 ? `${Math.abs(interviewDays)}d ago` : interviewDays === 0 ? "Today" : `In ${interviewDays}d`,
      tone: interviewDays < 0 ? "danger" : interviewDays === 0 ? "warning" : "",
    };
  }

  if (followDays !== null) {
    return {
      label: "Follow-up",
      days: followDays,
      date: job.followUpDate,
      text: followDays < 0 ? `${Math.abs(followDays)}d overdue` : followDays === 0 ? "Today" : `In ${followDays}d`,
      tone: followDays < 0 ? "danger" : followDays === 0 ? "warning" : "",
    };
  }

  return null;
}

export function getReminderText(job) {
  if (CLOSED_STATUSES.includes(job.status)) return "Closed";
  if (job.interviewDate || job.followUpDate) return "Scheduled";
  if (["Applied", "In Review", "Screening", "Assessment", "Interview"].includes(job.status)) return "Needs follow-up";
  return "No action set";
}
