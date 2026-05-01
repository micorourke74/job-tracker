# Job Tracker Clipper — Chrome Extension

A companion Chrome extension for the [Job Tracker app](https://job-tracker-ten-self.vercel.app/). Open any job listing page, click the extension, and the job is saved directly into your tracker.

Chrome Extension

The Chrome Web Store version is currently pending review. For now, advanced users can install the extension manually from this repository.

Manual install:
1. Download or clone this repository.
2. Open chrome://extensions.
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select the job-tracker-extension folder.
6. Pin Job Tracker Clipper and use it on supported job boards.

---

## What it does

1. You visit a job listing on any site (LinkedIn, Indeed, Workday, Greenhouse, Lever, ZipRecruiter, or any generic page).
2. You click the **Job Tracker Clipper** extension icon.
3. You click **Save this job**.
4. The extension reads the current page and extracts:
   - Job title
   - Company name
   - Location
   - Pay range (if visible)
   - Work type (Remote / Hybrid / On-site)
   - Job description (first ~3000 characters)
   - Job listing URL
   - Source (inferred from the site)
5. The extension opens your Job Tracker app with the extracted data encoded in the URL.
6. The app detects the `importJob` URL parameter, creates a new job entry, shows a toast notification, and switches to the Applications tab.
7. The URL is cleaned immediately — refreshing the page will **not** import the job again.

---

## How to load it locally in Chrome

1. Open **chrome://extensions** in Chrome.
2. Enable **Developer Mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `job-tracker-extension` folder from this project.
5. The **Job Tracker Clipper** icon will appear in your toolbar (pin it for easy access).

---

## How to use it

1. Navigate to any job listing page (e.g., a LinkedIn job post or a Workday job page).
2. Click the **Job Tracker Clipper** icon in the Chrome toolbar.
3. Click **Save this job**.
4. The popup shows a preview card with the extracted title, company, location, work type, and pay range.
5. A new tab opens with your Job Tracker app. The job appears at the top of the **Applications** tab with a "Job imported from extension ✓" toast.
6. Open the job to review, edit, or add notes.

---

## Supported job sites

| Site | Support level |
|---|---|
| LinkedIn | ✅ Site-specific selectors |
| Indeed | ✅ Site-specific selectors |
| Greenhouse | ✅ Site-specific selectors |
| Lever | ✅ Site-specific selectors |
| Workday | ✅ Site-specific selectors |
| ZipRecruiter | ✅ Site-specific selectors |
| All other sites | ✅ Generic extraction (schema.org, og tags, h1, visible text) |

> **Note:** Job board markup changes frequently. Site-specific extractors are a best-effort first pass. The extension always falls back to generic extraction if a specific selector returns nothing. Results may vary — always review the imported job and fill in any missing fields.

---

## Extraction defaults

When a field cannot be reliably extracted, these safe defaults are used:

| Field | Default |
|---|---|
| Status | Saved |
| Priority | Medium |
| Employment type | Full-time |
| Hours per week | 40 |
| Date applied | Today's date |
| Work type | On-site (or inferred from page text) |
| Source | Inferred from hostname |
| Company | "Unknown Company" (if not found) |
| Title | "Untitled Job Listing" (if not found) |

---

## Notes and limitations

- **Version 1** — generic extraction with basic site-specific rules. It works well on most pages but is not perfect on every layout.
- The extension only reads the active page when you click **Save this job** — it does not run in the background.
- The extension does not write to localStorage directly. It passes data via a URL parameter, and the React app handles saving.
- The job description is capped at ~3000 characters to keep the URL a reasonable length.
- If the URL is unusually long after encoding, the description is trimmed further automatically.
- Chrome Web Store publishing is optional and not included here. This is a local developer load only.

---

## Files

```
job-tracker-extension/
├── manifest.json       # Manifest V3 config
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic (extraction trigger, encoding, tab open)
├── content.js          # Page extraction script (injected into active tab)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

---

## App change (App.jsx)

A single `useEffect` was added to `App.jsx`. It:
- Runs once on mount
- Checks `URLSearchParams` for `importJob`
- Decodes the Unicode-safe base64 payload
- Creates a hydrated job using the app's existing `hydrateJob()` function
- Prepends it to the jobs list via `setJobs`
- Switches to the Applications tab
- Shows a toast: `"Job imported from extension ✓"`
- Cleans the URL with `window.history.replaceState` so refresh never duplicates
- Uses a `useRef` guard (`importedFromUrlRef`) to prevent any double-run

No existing features were removed or changed.
