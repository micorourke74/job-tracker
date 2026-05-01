# Job Tracker

A browser-based job application tracker for staying organized through every job search.

**Live app:** [job-tracker-ten-self.vercel.app](https://job-tracker-ten-self.vercel.app)

![Job Tracker promo card](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Promo%20Card.png)

---

## What it does

Job Tracker keeps every application in one place — the listing link, application portal, pay range, recruiter contact, resume version, follow-up date, interview date, notes, and status — so nothing falls through the cracks when you are applying to dozens of roles at once.

---

## Features

- Add, edit, copy, and delete job applications
- Track status across 10 stages: Saved, Applied, In Review, Screening, Interview, Assessment, Offer, Rejected, Ghosted, Withdrawn
- Track priority (Low, Medium, High) and work type (On-site, Hybrid, Remote)
- Save job listing URLs and application portal URLs
- Set follow-up dates and interview dates
- Estimate annual salary from hourly or salaried pay ranges
- Store position summaries, notes, recruiter contacts, and resume versions
- Store interview prep notes, questions to ask, and STAR stories
- Dashboard with summary metrics, pipeline breakdown, and upcoming reminders
- Dynamic job search insight message based on current tracker activity
- Stale application detection when active jobs go 7+ days without a follow-up
- Import job listings faster with the companion Chrome extension
- Export and import CSV backups
- Light and dark mode with persistent preference
- All data stored privately in your browser — no account required

---

## Chrome Extension

Job Tracker includes a companion extension called **Job Tracker Clipper**.

When you are viewing a job listing, click the extension and choose **Save this job**. The extension reads the active page, extracts available details, and opens Job Tracker with the data pre-filled — ready for you to review and save.

Extracted fields include company name, job title, location, pay range, work type, source, listing URL, and job description.

**Manual install (developer load):**

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `job-tracker-extension` folder
6. Pin Job Tracker Clipper for easy access

See the [extension README](job-tracker-extension/README.md) for full details on how it works, supported sites, and extraction defaults.

![Job Tracker Clipper marquee promo](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Marquee%20Card.png)

---

## Data and Privacy

Job Tracker stores all data locally in your browser using `localStorage` under the key `job_tracker_applications_v3`. Nothing is sent to a server. No account is required. No data leaves your device.

**This means:**

- Clearing browser data will erase your tracker
- Switching browsers or devices will not carry your data over
- Exporting a CSV backup is the only way to preserve your data across sessions

Use the **Tools** menu to export a CSV backup regularly. You can re-import it at any time to restore your applications.

The Chrome extension does not write to localStorage directly. It encodes extracted job data into a URL parameter, opens the Job Tracker app, and the app handles creating and saving the job entry. The URL is cleaned immediately after import so refreshing never duplicates the record.

---

## CSV Backup

Export and import are available in the **Tools** menu.

**Export** produces a `.csv` file with all tracked fields including estimated annual salary, days since applied, listing and portal links, interview prep fields, and timestamps.

**Import** reads a CSV that matches the export format and prepends the imported jobs to your current list. It is safe to import — it does not overwrite existing records.

The CSV format is compatible with the app's own export. If you have an older export from a previous version, the import logic handles legacy field names gracefully.

---

## Screenshots

### Dashboard Overview
![Dashboard Overview](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Screenshot%20One.png)

### About This App
![About This App](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Screenshot%20Two.png)

### Job Listing Source Page
![Job Listing Source Page](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Screenshot%20Three.png)

### Chrome Extension Popup
![Chrome Extension Popup](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Screenshot%20Four.png)

### Imported Job Snapshot
![Imported Job Snapshot](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Screenshot%20Five.png)

---

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## Project Structure

The project has been refactored from a single monolithic `App.jsx` into a clean, maintainable file structure. All behavior is identical — this is a file organization refactor only.

```
src/
├── constants.js                  # All option arrays, storage keys, EMPTY_JOB
├── data/
│   └── sampleJobs.js             # Sample job data and createSampleJobs()
├── utils/
│   ├── dateUtils.js              # formatDate, formatDateTime, daysUntil, daysSince
│   ├── payUtils.js               # Pay parsing, hourly detection, salary estimation
│   ├── jobUtils.js               # hydrateJob, stale detection, status/priority helpers
│   ├── storageUtils.js           # loadJobs, loadCurrentFocus, loadTheme
│   └── csvUtils.js               # CSV parse/export, job description extraction
├── components/
│   ├── StatCard.jsx
│   ├── Field.jsx
│   ├── Info.jsx
│   └── modals/
│       ├── JobModal.jsx          # Add/edit application form
│       ├── DetailModal.jsx       # Read-only application snapshot
│       └── AboutModal.jsx        # About this app
├── App.jsx                       # Main app shell, state, routing between tabs
├── App.css
├── index.css
└── main.jsx
```

Companion extension:

```
job-tracker-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── icons/
└── README.md
```

---

## Tech Stack

- React 18
- Vite
- Vanilla JavaScript
- CSS (inline style tag, no external framework)
- localStorage for persistence

No backend. No database. No authentication. No build-time environment variables.

---

## Roadmap

The current app is a working, polished frontend tool. Future improvements may include:

**Near term**
- - Continue architecture cleanup by moving remaining state logic into custom hooks and splitting dashboard/application views into dedicated components
- Improve ATS-specific scraping in the extension for common employer application systems
- Add a documented test checklist for the app and extension

**Longer term**
- Optional backend API for cloud sync across devices
- Optional user authentication
- Optional database (Supabase, Firebase, or similar)
- React Native mobile companion app
- AI-assisted status updates from a connected job search inbox (opt-in only, with explicit privacy controls)
- AWS or similar cloud deployment for enterprise-grade hosting

---

## Sample Data

The app loads two sample applications on first use so new users can explore the tracker without adding their own data first.

Sample companies are always marked with `(SAMPLE)` in the company name. Delete or edit them any time. Restoring sample data is available in the Tools menu.

---

## Creator

Built by Michael O'Rourke.

[LinkedIn](https://linkedin.com/in/micorourke) · [GitHub](https://github.com/micorourke74/job-tracker)

---

## Support

Job Tracker is free. If it helps you stay organized during your search, you can support the project on Ko-fi.

[Support on Ko-fi](https://ko-fi.com/micorourke)

![Ko-fi promo](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Ko-Fi%20Promo.png)

---

## Notes

This is a frontend-only app. It does not require a backend, database, login system, or paid hosting. Each user's data stays on their own device and browser.
