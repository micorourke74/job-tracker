import Info from "../Info.jsx";
import { daysSince, formatDate, formatDateTime } from "../../utils/dateUtils.js";
import { getEstimatedAnnualPay, formatMoney } from "../../utils/payUtils.js";
import { statusClass, priorityClass, normalizeUrl, getNextAction, getStaleInfo } from "../../utils/jobUtils.js";

export default function DetailModal({ job, onClose, onEdit }) {
  const age = daysSince(job.dateApplied);
  const nextAction = getNextAction(job);
  const staleInfo = getStaleInfo(job);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Application Snapshot</p>
            <h2>{job.company}</h2>
            <p className="detail-subtitle">{job.title}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <div className="detail-badges">
          <span className={statusClass(job.status)}>{job.status}</span>
          <span className={priorityClass(job.priority)}>{job.priority}</span>
          <span className="soft-badge">{job.workType}</span>
          <span className="soft-badge">{job.source}</span>
          {age !== null ? <span className="soft-badge">{age}d old</span> : null}
          {staleInfo ? <span className="stale-badge">{staleInfo.label}</span> : null}
        </div>

        <div className="detail-grid">
          <Info label="Location" value={job.location} />
          <Info label="Pay range" value={job.payRange} />
          <Info label="Estimated salary" value={formatMoney(getEstimatedAnnualPay(job))} />
          <Info label="Schedule" value={`${job.employmentType || "Unknown"}${job.hoursPerWeek ? ` · ${job.hoursPerWeek} hrs/wk` : ""}`} />
          <Info label="Date applied" value={formatDate(job.dateApplied)} />
          <Info label="Age" value={age !== null ? `${age} days since applied` : "—"} />
          <Info label="Last updated" value={formatDateTime(job.updatedAt || job.createdAt)} />
          <Info label="Next action" value={nextAction ? `${nextAction.label}: ${nextAction.text}` : staleInfo ? `${staleInfo.label}: ${staleInfo.text}` : "No action set"} />
          <Info label="Interview" value={formatDate(job.interviewDate)} />
          <Info label="Resume used" value={job.resumeVersion} />
          <Info label="Contact" value={job.contactName} />
          <Info label="Contact info" value={job.contactInfo} />
        </div>

        {job.jobDescription ? (
          <div className="detail-block">
            <h3>Job description</h3>
            <p>{job.jobDescription}</p>
          </div>
        ) : null}

        {job.summary ? (
          <div className="detail-block">
            <h3>Position summary</h3>
            <p>{job.summary}</p>
          </div>
        ) : null}

        {job.notes ? (
          <div className="detail-block">
            <h3>Notes</h3>
            <p>{job.notes}</p>
          </div>
        ) : null}

        {(job.interviewerNames || job.interviewQuestions || job.starStories) ? (
          <div className="detail-block interview-prep-block">
            <h3>Interview prep</h3>
            <div className="prep-grid">
              <Info label="Interviewers" value={job.interviewerNames} />
              <Info label="Questions to ask" value={job.interviewQuestions} />
              <Info label="STAR stories" value={job.starStories} />
            </div>
          </div>
        ) : null}

        <div className="detail-links">
          {job.jobListing ? <a href={job.jobListing} target="_blank" rel="noreferrer">Open job listing</a> : null}
          {job.applicationPortal ? <a href={job.applicationPortal} target="_blank" rel="noreferrer">Open application portal</a> : null}
          {job.contactInfo ? <a href={normalizeUrl(job.contactInfo)} target="_blank" rel="noreferrer">Open contact</a> : null}
        </div>

        <div className="modal-actions">
          <button className="button button-secondary" onClick={onClose}>Close</button>
          <button className="button button-primary" onClick={onEdit}>Edit</button>
        </div>
      </div>
    </div>
  );
}
