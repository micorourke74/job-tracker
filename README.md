# Job Tracker

A simple browser-based job application tracker for staying organized through every job search.

Use the live app here: [Job Tracker](https://job-tracker-ten-self.vercel.app)

![Job Tracker promo card](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Promo%20Card.png)

Job Tracker helps job seekers keep applications, statuses, follow-ups, interviews, pay ranges, job listing links, application portals, notes, contacts, and resume versions in one clean place.

## Chrome Extension

Job Tracker also includes a Chrome extension called **Job Tracker Clipper**.

The extension helps save job listing details directly into the Job Tracker app. When you are viewing a job listing, click the extension and choose **Save this job**. The extension opens Job Tracker with key details filled in when available, including the company name, job title, location, pay range, work type, source, listing URL, and description.

The Chrome Web Store version is pending review. For now, advanced users can install the extension manually from this repository.

Manual install:

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `job-tracker-extension` folder.
6. Pin Job Tracker Clipper and use it on supported job boards.

![Job Tracker Clipper marquee promo](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Marquee%20Card.png)

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

## Features

- Add, edit, copy, and delete job applications
- Track application status
- Track priority level
- Save job listing links and application portal links
- Track follow-up dates and interview dates
- Estimate annual salary from hourly or salary pay ranges
- Store notes, summaries, contacts, and resume versions
- View dashboard metrics and job search insights
- Import and export CSV backups
- Use dark mode
- Store data locally in the browser
- Save job listings faster with the Chrome extension

## Data Storage

This app saves data locally in the user's browser using `localStorage`.

Your data is not uploaded to a server. If you clear your browser data, switch devices, or use a different browser, your saved applications may not appear unless you exported a CSV backup first.

Use the Tools menu to export a CSV backup regularly.

## Sample Data

The app includes sample job applications so new users can see how the tracker works.

Sample companies are marked with `(SAMPLE)` so they are easy to identify, edit, or delete.

## Run Locally

Install dependencies:

    npm install

Start the development server:

    npm run dev

Build for production:

    npm run build

Preview the production build:

    npm run preview

## Tech Stack

- React
- Vite
- JavaScript
- CSS
- localStorage

## Creator

Designed in React by Michael O'Rourke.

Connect with me on LinkedIn: https://linkedin.com/in/micorourke

## Support

Job Tracker is free to use. If this project helps you stay organized during your job search, you can support my current and future projects on Ko-fi.

[Support Michael O Projects on Ko-fi](https://ko-fi.com/micorourke)

![Support Michael O Projects on Ko-fi](https://raw.githubusercontent.com/micorourke74/job-tracker/main/Ko-Fi%20Promo.png)

## Notes

This is a frontend-only app. It does not require a backend, database, login system, or paid hosting to run.

Each user's job tracker data stays on their own device/browser.