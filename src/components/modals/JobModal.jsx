import { useState } from "react";
import Field from "../Field.jsx";
import { normalizeUrl } from "../../utils/jobUtils.js";
import { extractJobBasics } from "../../utils/csvUtils.js";
import {
  EMPTY_JOB,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  WORK_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  SOURCE_OPTIONS,
} from "../../constants.js";

export default function JobModal({ initialJob, onClose, onSave }) {
  const [form, setForm] = useState(initialJob || EMPTY_JOB);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initialJob?.contactName || initialJob?.contactInfo || initialJob?.resumeVersion));
  const canSave = form.company.trim().length >= 2 && form.title.trim().length >= 2;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function extractFromDescription() {
    const extracted = extractJobBasics(form.jobDescription);
    setForm((current) => ({
      ...current,
      company: current.company || extracted.company,
      title: current.title || extracted.title,
      location: current.location || extracted.location,
      payRange: current.payRange || extracted.payRange,
      workType: extracted.workType || current.workType,
    }));
  }

  function saveJob(event) {
    event.preventDefault();
    if (!canSave) return;

    const now = new Date().toISOString();

    onSave({
      ...form,
      id: form.id || crypto.randomUUID(),
      company: form.company.trim(),
      title: form.title.trim(),
      location: form.location.trim(),
      payRange: form.payRange.trim(),
      applicationPortal: normalizeUrl(form.applicationPortal),
      jobListing: normalizeUrl(form.jobListing),
      summary: form.summary.trim(),
      notes: form.notes.trim(),
      contactName: form.contactName.trim(),
      contactInfo: form.contactInfo.trim(),
      resumeVersion: form.resumeVersion.trim(),
      jobDescription: form.jobDescription.trim(),
      interviewerNames: form.interviewerNames.trim(),
      interviewQuestions: form.interviewQuestions.trim(),
      starStories: form.starStories.trim(),
      createdAt: form.createdAt || now,
      updatedAt: now,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card streamlined-modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Application Details</p>
            <h2>{form.id ? "Edit application" : "Add application"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <form onSubmit={saveJob} className="job-form job-form-streamlined">
          <div className="form-section form-section-wide">
            <div className="section-heading">
              <span>Core info</span>
              <p>Company and job title are required and need at least 2 characters.</p>
            </div>
            <div className="section-grid core-grid">
              <Field label="Company">
                <input minLength="2" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Example: Kaseya" />
              </Field>
              <Field label="Job title">
                <input minLength="2" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Help Desk Analyst" />
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Orlando, FL" />
              </Field>
              <Field label="Work type">
                <select value={form.workType} onChange={(e) => update("workType", e.target.value)}>
                  {WORK_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="form-section">
            <div className="section-heading">
              <span>Pay</span>
              <p>Used for salary estimates and comparison.</p>
            </div>
            <div className="section-grid three-grid">
              <Field label="Pay range">
                <input value={form.payRange} onChange={(e) => update("payRange", e.target.value)} placeholder="$18-$24/hr or $42,000-$50,000" />
              </Field>
              <Field label="Employment type">
                <select value={form.employmentType || "Full-time"} onChange={(e) => update("employmentType", e.target.value)}>
                  {EMPLOYMENT_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Hours per week">
                <input type="number" min="1" max="80" value={form.hoursPerWeek || ""} onChange={(e) => update("hoursPerWeek", e.target.value)} placeholder="40" />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <div className="section-heading">
              <span>Tracking</span>
              <p>Status, priority, and next steps.</p>
            </div>
            <div className="section-grid tracking-grid">
              <Field label="Date applied">
                <input type="date" value={form.dateApplied} onChange={(e) => update("dateApplied", e.target.value)} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                  {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={(e) => update("priority", e.target.value)}>
                  {PRIORITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
                <small className="field-help">High = act now · Medium = normal · Low = back burner</small>
              </Field>
              <Field label="Follow-up date">
                <input type="date" value={form.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} />
              </Field>
              <Field label="Interview date">
                <input type="date" value={form.interviewDate} onChange={(e) => update("interviewDate", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <div className="section-heading">
              <span>Links</span>
              <p>Quick access to the listing and application portal.</p>
            </div>
            <div className="section-grid two-grid">
              <Field label="Application portal URL">
                <input value={form.applicationPortal} onChange={(e) => update("applicationPortal", e.target.value)} placeholder="Paste the login or application portal link" />
              </Field>
              <Field label="Job listing URL">
                <input value={form.jobListing} onChange={(e) => update("jobListing", e.target.value)} placeholder="Paste the job listing link" />
              </Field>
            </div>
          </div>

          <div className="form-section form-section-wide">
            <div className="section-heading">
              <span>Details</span>
              <p>Optional context that helps you remember why the role matters.</p>
            </div>
            <div className="section-grid details-grid">
              <Field label="Source">
                <select value={form.source} onChange={(e) => update("source", e.target.value)}>
                  {SOURCE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Position summary" wide>
                <textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} placeholder="What the role does, why it fits, key requirements..." />
              </Field>
              <Field label="Notes" wide>
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Follow-up details, interview prep, concerns..." />
              </Field>
              <Field label="Job description / listing text" wide>
                <textarea value={form.jobDescription} onChange={(e) => update("jobDescription", e.target.value)} placeholder="Paste the job description here. Then use Extract basics to fill company, title, pay, location, and work type when possible." />
                <button type="button" className="mini-action-button" onClick={extractFromDescription} disabled={!form.jobDescription.trim()}>Extract basics</button>
              </Field>
            </div>
          </div>

          <div className="advanced-toggle-row">
            <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced((current) => !current)}>
              {showAdvanced ? "Hide optional fields" : "Show optional contact and resume fields"}
            </button>
          </div>

          {showAdvanced ? (
            <div className="form-section form-section-wide advanced-section">
              <div className="section-heading">
                <span>Optional details</span>
                <p>Useful when you have recruiter info or use multiple resume versions.</p>
              </div>
              <div className="section-grid three-grid">
                <Field label="Contact name">
                  <input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Recruiter or hiring manager" />
                </Field>
                <Field label="Contact info">
                  <input value={form.contactInfo} onChange={(e) => update("contactInfo", e.target.value)} placeholder="Email or LinkedIn URL" />
                </Field>
                <Field label="Resume version">
                  <input value={form.resumeVersion} onChange={(e) => update("resumeVersion", e.target.value)} placeholder="Resume file name or version" />
                </Field>
                <Field label="Interviewer names" wide>
                  <input value={form.interviewerNames} onChange={(e) => update("interviewerNames", e.target.value)} placeholder="Names, roles, or panel details" />
                </Field>
                <Field label="Questions to ask" wide>
                  <textarea value={form.interviewQuestions} onChange={(e) => update("interviewQuestions", e.target.value)} placeholder="Questions you want to ask during the interview..." />
                </Field>
                <Field label="STAR stories" wide>
                  <textarea value={form.starStories} onChange={(e) => update("starStories", e.target.value)} placeholder="Situation, Task, Action, Result notes for stories you may use..." />
                </Field>
              </div>
            </div>
          ) : null}

          <div className="modal-actions streamlined-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={!canSave}>Save application</button>
          </div>
        </form>
      </div>
    </div>
  );
}
