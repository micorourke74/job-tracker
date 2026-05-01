import { useEffect, useMemo, useRef, useState } from "react";

import {
  STORAGE_KEY,
  FOCUS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  DEFAULT_CURRENT_FOCUS,
  CHROME_EXTENSION_URL,
  KOFI_URL,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  WORK_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  CLOSED_STATUSES,
  ACTIVE_STATUSES,
  SOURCE_OPTIONS,
  EMPTY_JOB,
} from "./constants.js";

import { createSampleJobs } from "./data/sampleJobs.js";

import { formatDate, formatDateTime, daysUntil, daysSince } from "./utils/dateUtils.js";
import { getEstimatedAnnualPay, formatMoney } from "./utils/payUtils.js";
import {
  hydrateJob,
  isSampleJob,
  normalizeUrl,
  openUrl,
  statusClass,
  priorityClass,
  getPercent,
  averageNumber,
  getCompleteness,
  getStaleInfo,
  getNextAction,
  getReminderText,
} from "./utils/jobUtils.js";
import { loadJobs, loadCurrentFocus, loadTheme } from "./utils/storageUtils.js";
import { exportCsv, parseCsv, mapImportedJob, extractJobBasics } from "./utils/csvUtils.js";

import StatCard from "./components/StatCard.jsx";
import Field from "./components/Field.jsx";
import Info from "./components/Info.jsx";
import AboutModal from "./components/modals/AboutModal.jsx";
import DetailModal from "./components/modals/DetailModal.jsx";
import JobModal from "./components/modals/JobModal.jsx";


export default function App() {
  const [jobs, setJobs] = useState(loadJobs);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [workTypeFilter, setWorkTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [modalJob, setModalJob] = useState(null);
  const [viewJob, setViewJob] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [toast, setToast] = useState("");
  const [currentFocus, setCurrentFocus] = useState(loadCurrentFocus);
  const [focusDraft, setFocusDraft] = useState(currentFocus);
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const importInputRef = useRef(null);
  const importedFromUrlRef = useRef(false);

  // ── URL import hook (Chrome extension handoff) ───────────────────────────
  useEffect(() => {
    if (importedFromUrlRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("importJob");
    if (!encoded) return;

    // Clean URL immediately so a refresh never re-imports.
    window.history.replaceState({}, "", window.location.pathname);
    importedFromUrlRef.current = true;

    try {
      // Unicode-safe base64 decode (mirrors the extension's encodePayload).
      const json = decodeURIComponent(escape(atob(encoded)));
      const raw = JSON.parse(json);

      if (!raw || typeof raw !== "object") throw new Error("Invalid payload");

      // Trim fields that could be huge.
      const trim = (v, max) => String(v || "").slice(0, max);

      const newJob = hydrateJob({
        id: crypto.randomUUID(),
        company: trim(raw.company, 120) || "Unknown Company",
        title: trim(raw.title, 120) || "Untitled Job Listing",
        location: trim(raw.location, 120),
        workType: raw.workType || "On-site",
        payRange: trim(raw.payRange, 80),
        employmentType: raw.employmentType || "Full-time",
        hoursPerWeek: raw.hoursPerWeek || "40",
        dateApplied: raw.dateApplied || new Date().toISOString().slice(0, 10),
        applicationPortal: "",
        jobListing: trim(raw.jobListing, 500),
        status: raw.status || "Saved",
        priority: raw.priority || "Medium",
        summary: trim(raw.summary, 500),
        notes: "",
        contactName: "",
        contactInfo: "",
        followUpDate: "",
        interviewDate: "",
        resumeVersion: "",
        source: raw.source || "Other",
        jobDescription: trim(raw.jobDescription, 3000),
        interviewerNames: "",
        interviewQuestions: "",
        starStories: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setJobs((current) => [newJob, ...current]);
      setActiveTab("Applications");
      setToast("Job imported from extension ✓");
    } catch {
      setToast("Job import failed — could not decode the link");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ── End URL import hook ──────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem(FOCUS_STORAGE_KEY, currentFocus);
    } catch {
      // Keep the app usable even if localStorage is unavailable.
    }
  }, [currentFocus]);


  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the app usable even if localStorage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timeout);
  }, [toast]);

  const dashboard = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const thisWeek = jobs.filter((job) => {
      if (!job.dateApplied) return false;
      return new Date(`${job.dateApplied}T00:00:00`) >= sevenDaysAgo;
    }).length;

    const inProgress = jobs.filter((job) => ["In Review", "Screening", "Interview", "Assessment"].includes(job.status)).length;
    const active = jobs.filter((job) => ACTIVE_STATUSES.includes(job.status)).length;
    const offers = jobs.filter((job) => job.status === "Offer").length;
    const rejected = jobs.filter((job) => job.status === "Rejected").length;
    const ghosted = jobs.filter((job) => job.status === "Ghosted").length;
    const saved = jobs.filter((job) => job.status === "Saved").length;
    const applied = jobs.filter((job) => job.status === "Applied").length;
    const payValues = jobs.map((job) => getEstimatedAnnualPay(job)).filter((value) => value !== null);
    const averagePay = payValues.length ? payValues.reduce((sum, value) => sum + value, 0) / payValues.length : null;
    const realJobs = jobs.filter((job) => !isSampleJob(job));
    const submittedJobs = jobs.filter((job) => job.status !== "Saved");
    const interviewed = jobs.filter((job) => job.interviewDate || ["Interview", "Offer"].includes(job.status)).length;
    const staleCount = jobs.filter((job) => getStaleInfo(job)).length;
    const activeAges = jobs
      .filter((job) => ACTIVE_STATUSES.includes(job.status))
      .map((job) => daysSince(job.dateApplied))
      .filter((value) => value !== null);
    const averageActiveAge = averageNumber(activeAges);

    return {
      total: jobs.length,
      thisWeek,
      active,
      inProgress,
      offers,
      rejected,
      ghosted,
      saved,
      applied,
      averagePay,
      payCount: payValues.length,
      realCount: realJobs.length,
      sampleCount: jobs.length - realJobs.length,
      submittedCount: submittedJobs.length,
      interviewed,
      staleCount,
      averageActiveAge,
    };
  }, [jobs]);

  const dashboardInsight = useMemo(() => {
    if (dashboard.total === 0) return "Add your first application to start building momentum.";
    if (dashboard.sampleCount === dashboard.total) return "Sample jobs are loaded so you can explore the tracker. Add your first real application when ready.";

    const activeJobs = jobs.filter((job) => !CLOSED_STATUSES.includes(job.status) && job.status !== "Offer");
    const overdueFollowUps = activeJobs.filter((job) => daysUntil(job.followUpDate) !== null && daysUntil(job.followUpDate) < 0);
    const interviewsToday = activeJobs.filter((job) => daysUntil(job.interviewDate) === 0);
    const upcomingInterviews = activeJobs.filter((job) => {
      const days = daysUntil(job.interviewDate);
      return days !== null && days > 0 && days <= 3;
    });
    const followUpsToday = activeJobs.filter((job) => daysUntil(job.followUpDate) === 0);
    const staleActiveJobs = activeJobs.filter((job) => {
      const age = daysSince(job.dateApplied);
      return age !== null && age >= 7 && !job.followUpDate && ["Applied", "In Review", "Screening", "Assessment", "Interview"].includes(job.status);
    });

    if (interviewsToday.length) return `${interviewsToday.length} interview${interviewsToday.length === 1 ? "" : "s"} today. Open the notes and prep before the call.`;
    if (overdueFollowUps.length) return `${overdueFollowUps.length} follow-up${overdueFollowUps.length === 1 ? " is" : "s are"} overdue. Clear those first so nothing slips.`;
    if (upcomingInterviews.length) return `${upcomingInterviews.length} interview${upcomingInterviews.length === 1 ? " is" : "s are"} coming up soon. Review the listing, notes, and resume version.`;
    if (followUpsToday.length) return `${followUpsToday.length} follow-up${followUpsToday.length === 1 ? " is" : "s are"} due today. Send a quick check-in while it is fresh.`;
    if (staleActiveJobs.length) return `${staleActiveJobs.length} active application${staleActiveJobs.length === 1 ? "" : "s"} do not have a follow-up date. Add one to keep the search moving.`;
    if (dashboard.saved > dashboard.applied && dashboard.saved >= 2) return "Most of your jobs are still saved. Pick one and turn it into an actual application today.";
    if (dashboard.thisWeek < 5) return "You are under 5 applications this week. Aim for 5 to 10 to build momentum.";
    if (dashboard.inProgress > 0) return "You have active opportunities in motion. Prepare notes before every screen or interview.";
    return "Good pace this week. Stay consistent and keep applying.";
  }, [dashboard, jobs]);

  const reminders = useMemo(() => {
  return jobs
    .map((job) => {
      if (CLOSED_STATUSES.includes(job.status)) return null;

      const possibleActions = [];
      const followDays = daysUntil(job.followUpDate);
      const interviewDays = daysUntil(job.interviewDate);

      if (followDays !== null && followDays <= 7 && job.status !== "Offer") {
        possibleActions.push({
          job,
          type: "Follow-up",
          date: job.followUpDate,
          days: followDays,
        });
      }

      if (interviewDays !== null && interviewDays <= 14) {
        possibleActions.push({
          job,
          type: "Interview",
          date: job.interviewDate,
          days: interviewDays,
        });
      }

      if (!possibleActions.length) return null;

      return possibleActions.sort((a, b) => a.days - b.days)[0];
    })
    .filter(Boolean)
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);
}, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = jobs.filter((job) => {
      const searchable = [job.company, job.title, job.location, job.payRange, job.summary, job.notes, job.contactName, job.source, job.applicationPortal, job.jobListing]
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "All" || job.status === statusFilter) &&
        (priorityFilter === "All" || job.priority === priorityFilter) &&
        (workTypeFilter === "All" || job.workType === workTypeFilter)
      );
    });

    list.sort((a, b) => {
      if (sortBy === "date-asc") return String(a.dateApplied).localeCompare(String(b.dateApplied));
      if (sortBy === "company") return String(a.company).localeCompare(String(b.company));
      if (sortBy === "status") return String(a.status).localeCompare(String(b.status));
      if (sortBy === "priority") return PRIORITY_OPTIONS.indexOf(b.priority) - PRIORITY_OPTIONS.indexOf(a.priority);
      if (sortBy === "age-desc") return (daysSince(b.dateApplied) ?? 0) - (daysSince(a.dateApplied) ?? 0);
      return String(b.dateApplied).localeCompare(String(a.dateApplied));
    });

    return list;
  }, [jobs, search, statusFilter, priorityFilter, workTypeFilter, sortBy]);

  function saveJob(job, options = {}) {
    setJobs((current) => {
      const exists = current.some((item) => item.id === job.id);
      if (exists) return current.map((item) => (item.id === job.id ? job : item));
      return [job, ...current];
    });
    setModalJob(null);
    setToast(options.toast || "Application saved");
  }

  function updateStatus(job, status) {
    saveJob({ ...job, status, updatedAt: new Date().toISOString() }, { toast: `Status updated to ${status}` });
  }

  function deleteJob(id) {
    const job = jobs.find((item) => item.id === id);
    if (!window.confirm(`Delete ${job?.company || "this application"}?`)) return;
    setJobs((current) => current.filter((item) => item.id !== id));
    setToast("Application deleted");
  }

  function duplicateJob(job) {
    const now = new Date().toISOString();
    setJobs((current) => [
      {
        ...job,
        id: crypto.randomUUID(),
        status: "Saved",
        dateApplied: new Date().toISOString().slice(0, 10),
        followUpDate: "",
        interviewDate: "",
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ]);
    setToast("Application copied as saved");
  }

  function resetSampleData() {
    if (!window.confirm("This will replace your tracker with sample jobs. Continue?")) return;
    setJobs(createSampleJobs());
    setToast("Sample data restored");
  }

  function clearTracker() {
    if (!window.confirm("Delete all applications? This cannot be undone.")) return;
    setJobs([]);
    setToast("Tracker cleared");
  }

  function handleImportCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result || ""));
        if (rows.length < 2) {
          setToast("No jobs found in CSV");
          return;
        }

        const [headers, ...dataRows] = rows;
        const importedJobs = dataRows.map((row) => mapImportedJob(headers, row)).filter(Boolean);
        if (!importedJobs.length) {
          setToast("No valid jobs found in CSV");
          return;
        }

        setJobs((current) => [...importedJobs, ...current]);
        setToast(`${importedJobs.length} job${importedJobs.length === 1 ? "" : "s"} imported`);
      } catch {
        setToast("CSV import failed");
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      setToast("CSV import failed");
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setWorkTypeFilter("All");
    setSortBy("date-desc");
  }

  function startEditingFocus() {
    setFocusDraft(currentFocus);
    setIsEditingFocus(true);
  }

  function saveCurrentFocus() {
    const trimmed = focusDraft.trim();
    setCurrentFocus(trimmed || DEFAULT_CURRENT_FOCUS);
    setFocusDraft(trimmed || DEFAULT_CURRENT_FOCUS);
    setIsEditingFocus(false);
    setToast("Current focus updated");
  }

  function cancelEditingFocus() {
    setFocusDraft(currentFocus);
    setIsEditingFocus(false);
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <>
      <style>{styles}</style>
      <div className={`app-shell theme-${theme}`}>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <div className="brand-mark">JT</div>
              <div>
                <h1>Job Tracker</h1>
                <p>A simple tracker for staying organized through every job search</p>
              </div>
            </div>
            <div className="top-actions">
  <a
    className="chrome-extension-button"
    href={CHROME_EXTENSION_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Get the Chrome extension"
  >
    <span className="chrome-extension-icon">⚡</span>
    <span>Get Chrome Extension</span>
  </a>

  <button className="about-app-button" onClick={() => setShowAbout(true)}>
    About this app
  </button>

  <button className="theme-toggle" onClick={toggleTheme} aria-pressed={theme === "dark"} title="Toggle dark mode">
    <span className="theme-toggle-icon">{theme === "dark" ? "☀" : "☾"}</span>
    <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
  </button>
</div>
          </div>
        </header>

        <main className="main-layout">
          <section className={`hero-card ${activeTab === "Applications" ? "hero-compact" : ""}`}>
            <a
  className="hero-kofi-button"
  href={KOFI_URL}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Support this project on Ko-fi"
>
  <span className="hero-kofi-icon">♥</span>
  <span>Support this project</span>
</a>

<div>
              <p className="eyebrow">Career Command Center</p>
              <h2>Track every application without losing your mind.</h2>
              <p>
                Log the listing, portal, pay, recruiter, resume version, follow-up dates, interviews, notes, and status in one clean place.
              </p>
            </div>
            <div className="hero-mini-card focus-card">
              {!isEditingFocus ? (
                <>
                  <button type="button" className="focus-edit-button" onClick={startEditingFocus} aria-label="Edit current focus">Edit</button>
                  <div className="focus-card-display">
                    <span>Current focus</span>
                    <strong>{currentFocus}</strong>
                  </div>
                </>
              ) : (
                <div className="focus-edit-panel">
                  <span>Current focus</span>
                  <input
                    value={focusDraft}
                    onChange={(e) => setFocusDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCurrentFocus();
                      if (e.key === "Escape") cancelEditingFocus();
                    }}
                    placeholder="Example: Help Desk · IT Support · Desktop Support"
                    autoFocus
                  />
                  <div className="focus-edit-actions">
                    <button type="button" className="focus-save-button" onClick={saveCurrentFocus}>Save</button>
                    <button type="button" className="focus-cancel-button" onClick={cancelEditingFocus}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="workspace-nav">
            <nav className="tabs">
              {["Dashboard", "Applications"].map((tab) => (
                <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                  {tab}{tab === "Applications" ? ` (${jobs.length})` : ""}
                </button>
              ))}
            </nav>
            <div className="workspace-actions">
              <span className="backup-reminder">Don&apos;t forget to export a CSV backup.</span>
              <details className="tools-menu">
                <summary>Tools ▾</summary>
                <div className="tools-menu-list">
                  <button type="button" onClick={() => exportCsv(jobs)}>Export CSV backup</button>
                  <button type="button" onClick={() => importInputRef.current?.click()}>Import CSV backup</button>
                  <button type="button" onClick={resetSampleData}>Restore sample data</button>
                  <button type="button" className="danger-button" onClick={clearTracker}>Clear tracker</button>
                </div>
              </details>
              <input ref={importInputRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={handleImportCsv} />
              <button className="button button-primary" onClick={() => setModalJob({ ...EMPTY_JOB })}>Add application</button>
            </div>
          </div>

          {activeTab === "Dashboard" ? (
            <>
              <section className="stats-grid">
                <StatCard label="Total" value={dashboard.total} detail="Applications tracked" />
                <StatCard label="This week" value={dashboard.thisWeek} detail="Last 7 days" tone="blue" />
                <StatCard label="Active" value={dashboard.active} detail="Applied or moving forward" tone="purple" />
                <StatCard label="In progress" value={dashboard.inProgress} detail="Screens, interviews, assessments" tone="blue" />
                <StatCard label="Offers" value={dashboard.offers} detail="Wins" tone="green" />
                <StatCard label="Closed" value={dashboard.rejected + dashboard.ghosted} detail="Rejected or ghosted" tone="red" />
                <StatCard
                  label="Average salary"
                  value={formatMoney(dashboard.averagePay)}
                  detail={`${dashboard.payCount} estimated from pay data`}
                  tone="gold"
                />
              </section>

              <div className="insight-box">
                <strong>Job search insight:</strong> {dashboardInsight}
              </div>

              <section className="analytics-grid">
                <div className="analytics-card">
                  <span>Interview rate</span>
                  <strong>{getPercent(dashboard.interviewed, dashboard.submittedCount)}</strong>
                  <p>{dashboard.interviewed} with interviews out of {dashboard.submittedCount} submitted</p>
                </div>
                <div className="analytics-card">
                  <span>Offer rate</span>
                  <strong>{getPercent(dashboard.offers, dashboard.submittedCount)}</strong>
                  <p>{dashboard.offers} offer{dashboard.offers === 1 ? "" : "s"} tracked</p>
                </div>
                <div className="analytics-card">
                  <span>Avg active age</span>
                  <strong>{dashboard.averageActiveAge !== null ? `${dashboard.averageActiveAge}d` : "—"}</strong>
                  <p>Average age of active applications</p>
                </div>
                <div className="analytics-card">
                  <span>Follow-up suggested</span>
                  <strong>{dashboard.staleCount}</strong>
                  <p>Active jobs without follow-up after 7 days</p>
                </div>
              </section>

              <section className="split-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Next actions</p>
                      <h3>Follow-ups and interviews</h3>
                    </div>
                  </div>
                  {reminders.length ? (
                    <div className="reminder-list">
                      {reminders.map((item) => (
                        <button key={`${item.job.id}-${item.type}`} className={`reminder reminder-${item.days < 0 ? "overdue" : item.days === 0 ? "today" : "soon"}`} onClick={() => setViewJob(item.job)}>
                          <div>
                            <strong>{item.job.company}</strong>
                            <span>{item.type} · {item.job.title}</span>
                          </div>
                          <div className="reminder-date">
                            <strong>{formatDate(item.date)}</strong>
                            <span>{item.days < 0 ? `${Math.abs(item.days)}d overdue` : item.days === 0 ? "Today" : `In ${item.days}d`}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">No follow-ups due. Either you're on top of things or it's time to send a few.</div>
                  )}
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Pipeline</p>
                      <h3>Status breakdown</h3>
                    </div>
                  </div>
                  <div className="status-stack">
                    {STATUS_OPTIONS.map((status) => {
                      const count = jobs.filter((job) => job.status === status).length;
                      if (!count) return null;
                      return (
                        <div key={status} className="status-row">
                          <span className={statusClass(status)}>{status}</span>
                          <strong>{count}</strong>
                        </div>
                      );
                    })}
                    {!jobs.length ? <div className="empty-state">No data yet.</div> : null}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="panel">
              <div className="panel-header panel-header-wide">
                <div>
                  <p className="eyebrow">Application database</p>
                  <h3>{filteredJobs.length} shown out of {jobs.length}</h3>
                </div>
                <button className="button button-secondary" onClick={clearFilters}>Clear filters</button>
              </div>

              <div className="filters">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, title, notes, source..." />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option>All</option>
                  {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option>All</option>
                  {PRIORITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
                <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)}>
                  <option>All</option>
                  {WORK_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="age-desc">Oldest applications</option>
                  <option value="company">Company A-Z</option>
                  <option value="status">Status</option>
                  <option value="priority">Priority</option>
                </select>
              </div>

              <div className="table-wrap">
                {filteredJobs.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Company / Role</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Applied</th>
                        <th>Pay</th>
                        <th>Next action</th>
                        <th>Links</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map((job) => {
                        const age = daysSince(job.dateApplied);
                        const nextAction = getNextAction(job);
                        const staleInfo = getStaleInfo(job);
                        return (
                          <tr key={job.id} className={staleInfo ? "stale-row" : ""}>
                            <td>
                              <button className="linkish title-cell" onClick={() => setViewJob(job)}>
                                <strong>{job.company}</strong>
                                <span>{job.title}</span>
                              </button>
                              <small>{job.location || "No location"} · {job.source} · {job.workType} · {getCompleteness(job)}% filled</small>
                            </td>
                            <td>
                              <select
                                className="status-dropdown"
                                value={job.status}
                                onChange={(e) => updateStatus(job, e.target.value)}
                              >
                                {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                              </select>
                            </td>
                            <td><span className={priorityClass(job.priority)}>{job.priority}</span></td>
                            <td>
                              <div className="date-cell">
                                <strong>{formatDate(job.dateApplied)}</strong>
                                <span>{age !== null ? `${age}d old` : "No date"}</span>
                                <span>Updated {formatDateTime(job.updatedAt || job.createdAt)}</span>
                              </div>
                            </td>
                            <td>
                              <div className="pay-cell">
                                <strong>{job.payRange || "—"}</strong>
                                <span>{getEstimatedAnnualPay(job) ? `${formatMoney(getEstimatedAnnualPay(job))} est.` : "No estimate"}</span>
                              </div>
                            </td>
                            <td>
                              {nextAction ? (
                                <div className="next-action">
                                  <strong>{nextAction.label}</strong>
                                  <span className={nextAction.tone}>{nextAction.text}</span>
                                </div>
                              ) : staleInfo ? (
                                <div className="next-action">
                                  <strong className="stale-text">{staleInfo.label}</strong>
                                  <span className="warning">{staleInfo.text}</span>
                                </div>
                              ) : (
                                <span className={getReminderText(job) === "Needs follow-up" ? "needs-action" : "soft-muted"}>{getReminderText(job)}</span>
                              )}
                            </td>
                            <td>
                              <div className="link-pills">
                                {job.applicationPortal ? <button className="portal-button" onClick={() => openUrl(job.applicationPortal)}>Portal</button> : null}
                                {job.jobListing ? <a href={job.jobListing} target="_blank" rel="noreferrer">Listing</a> : null}
                                {!job.applicationPortal && !job.jobListing ? <span className="soft-muted">No links</span> : null}
                              </div>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button onClick={() => setViewJob(job)}>View</button>
                                <button onClick={() => setModalJob(job)}>Edit</button>
                                <details className="more-menu">
                                  <summary>More ▾</summary>
                                  <div className="more-menu-list">
                                    <button onClick={() => duplicateJob(job)}>Copy</button>
                                    <button className="danger-button" onClick={() => deleteJob(job.id)}>Delete</button>
                                  </div>
                                </details>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No applications match your filters.</div>
                )}
              </div>
            </section>
          )}


        </main>

        {modalJob ? <JobModal initialJob={modalJob} onClose={() => setModalJob(null)} onSave={saveJob} /> : null}
        {viewJob ? <DetailModal job={viewJob} onClose={() => setViewJob(null)} onEdit={() => { setModalJob(viewJob); setViewJob(null); }} /> : null}
        {showAbout ? <AboutModal onClose={() => setShowAbout(false)} /> : null}
        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </>
  );
}

const styles = `
* { box-sizing: border-box; }
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172033;
  background: #eef3f8;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}
html, body, #root {
  width: 100%;
  max-width: none;
  min-height: 100%;
  margin: 0;
  padding: 0;
  text-align: left;
}
body {
  min-width: 320px;
  min-height: 100vh;
  overflow-x: hidden;
  background: radial-gradient(circle at top left, #dbeafe 0, transparent 34%), linear-gradient(135deg, #f8fafc 0%, #edf2f7 52%, #e8eef7 100%);
}
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
a { color: inherit; }
.app-shell {
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
  background: transparent;
  color: #172033;
  transition: background .2s ease, color .2s ease;
  padding-top: 112px;
}.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 500;
  padding: 18px 0;
  background: rgba(255, 255, 255, .92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid #dbe4ef;
}.topbar-inner { width: min(100% - 40px, 1360px); margin-inline: auto; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.brand { display: flex; align-items: center; gap: 14px; }
.brand-mark { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 16px; background: linear-gradient(135deg, #2563eb, #0f172a); color: #fff; font-weight: 900; letter-spacing: -0.05em; box-shadow: 0 16px 30px rgba(37, 99, 235, 0.24); }
.brand h1 { margin: 0; font-size: 20px; letter-spacing: -0.03em; color: #0f172a; }
.brand p { margin: 3px 0 0; color: #64748b; font-size: 13px; }
.top-actions { display: flex; gap: 10px; flex-wrap: nowrap; align-items: center; }.chrome-extension-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(147, 197, 253, .55);
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #ffffff;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 900;
  font-size: 13px;
  text-decoration: none;
  box-shadow: 0 14px 28px rgba(37, 99, 235, .22);
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
}

.chrome-extension-button:hover {
  transform: translateY(-1px);
  border-color: rgba(191, 219, 254, .85);
  box-shadow: 0 18px 36px rgba(37, 99, 235, .32);
}

.chrome-extension-icon {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .18);
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
}
.theme-toggle { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #dbe4ef; background: #fff; color: #263244; border-radius: 12px; padding: 10px 14px; font-weight: 900; font-size: 13px; transition: transform .16s ease, box-shadow .16s ease, background .16s ease; }
.theme-toggle:hover { transform: translateY(-1px); box-shadow: 0 12px 22px rgba(15, 23, 42, .08); }
.theme-toggle-icon { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 12px; line-height: 1; }
.button { border: 0; border-radius: 12px; padding: 10px 14px; font-weight: 800; font-size: 13px; transition: transform .16s ease, box-shadow .16s ease, background .16s ease; }
.button:hover { transform: translateY(-1px); }
.button:disabled { cursor: not-allowed; opacity: .55; transform: none; box-shadow: none; }
.button-primary { color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); box-shadow: 0 12px 22px rgba(37, 99, 235, 0.22); }
.button-secondary { background: #fff; color: #263244; border: 1px solid #dbe4ef; }
.button-danger { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
.main-layout { width: min(100% - 40px, 1360px); margin: 0 auto 52px; }.hero-card { display: flex; justify-content: space-between; gap: 34px; align-items: stretch; padding: 34px 30px; border-radius: 28px; background: linear-gradient(135deg, rgba(15, 23, 42, .97), rgba(30, 64, 175, .88)); color: #fff; box-shadow: 0 30px 70px rgba(15, 23, 42, .20); overflow: hidden; position: relative; }
.hero-card:after { content: ""; position: absolute; width: 320px; height: 320px; border-radius: 999px; background: rgba(255,255,255,.12); right: -120px; top: -140px; }
.hero-kofi-button {
  position: absolute;
  top: 18px;
  right: 30px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, .28);
  background: rgba(255, 255, 255, .12);
  color: #ffffff;
  border-radius: 999px;
  padding: 9px 13px;
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, .22);
  transition: transform .16s ease, background .16s ease, border-color .16s ease;
}

.hero-kofi-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, .18);
  border-color: rgba(255, 255, 255, .42);
}

.hero-kofi-icon {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ff5f5f;
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
}
.hero-card h2 { margin: 6px 0 12px; font-size: clamp(34px, 4.1vw, 58px); letter-spacing: -0.06em; line-height: .96; max-width: 820px; }
.hero-card p { margin: 0; max-width: 760px; color: rgba(255,255,255,.78); font-size: 15px; line-height: 1.6; }
.hero-compact { padding: 28px 30px; }
.hero-compact h2 { font-size: clamp(32px, 3.5vw, 50px); max-width: 800px; }
.hero-mini-card { align-self: end; min-width: 260px; padding: 18px; border-radius: 20px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(14px); z-index: 1; }
.hero-mini-card span { display: block; color: rgba(255,255,255,.7); font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: .08em; }
.hero-mini-card strong { display: block; margin-top: 8px; font-size: 17px; line-height: 1.25; }
.focus-card { position: relative; display: grid; place-items: center; min-height: 126px; padding: 20px 44px; text-align: center; }
.focus-card-display { width: 100%; }
.focus-edit-button { position: absolute; top: 14px; right: 14px; border: 1px solid rgba(255,255,255,.20); background: rgba(255,255,255,.10); color: rgba(255,255,255,.82); border-radius: 999px; padding: 5px 9px; font-size: 10px; font-weight: 900; line-height: 1; opacity: .72; transition: opacity .16s ease, background .16s ease, transform .16s ease; }
.focus-edit-button:hover { opacity: 1; background: rgba(255,255,255,.18); transform: translateY(-1px); }
.focus-edit-panel { width: 100%; display: grid; gap: 10px; }
.focus-edit-panel input { background: rgba(255,255,255,.96); border-color: rgba(255,255,255,.32); color: #0f172a; text-align: center; }
.focus-edit-actions { display: flex; gap: 8px; justify-content: center; }
.focus-save-button, .focus-cancel-button { border-radius: 10px; padding: 7px 10px; font-size: 12px; font-weight: 900; }
.focus-save-button { border: 1px solid rgba(255,255,255,.34); background: #fff; color: #1d4ed8; }
.focus-cancel-button { border: 1px solid rgba(255,255,255,.26); background: rgba(255,255,255,.10); color: #fff; }
.eyebrow { margin: 0; color: #2563eb; text-transform: uppercase; font-size: 11px; letter-spacing: .12em; font-weight: 900; }
.hero-card .eyebrow { color: #bfdbfe; }
.workspace-nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 24px 0 22px; }
.workspace-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
.backup-reminder { color: #64748b; font-size: 12px; font-weight: 800; white-space: nowrap; opacity: .82; }
.tools-menu { position: relative; }
.tools-menu summary { list-style: none; cursor: pointer; user-select: none; border: 1px solid #dbe4ef; background: #fff; color: #263244; border-radius: 12px; padding: 10px 14px; font-weight: 900; font-size: 13px; }
.tools-menu summary::-webkit-details-marker { display: none; }
.tools-menu-list { position: absolute; right: 0; top: calc(100% + 8px); z-index: 35; min-width: 190px; display: grid; gap: 6px; padding: 8px; border: 1px solid #dbe4ef; border-radius: 14px; background: #fff; box-shadow: 0 18px 42px rgba(15, 23, 42, .16); }
.tools-menu-list button { width: 100%; text-align: left; border: 1px solid #dbe4ef; background: #fff; border-radius: 10px; padding: 8px 10px; color: #334155; font-size: 12px; font-weight: 800; }
.tools-menu-list .danger-button { color: #be123c; background: #fff1f2; border-color: #fecdd3; }
.visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
.tabs { display: inline-flex; gap: 6px; padding: 6px; border-radius: 16px; background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(148, 163, 184, .25); }
.tabs button { border: 0; background: transparent; padding: 10px 16px; border-radius: 12px; font-weight: 900; color: #64748b; }
.tabs button.active { color: #0f172a; background: #fff; box-shadow: 0 8px 20px rgba(15,23,42,.08); }
.stats-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 14px; }
.stat-card { background: rgba(255,255,255,.88); border: 1px solid rgba(148,163,184,.24); border-radius: 22px; padding: 18px; box-shadow: 0 16px 38px rgba(15,23,42,.06); }
.stat-card p { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 900; }
.stat-card strong { display: block; font-size: 30px; letter-spacing: -0.05em; color: #0f172a; }
.stat-card span { display: block; margin-top: 3px; font-size: 12px; color: #94a3b8; }
.stat-blue strong { color: #2563eb; }
.stat-purple strong { color: #7c3aed; }
.stat-green strong { color: #16a34a; }
.stat-red strong { color: #dc2626; }
.stat-gold strong { color: #b45309; }
.insight-box { margin: 14px 0 0; padding: 15px 18px; border-radius: 18px; background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #1d4ed8; border: 1px solid #bfdbfe; box-shadow: 0 12px 28px rgba(37, 99, 235, .08); font-weight: 700; }
.insight-box strong { color: #0f172a; }
.analytics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 14px; }
.analytics-card { background: rgba(255,255,255,.84); border: 1px solid rgba(148,163,184,.24); border-radius: 20px; padding: 16px; box-shadow: 0 14px 34px rgba(15,23,42,.055); }
.analytics-card span { display: block; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; font-weight: 900; margin-bottom: 7px; }
.analytics-card strong { display: block; color: #0f172a; font-size: 26px; letter-spacing: -0.04em; }
.analytics-card p { margin: 4px 0 0; color: #94a3b8; font-size: 12px; font-weight: 700; line-height: 1.35; }
.split-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr); gap: 16px; margin-top: 16px; }
.panel { background: rgba(255,255,255,.88); border: 1px solid rgba(148,163,184,.24); border-radius: 26px; box-shadow: 0 18px 46px rgba(15,23,42,.07); overflow: hidden; }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 22px; border-bottom: 1px solid rgba(148, 163, 184, .18); }
.panel-header h3 { margin: 4px 0 0; font-size: 19px; letter-spacing: -0.03em; }
.panel-header-wide { align-items: flex-end; }
.reminder-list, .status-stack { padding: 16px; display: grid; gap: 10px; }
.reminder { width: 100%; text-align: left; display: flex; justify-content: space-between; align-items: center; gap: 12px; border: 1px solid #dbe4ef; background: #fff; padding: 14px; border-radius: 16px; }
.reminder:hover { background: #f8fafc; }
.reminder strong { display: block; color: #0f172a; }
.reminder span { color: #64748b; font-size: 12px; }
.reminder-date { text-align: right; white-space: nowrap; }
.reminder-overdue { border-color: #fecdd3; background: #fff1f2; }
.reminder-today { border-color: #fde68a; background: #fffbeb; }
.status-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 14px; background: #f8fafc; }
.filters { display: grid; grid-template-columns: minmax(260px, 1.5fr) repeat(4, minmax(150px, .7fr)); gap: 10px; padding: 16px; border-bottom: 1px solid rgba(148, 163, 184, .18); }
input, select, textarea { width: 100%; border: 1px solid #dbe4ef; background: #fff; color: #172033; border-radius: 12px; padding: 10px 12px; outline: none; }
textarea { min-height: 96px; resize: vertical; }
input:focus, select:focus, textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, .10); }
.table-wrap { width: 100%; overflow-x: auto; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; }
table { width: 100%; min-width: 1080px; border-collapse: collapse; table-layout: auto; }
th:nth-child(1), td:nth-child(1) { width: 30%; }
th:nth-child(2), td:nth-child(2) { width: 14%; }
th:nth-child(8), td:nth-child(8) { width: 12%; }
th { text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; background: #f8fafc; white-space: nowrap; }
td { padding: 12px 10px; border-top: 1px solid rgba(148,163,184,.18); vertical-align: middle; color: #334155; font-size: 13px; white-space: nowrap; }
tr:hover td { background: rgba(248, 250, 252, .7); }
.title-cell { display: grid; gap: 2px; text-align: left; }
.title-cell strong { color: #0f172a; font-size: 14px; }
.title-cell span { color: #475569; font-size: 13px; white-space: normal; }
td small { color: #94a3b8; font-size: 11px; }
.linkish { border: 0; background: transparent; padding: 0; }
.badge, .priority, .soft-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 900; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.badge-saved { background: #f1f5f9; color: #475569; }
.badge-applied { background: #dbeafe; color: #1d4ed8; }
.badge-in-review { background: #cffafe; color: #0e7490; }
.badge-screening { background: #ede9fe; color: #6d28d9; }
.badge-interview { background: #dcfce7; color: #15803d; }
.badge-assessment { background: #fef3c7; color: #b45309; }
.badge-rejected { background: #ffe4e6; color: #be123c; }
.badge-offer { background: #bbf7d0; color: #166534; }
.badge-ghosted { background: #e2e8f0; color: #475569; }
.badge-withdrawn { background: #fae8ff; color: #86198f; }
.priority-low { background: #f1f5f9; color: #64748b; }
.priority-medium { background: #fef3c7; color: #a16207; }
.priority-high { background: #ffe4e6; color: #be123c; }
.soft-badge { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
.status-dropdown { min-width: 132px; border-radius: 12px; padding: 7px 10px; font-weight: 900; border: 1px solid #dbe4ef; background: #fff; color: #172033; box-shadow: 0 4px 10px rgba(15, 23, 42, .04); }
.age-pill { display: inline-flex; align-items: center; justify-content: center; background: #f1f5f9; padding: 6px 10px; border-radius: 999px; font-weight: 900; font-size: 12px; color: #334155; border: 1px solid #e2e8f0; }
.salary-pill { display: inline-flex; align-items: center; justify-content: center; background: #ecfdf5; color: #047857; border: 1px solid #bbf7d0; padding: 6px 10px; border-radius: 999px; font-weight: 900; font-size: 12px; white-space: nowrap; }
.pay-cell, .date-cell { display: grid; gap: 3px; }
.pay-cell strong, .date-cell strong { color: #0f172a; font-weight: 900; }
.pay-cell span, .date-cell span { color: #94a3b8; font-size: 11px; font-weight: 700; }
.next-action strong { display: block; color: #0f172a; }
.next-action span { font-size: 12px; color: #64748b; }
.next-action .danger { color: #dc2626; font-weight: 900; }
.next-action .warning { color: #d97706; font-weight: 900; }
.soft-muted { color: #94a3b8; font-size: 12px; font-weight: 700; }
.needs-action { color: #d97706; font-size: 12px; font-weight: 900; }
.stale-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 900; white-space: nowrap; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.stale-row td { background: rgba(255, 251, 235, .42); }
.stale-text { color: #b45309 !important; }
.mini-action-button { justify-self: start; width: auto; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 10px; padding: 7px 10px; font-size: 12px; font-weight: 900; }
.mini-action-button:disabled { opacity: .48; cursor: not-allowed; }
.link-pills, .row-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
.link-pills a, .link-pills button, .row-actions button, .more-menu summary { border: 1px solid #dbe4ef; background: #fff; border-radius: 10px; padding: 7px 9px; color: #2563eb; text-decoration: none; font-size: 12px; font-weight: 800; line-height: 1.2; }
.row-actions button, .more-menu summary { color: #334155; }
.more-menu { position: relative; }
.more-menu summary { list-style: none; cursor: pointer; user-select: none; }
.more-menu summary::-webkit-details-marker { display: none; }
.more-menu-list { position: absolute; right: 0; top: calc(100% + 8px); z-index: 30; min-width: 116px; display: grid; gap: 6px; padding: 8px; border: 1px solid #dbe4ef; border-radius: 14px; background: #fff; box-shadow: 0 18px 42px rgba(15, 23, 42, .16); }
.more-menu-list button { width: 100%; text-align: left; }
.link-pills .portal-button, .row-actions .primary-row-action { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.row-actions .danger-button { color: #be123c; background: #fff1f2; border-color: #fecdd3; }
.empty-state { padding: 34px; text-align: center; color: #64748b; }
.footer-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, .58); backdrop-filter: blur(8px); display: flex; align-items: flex-start; justify-content: center; padding: 48px 16px 28px; overflow-y: auto; }
.modal-card, .about-card { width: min(100% - 36px, 680px); max-height: calc(100vh - 70px); overflow-y: auto; background: #fff; border-radius: 26px; box-shadow: 0 28px 80px rgba(15, 23, 42, .24); border: 1px solid rgba(148, 163, 184, .28); }
.about-content { display: grid; gap: 16px; padding: 0 24px 22px; }
.about-content p { margin: 0; color: #475569; line-height: 1.65; font-size: 15px; }
.about-warning { border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 18px; padding: 16px; }
.about-warning strong { display: block; margin-bottom: 6px; color: #1d4ed8; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; }
.about-list { display: grid; gap: 10px; }
.about-list div { display: grid; gap: 4px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; }
.about-list strong { color: #0f172a; font-size: 14px; }
.about-list span { color: #64748b; font-size: 13px; line-height: 1.5; }
.about-list a { color: #2563eb; font-weight: 800; text-decoration: none; }
.about-list a:hover { text-decoration: underline; }
.detail-card { width: min(980px, 100%); background: #fff; border-radius: 28px; box-shadow: 0 40px 80px rgba(15,23,42,.28); overflow: hidden; }
.detail-card { width: min(760px, 100%); }
.modal-header { display: flex; justify-content: space-between; gap: 20px; padding: 24px; border-bottom: 1px solid #e2e8f0; }
.modal-header h2 { margin: 4px 0 0; font-size: 24px; letter-spacing: -0.04em; }
.detail-subtitle { margin: 5px 0 0; color: #64748b; }
.icon-button { width: 38px; height: 38px; border-radius: 12px; border: 1px solid #dbe4ef; background: #fff; font-size: 26px; line-height: 1; color: #64748b; }
.job-form { padding: 22px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.job-form-streamlined { display: block; padding: 24px; }
.streamlined-modal { width: min(1040px, 100%); }
.form-section { padding: 18px; border: 1px solid #e2e8f0; border-radius: 20px; background: #fbfdff; margin-bottom: 14px; }
.form-section-wide { width: 100%; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.section-heading span { font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: #2563eb; font-weight: 900; }
.section-heading p { margin: 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-align: right; }
.section-grid { display: grid; gap: 14px; }
.core-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.three-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.tracking-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.two-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.details-grid { grid-template-columns: minmax(180px, .7fr) repeat(2, minmax(0, 1fr)); }
.field { display: grid; gap: 6px; }
.field span { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 900; }
.field-help { color: #94a3b8; font-size: 11px; font-weight: 700; line-height: 1.35; margin-top: -1px; }
.field-wide { grid-column: span 1; }
.job-form-streamlined .field-wide { grid-column: span 1; }
.details-grid .field-wide { grid-column: span 2; }
.advanced-section .field-wide { grid-column: span 3; }
.advanced-toggle-row { display: flex; justify-content: center; margin: 4px 0 16px; }
.advanced-toggle { border: 1px solid #dbe4ef; background: #fff; color: #2563eb; border-radius: 999px; padding: 9px 14px; font-weight: 900; font-size: 12px; }
.advanced-section { background: #f8fafc; }
.modal-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; padding-top: 10px; }
.streamlined-actions { padding-top: 4px; }
.detail-badges { display: flex; flex-wrap: wrap; gap: 8px; padding: 18px 24px 0; }
.detail-grid { padding: 20px 24px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.info-item { padding: 14px; border-radius: 16px; background: #f8fafc; border: 1px solid #e2e8f0; }
.info-item span { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 900; margin-bottom: 5px; }
.info-item strong { color: #0f172a; word-break: break-word; }
.detail-block { margin: 0 24px 16px; padding: 16px; border-radius: 18px; background: #f8fafc; border: 1px solid #e2e8f0; }
.detail-block h3 { margin: 0 0 8px; font-size: 14px; }
.detail-block p { margin: 0; color: #475569; white-space: pre-wrap; }
.interview-prep-block .prep-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.interview-prep-block .info-item strong { white-space: pre-wrap; font-size: 13px; line-height: 1.45; }
.detail-links { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 24px 20px; }
.detail-links a { border-radius: 12px; background: #eff6ff; color: #1d4ed8; padding: 9px 12px; text-decoration: none; font-weight: 900; font-size: 13px; }
.toast { position: fixed; right: 22px; bottom: 22px; z-index: 80; background: #0f172a; color: #fff; border-radius: 16px; padding: 13px 16px; box-shadow: 0 18px 40px rgba(15,23,42,.30); font-weight: 900; }

.theme-dark {
  background: radial-gradient(circle at top left, rgba(37, 99, 235, .22) 0, transparent 34%), linear-gradient(135deg, #08111f 0%, #0f172a 48%, #111827 100%);
  color: #e5edf8;
}
.theme-dark .topbar {
  border-bottom-color: rgba(148, 163, 184, .18);
  background: rgba(15, 23, 42, .92);
}.theme-dark .brand h1, .theme-dark .panel-header h3, .theme-dark .stat-card strong, .theme-dark .analytics-card strong, .theme-dark .title-cell strong, .theme-dark .pay-cell strong, .theme-dark .date-cell strong, .theme-dark .next-action strong, .theme-dark .info-item strong, .theme-dark .modal-header h2, .theme-dark .reminder strong, .theme-dark .status-row strong { color: #f8fafc; }
.theme-dark .brand p, .theme-dark .hero-card p, .theme-dark .title-cell span, .theme-dark .detail-subtitle, .theme-dark .detail-block p { color: #cbd5e1; }
.theme-dark .chrome-extension-button {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #ffffff;
  border-color: rgba(147, 197, 253, .45);
  box-shadow: 0 14px 34px rgba(37, 99, 235, .26);
}
  .theme-dark .more-menu-list, .theme-dark .tools-menu-list { background: #111827; border-color: rgba(148, 163, 184, .24); box-shadow: 0 18px 42px rgba(0,0,0,.28); }
.theme-dark .backup-reminder { color: #94a3b8; }
.theme-dark .theme-toggle-icon { background: rgba(37, 99, 235, .18); color: #bfdbfe; }
.theme-dark .hero-card { background: linear-gradient(135deg, rgba(2, 6, 23, .98), rgba(30, 58, 138, .88)); box-shadow: 0 30px 70px rgba(0, 0, 0, .35); }
.theme-dark .hero-mini-card { background: rgba(255, 255, 255, 0.10); border-color: rgba(255,255,255,.16); }
.theme-dark .tabs { background: rgba(15, 23, 42, 0.76); border-color: rgba(148, 163, 184, .20); }
.theme-dark .tabs button { color: #94a3b8; }
.theme-dark .tabs button.active { color: #f8fafc; background: #1e293b; box-shadow: 0 8px 20px rgba(0,0,0,.18); }
.theme-dark .stat-card, .theme-dark .analytics-card, .theme-dark .panel, .theme-dark .modal-card, .theme-dark .detail-card { background: rgba(15, 23, 42, .90); border-color: rgba(148,163,184,.18); box-shadow: 0 18px 42px rgba(0,0,0,.24); }
.theme-dark .insight-box { background: linear-gradient(135deg, rgba(30, 64, 175, .28), rgba(37, 99, 235, .16)); color: #bfdbfe; border-color: rgba(96, 165, 250, .28); }
.theme-dark .insight-box strong { color: #f8fafc; }
.theme-dark .panel-header, .theme-dark .filters, .theme-dark .modal-header { border-color: rgba(148, 163, 184, .18); }
.theme-dark input, .theme-dark select, .theme-dark textarea { background: #111827; color: #e5edf8; border-color: rgba(148, 163, 184, .30); }
.theme-dark input::placeholder, .theme-dark textarea::placeholder { color: #64748b; }
.theme-dark input:focus, .theme-dark select:focus, .theme-dark textarea:focus { border-color: #60a5fa; box-shadow: 0 0 0 4px rgba(96, 165, 250, .14); }
.theme-dark th { background: #111827; color: #94a3b8; }
.theme-dark td { color: #cbd5e1; border-top-color: rgba(148,163,184,.16); }
.theme-dark tr:hover td { background: rgba(30, 41, 59, .55); }
.theme-dark .status-row, .theme-dark .reminder, .theme-dark .info-item, .theme-dark .detail-block, .theme-dark .form-section { background: rgba(17, 24, 39, .86); border-color: rgba(148, 163, 184, .20); }
.theme-dark .form-section, .theme-dark .advanced-section { background: rgba(17, 24, 39, .70); }
.theme-dark .modal-backdrop { background: rgba(2, 6, 23, .72); }
.theme-dark .badge-saved, .theme-dark .priority-low, .theme-dark .soft-badge, .theme-dark .age-pill { background: #1e293b; color: #cbd5e1; border-color: rgba(148, 163, 184, .22); }
.theme-dark .badge-applied { background: rgba(37, 99, 235, .22); color: #bfdbfe; }
.theme-dark .badge-in-review { background: rgba(8, 145, 178, .22); color: #a5f3fc; }
.theme-dark .badge-screening { background: rgba(109, 40, 217, .24); color: #ddd6fe; }
.theme-dark .badge-interview, .theme-dark .badge-offer, .theme-dark .salary-pill { background: rgba(22, 101, 52, .24); color: #bbf7d0; border-color: rgba(74, 222, 128, .22); }
.theme-dark .badge-assessment, .theme-dark .priority-medium { background: rgba(180, 83, 9, .24); color: #fde68a; }
.theme-dark .badge-rejected, .theme-dark .priority-high, .theme-dark .row-actions .danger-button, .theme-dark .more-menu-list .danger-button, .theme-dark .tools-menu-list .danger-button { background: rgba(190, 18, 60, .20); color: #fecdd3; border-color: rgba(251, 113, 133, .22); }
.theme-dark .badge-ghosted { background: #334155; color: #cbd5e1; }
.theme-dark .badge-withdrawn { background: rgba(134, 25, 143, .24); color: #f5d0fe; }
.theme-dark .status-dropdown { background: #111827; color: #e5edf8; border-color: rgba(148, 163, 184, .28); }
.theme-dark .pay-cell span, .theme-dark .date-cell span, .theme-dark td small, .theme-dark .soft-muted, .theme-dark .field-help, .theme-dark .section-heading p, .theme-dark .stat-card span, .theme-dark .analytics-card span, .theme-dark .analytics-card p, .theme-dark .reminder span { color: #94a3b8; }
.theme-dark .stale-badge, .theme-dark .stale-text { background: rgba(180, 83, 9, .20); color: #fde68a !important; border-color: rgba(251, 191, 36, .22); }
.theme-dark .stale-row td { background: rgba(120, 53, 15, .18); }
.theme-dark .mini-action-button { background: rgba(37, 99, 235, .18); color: #bfdbfe; border-color: rgba(96, 165, 250, .22); }
.theme-dark .detail-links a, .theme-dark .link-pills .portal-button, .theme-dark .row-actions .primary-row-action { background: rgba(37, 99, 235, .18); color: #bfdbfe; border-color: rgba(96, 165, 250, .22); }
.theme-dark .empty-state { color: #94a3b8; }
.theme-dark .toast { background: #f8fafc; color: #0f172a; }
.theme-dark .stat-blue strong {
  color: #60a5fa;
}

.theme-dark .stat-purple strong {
  color: #a78bfa;
}

.theme-dark .stat-green strong {
  color: #22c55e;
}

.theme-dark .stat-red strong {
  color: #f87171;
}

.theme-dark .stat-gold strong {
  color: #f59e0b;
}

@media (max-width: 1100px) { .stats-grid, .analytics-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .split-grid { grid-template-columns: 1fr; } .filters { grid-template-columns: 1fr 1fr; } .job-form { grid-template-columns: repeat(2, minmax(0, 1fr)); } .tracking-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .details-grid { grid-template-columns: 1fr; } }
.theme-dark .about-app-button { background: #172033; color: #e5edf8; border-color: rgba(148, 163, 184, .28); }
.theme-dark .about-card { background: #111827; border-color: rgba(148, 163, 184, .24); }
.theme-dark .about-content p { color: #cbd5e1; }
.theme-dark .about-warning { background: rgba(37, 99, 235, .12); border-color: rgba(96, 165, 250, .35); }
.theme-dark .about-warning strong { color: #93c5fd; }
.theme-dark .about-list div { background: #172033; border-color: rgba(148, 163, 184, .24); }
.theme-dark .about-list strong { color: #f8fafc; }
.theme-dark .about-list span { color: #cbd5e1; }
.theme-dark .about-list a { color: #93c5fd; }
@media (max-width: 720px) {
  .hero-kofi-button {
    position: relative;
    top: auto;
    right: auto;
    width: fit-content;
    margin-bottom: 14px;
  }
  .topbar-inner, .hero-card, .workspace-nav { flex-direction: column; align-items: stretch; }
  .workspace-actions { justify-content: stretch; }
  .backup-reminder { order: 3; width: 100%; text-align: center; white-space: normal; font-size: 11px; }
  .workspace-actions .button, .workspace-actions .tools-menu { flex: 1; }
  .tools-menu summary { text-align: center; }
  .tools-menu-list { left: 0; right: auto; width: 100%; }
  .topbar-inner, .main-layout { width: 100%; padding-left: 12px; padding-right: 12px; }
  .main-layout { padding-bottom: 80px; }
  .stats-grid, .analytics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filters, .job-form, .detail-grid, .core-grid, .three-grid, .tracking-grid, .two-grid, .details-grid { grid-template-columns: 1fr; }
  .section-heading { display: block; }
  .section-heading p { text-align: left; margin-top: 4px; }
  .field-wide, .details-grid .field-wide, .advanced-section .field-wide { grid-column: span 1; }
  .hero-mini-card { min-width: 0; }
  .footer-actions { flex-direction: column; }
}
`;
