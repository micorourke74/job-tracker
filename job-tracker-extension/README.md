# Job Tracker Clipper — Chrome Extension

A companion Chrome extension for the [Job Tracker app](https://job-tracker-ten-self.vercel.app/).

Open any job listing page, click the extension, and the job details are sent directly into your tracker — ready to review, edit, and save.

![Job Tracker Clipper marquee promo](https://raw.githubusercontent.com/micorourke74/job-tracker/main/job-tracker-extension/Marquee%20Card.png)

---

## How to install (developer load)

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `job-tracker-extension` folder
6. Pin **Job Tracker Clipper** to your toolbar for easy access

---

## How to use it

1. Navigate to any job listing page
2. Click the **Job Tracker Clipper** icon in the Chrome toolbar
3. Click **Save this job**
4. A new tab opens with the Job Tracker app — the job appears at the top of the Applications tab with a confirmation toast
5. Open the job to review, fill in missing fields, and save

---

## What gets extracted

When you click **Save this job**, the extension reads the active page and attempts to extract:

| Field | Source |
|---|---|
| Job title | Site-specific selector or page heading |
| Company name | Site-specific selector or schema.org metadata |
| Location | Site-specific selector or metadata |
| Pay range | Visible salary text, if present |
| Work type | Inferred from page text (Remote / Hybrid / On-site) |
| Job description | Visible description container, capped at ~3000 characters |
| Listing URL | Current page URL |
| Source | Inferred from hostname |

The extension only reads the active tab when you click the button. It does not run in the background and does not monitor your browsing.

---

## Supported sites

| Site | Support level |
|---|---|
| LinkedIn | ✅ Site-specific selectors |
| Indeed | ✅ Site-specific selectors |
| Greenhouse | ✅ Site-specific selectors |
| Lever | ✅ Site-specific selectors |
| Workday | ✅ Site-specific selectors |
| ZipRecruiter | ✅ Site-specific selectors |
| Glassdoor | ✅ Site-specific selectors (selected job panel) |
| All other sites | ✅ Generic extraction (schema.org, Open Graph tags, page heading, visible text) |

> Job board markup changes frequently. Site-specific extractors are a best-effort first pass. The extension always falls back to generic extraction if a specific selector returns nothing. Results may vary — always review the imported job and fill in any missing fields.

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
| Company | "Unknown Company" |
| Title | "Untitled Job Listing" |

---

## How the import works

The extension does not write to the app's localStorage directly. Instead it:

1. Extracts available job details from the active page
2. Encodes the data as a Unicode-safe base64 JSON payload
3. Opens the Job Tracker app with `?importJob=<payload>` in the URL
4. The app decodes the payload, creates a new job entry, and switches to the Applications tab
5. The URL is cleaned immediately with `window.history.replaceState` — refreshing will never duplicate the import
6. A `useRef` guard in the app prevents any double-import on re-render

Field trimming is applied before encoding to keep the URL a safe length:

| Field | Max length |
|---|---|
| Company | 120 characters |
| Title | 120 characters |
| Location | 120 characters |
| Pay range | 80 characters |
| Job listing URL | 500 characters |
| Summary | 500 characters |
| Job description | 3000 characters |

---

## Privacy

The extension does not collect, sell, or share user data. It reads visible page content only when you click **Save this job**. Extracted data is used solely to open the Job Tracker app with the job information ready for review. All saved job data lives in the user's own browser localStorage.

See [privacy.md](privacy.md) for the full privacy policy text.

---

## Files

```
job-tracker-extension/
├── manifest.json       # Manifest V3 config
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic: extraction trigger, encoding, tab open
├── content.js          # Page extraction script injected into the active tab
├── privacy.md          # Privacy policy
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

---

## Notes and limitations

- The extension reads the active tab only after you click **Save this job** — there is no background activity
- Glassdoor search pages show selected job header details but may not expose the full description reliably. If the description cannot be found safely, the extension uses a fallback note and links to the listing URL instead
- The job description is capped to keep the URL a reasonable length. Very long descriptions are trimmed automatically
- Always review the imported job in the tracker and fill in any fields the extension could not detect
