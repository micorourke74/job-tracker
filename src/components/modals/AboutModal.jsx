export default function AboutModal({ onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="about-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">About This App</p>
            <h2>Job Tracker</h2>
            <p className="detail-subtitle">A simple tool for staying organized during a job search.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close about modal">×</button>
        </div>

        <div className="about-content">
          <p>
            Job Tracker helps you keep your applications in one place instead of losing track of listings,
            portals, pay ranges, recruiters, resume versions, follow-up dates, interviews, notes, and statuses.
          </p>

          <p>
            It is built for people applying to multiple jobs at once, especially when every application has
            different links, timelines, contacts, and next steps.
          </p>

          <div className="about-warning">
            <strong>Important</strong>
            <p>
              Your job list is saved privately in this browser. Use Export CSV to back up your applications
              before clearing browser data or switching devices.
            </p>
          </div>

          <div className="about-list">
            <div>
              <strong>Track applications</strong>
              <span>Save company names, job titles, locations, pay, status, and priority.</span>
            </div>
            <div>
              <strong>Stay ready for follow-ups</strong>
              <span>Set follow-up dates, interview dates, recruiter details, and interview notes.</span>
            </div>
            <div>
              <strong>Back up your data</strong>
              <span>Export your tracker as a CSV file and import it again later if needed.</span>
            </div>
            <div>
              <strong>Prefer an offline version?</strong>
              <span>
                View the GitHub repo to download, fork, or run the app locally:{" "}
                <a href="https://github.com/micorourke74/job-tracker" target="_blank" rel="noopener noreferrer">
                  github.com/micorourke74/job-tracker
                </a>
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="button button-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
