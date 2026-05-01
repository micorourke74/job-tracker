/**
 * Job Tracker Clipper — content.js
 * Injected into the active tab via chrome.scripting.executeScript.
 * Returns an extracted job object to the popup via a resolved value.
 */

(function extractJob() {
  // ─── Utilities ──────────────────────────────────────────────────────────────

  function text(el) {
    return el ? el.innerText.trim() : "";
  }

  function attr(el, ...attrs) {
    if (!el) return "";
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v && v.trim()) return v.trim();
    }
    return "";
  }

  function q(selector) {
    return document.querySelector(selector);
  }

  function qq(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function first(...values) {
    for (const v of values) {
      const s = String(v || "").trim();
      if (s) return s;
    }
    return "";
  }

  function bodyText() {
    // Grab visible page text – limit to first 8000 chars to keep URL reasonable.
    const body = document.body ? document.body.innerText : "";
    return body.slice(0, 8000);
  }

  // ─── Pay inference ───────────────────────────────────────────────────────────

  function inferPayRange(str) {
    const s = String(str || "");
    const hourly = s.match(/\$\s*\d+(?:\.\d+)?\s*(?:–|-|to)\s*\$?\s*\d+(?:\.\d+)?\s*(?:\/\s*hr|per hour|hourly|\/hour)/i);
    if (hourly) return hourly[0].replace(/\s+/g, " ");
    const singleHourly = s.match(/\$\s*\d+(?:\.\d+)?\s*(?:\/\s*hr|per hour|hourly|\/hour)/i);
    if (singleHourly) return singleHourly[0].replace(/\s+/g, " ");
    const salary = s.match(/\$\s*\d{2,3},?\d{3}\s*(?:–|-|to)\s*\$?\s*\d{2,3},?\d{3}/i);
    if (salary) return salary[0].replace(/\s+/g, " ");
    const kRange = s.match(/\$?\s*\d{2,3}\s*[kK]\s*(?:–|-|to)\s*\$?\s*\d{2,3}\s*[kK]/i);
    if (kRange) return kRange[0].replace(/\s+/g, " ").toUpperCase();
    return "";
  }

  // ─── Work type inference ─────────────────────────────────────────────────────

  function inferWorkType(str) {
    const s = String(str || "").toLowerCase();
    if (s.includes("remote")) return "Remote";
    if (s.includes("hybrid")) return "Hybrid";
    if (s.includes("on-site") || s.includes("onsite") || s.includes("in office") || s.includes("in-office")) return "On-site";
    return "On-site";
  }

  // ─── Source inference from hostname ─────────────────────────────────────────

  function inferSource(hostname) {
    const h = String(hostname || "").toLowerCase();
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("indeed")) return "Indeed";
    if (h.includes("ziprecruiter")) return "ZipRecruiter";
    if (h.includes("glassdoor")) return "Glassdoor";
    if (h.includes("greenhouse")) return "Company Site";
    if (h.includes("lever")) return "Company Site";
    if (h.includes("workday")) return "Company Site";
    if (h.includes("myworkday")) return "Company Site";
    if (h.includes("icims")) return "Company Site";
    if (h.includes("taleo")) return "Company Site";
    if (h.includes("smartrecruiters")) return "Company Site";
    return "Other";
  }

  // ─── Trim long fields ────────────────────────────────────────────────────────

  function cap(str, max) {
    const s = String(str || "").trim();
    return s.length > max ? s.slice(0, max) + "…" : s;
  }

  // ─── Site-specific extractors ────────────────────────────────────────────────

  function extractLinkedIn() {
    const title =
      text(q("h1.top-card-layout__title")) ||
      text(q("h1.job-details-jobs-unified-top-card__job-title")) ||
      text(q("h1[class*='job-title']")) ||
      text(q(".jobs-unified-top-card__job-title h1")) ||
      "";

    const company =
      text(q("a.top-card-layout__company-url")) ||
      text(q(".job-details-jobs-unified-top-card__company-name a")) ||
      text(q("[class*='company-name']")) ||
      text(q(".jobs-unified-top-card__company-name")) ||
      "";

    const location =
      text(q(".top-card-layout__second-subline span")) ||
      text(q(".job-details-jobs-unified-top-card__bullet")) ||
      text(q("[class*='workplace-type']")) ||
      text(q(".jobs-unified-top-card__workplace-type")) ||
      "";

    const descEl = q(".jobs-description-content__text") || q(".description__text") || q("[class*='job-description']");
    const description = cap(text(descEl), 3000);
    const payRange = inferPayRange(description) || inferPayRange(bodyText());

    return { title, company, location, description, payRange };
  }

  function extractIndeed() {
    const title =
      text(q("h1.jobsearch-JobInfoHeader-title")) ||
      text(q("[class*='jobsearch-JobInfoHeader-title']")) ||
      text(q("h1[data-testid='jobsearch-JobInfoHeader-title']")) ||
      "";

    const company =
      text(q("[data-testid='inlineHeader-companyName'] a")) ||
      text(q("[data-company-name]")) ||
      attr(q("[data-company-name]"), "data-company-name") ||
      "";

    const location =
      text(q("[data-testid='job-location']")) ||
      text(q("[class*='JobInfoHeader-subtitle'] div")) ||
      "";

    const descEl = q("#jobDescriptionText") || q("[id*='jobDescription']");
    const description = cap(text(descEl), 3000);
    const payRange = inferPayRange(text(q("[class*='attribute_snippet']")) + " " + description);

    return { title, company, location, description, payRange };
  }

  function extractGreenhouse() {
    const title = text(q("h1.app-title")) || text(q(".job-post h1")) || text(q("h1")) || "";
    const company = text(q(".company-name")) || text(q("[class*='company']")) || "";
    const location = text(q(".location")) || text(q("[class*='location']")) || "";
    const descEl = q("#content") || q(".content") || q("[class*='job-description']");
    const description = cap(text(descEl), 3000);
    const payRange = inferPayRange(description);
    return { title, company, location, description, payRange };
  }

  function extractLever() {
    const title = text(q(".posting-headline h2")) || text(q("h2")) || "";
    const company = ""; // Lever pages are on company subdomains; fall back to domain
    const location = text(q(".posting-categories .location")) || text(q(".sort-by-location")) || "";
    const descEl = q(".posting-description") || q("[class*='posting']");
    const description = cap(text(descEl), 3000);
    const payRange = inferPayRange(description);
    return { title, company, location, description, payRange };
  }

  function extractWorkday() {
    const title =
      text(q("[data-automation-id='jobPostingHeader']")) ||
      text(q("[class*='jobPostingHeader']")) ||
      text(q("h1")) ||
      "";

    const company = ""; // Workday pages are on company domains; rely on domain fallback

    const location =
      text(q("[data-automation-id='locations']")) ||
      text(q("[class*='locationText']")) ||
      "";

    const descEl = q("[data-automation-id='jobPostingDescription']") || q("[class*='jobDescription']");
    const description = cap(text(descEl), 3000);
    const payRange = inferPayRange(description + " " + bodyText());
    return { title, company, location, description, payRange };
  }

  // ─── ZipRecruiter helpers ─────────────────────────────────────────────────

  /**
   * Returns true when the current path looks like a ZipRecruiter search-results
   * page ( /Jobs/<term>/-in-<location> ) rather than a single job-detail page.
   */
  function isZipRecruiterSearchPage() {
    return /\/Jobs\/.+\/-in-/i.test(window.location.pathname);
  }

  /**
   * ZipRecruiter two-pane layout: job list left, selected job detail right.
   *
   * From the screenshots, the right-pane detail header structure is:
   *   [employer logo img]
   *   <h1>IT Technician CL - 26</h1>           ← job title
   *   <a>United States District Court…</a>      ← company (teal link)
   *   <p>Orlando, FL • On-site</p>              ← location + work type
   *   [icon row: salary, employment type, benefits, posted]
   *   [job description section]
   *
   * PROBLEM with the previous approach: `q("h1")` returns the LEFT pane's
   * search-results heading ("School District Information Technology Jobs in
   * Orlando, FL") because it appears first in DOM order.
   *
   * FIX: anchor on the right-pane container first, then read fields from
   * within it.  We identify the right pane by finding the "Apply" button
   * (only present in the detail pane) or by known right-pane class fragments,
   * then walk up to the section/article/div container and read from there.
   *
   * Returns { title, company, location, payRange, description } or null.
   */
  function extractZipRecruiterDetailPane() {
    // ── Locate the right-pane container ─────────────────────────────────────
    // The Apply button only exists in the detail pane, making it a reliable anchor.
    const applyBtn =
      q("a[href*='apply' i][class*='apply' i]") ||
      q("button[class*='apply' i]") ||
      q("[data-testid*='apply' i]") ||
      q("a[aria-label*='apply' i]") ||
      null;

    // Walk up from the Apply button to find its section container.
    let paneRoot = null;
    if (applyBtn) {
      let el = applyBtn.parentElement;
      // Walk up at most 8 levels to find a substantial container.
      for (let i = 0; i < 8 && el && el !== document.body; i++) {
        if (el.tagName === "SECTION" || el.tagName === "ARTICLE" ||
            el.tagName === "MAIN" ||
            (el.tagName === "DIV" && el.children.length >= 3)) {
          paneRoot = el;
          break;
        }
        el = el.parentElement;
      }
    }

    // Fallback: look for right-pane class fragments ZipRecruiter has used.
    if (!paneRoot) {
      paneRoot =
        q("[class*='job_details_pane']") ||
        q("[class*='jobDetails']") ||
        q("[class*='detail_pane']") ||
        q("[class*='rightPane']") ||
        q("[class*='right_pane']") ||
        q("main") ||
        null;
    }

    // If still no container, bail — we'd just be reading the whole page.
    if (!paneRoot) return null;

    const pq = (sel) => paneRoot.querySelector(sel);
    const ptext = (el) => el ? el.innerText.trim() : "";

    // ── Title ────────────────────────────────────────────────────────────────
    // Look for h1 *within* the pane root, not the global first h1.
    const title =
      ptext(pq("h1")) ||
      ptext(pq("h2")) ||
      "";
    if (!title) return null;

    // ── Company ──────────────────────────────────────────────────────────────
    // The company name is a teal/styled anchor near the top of the pane.
    // Its href on ZipRecruiter is typically the company profile path.
    // We try the most specific selectors first, then broader anchors near h1.
    const titleEl = pq("h1") || pq("h2");
    let company =
      ptext(pq("[class*='hiring_company']")) ||
      ptext(pq("[class*='companyName']")) ||
      ptext(pq("[class*='company_name']")) ||
      ptext(pq("[class*='employer']")) ||
      "";

    // If class-based search failed, look for the anchor that appears
    // immediately after the h1/h2 in the pane header.
    if (!company && titleEl) {
      // Try next sibling elements of the title
      let sib = titleEl.nextElementSibling;
      for (let i = 0; i < 4 && sib; i++) {
        const a = sib.tagName === "A" ? sib : sib.querySelector("a");
        if (a) {
          const t = ptext(a);
          // A company name: not a URL, not too short, not "Apply", not location-like
          if (t.length >= 3 && !t.match(/^(apply|save|share|back)$/i) && !t.match(/^\$/) && !t.match(/,\s*[A-Z]{2}$/)) {
            company = t;
            break;
          }
        }
        sib = sib.nextElementSibling;
      }
    }

    // Last resort: any anchor in the pane whose text looks like an org name
    if (!company) {
      const anchors = Array.from(paneRoot.querySelectorAll("a"));
      for (const a of anchors) {
        const t = ptext(a);
        if (t.length >= 4 && t.length <= 80 &&
            !t.match(/^(apply|save|share|back|search|home|sign|log)/i) &&
            !t.match(/^\$/) && !t.match(/^\d/) &&
            !t.includes("ziprecruiter.com") && !t.includes("Jobs/")) {
          company = t;
          break;
        }
      }
    }

    // ── Location ─────────────────────────────────────────────────────────────
    let location =
      ptext(pq("[class*='job_location']")) ||
      ptext(pq("[class*='jobLocation']")) ||
      ptext(pq("[class*='location_text']")) ||
      ptext(pq("[class*='location']")) ||
      "";

    // Fallback: scan siblings of title for "City, ST" or "City, ST • Work-type"
    if (!location && titleEl) {
      let sib = titleEl.nextElementSibling;
      for (let i = 0; i < 6 && sib; i++) {
        const t = ptext(sib);
        if (t.includes(",") && /[A-Z]{2}/.test(t) && t.length < 80 && !t.includes("\n")) {
          location = t;
          break;
        }
        sib = sib.nextElementSibling;
      }
    }

    // Strip work-type suffix: "Orlando, FL • On-site" → "Orlando, FL"
    location = location.replace(/\s*[·•]\s*(Remote|Hybrid|On-site|Onsite).*/i, "").trim();

    // ── Pay range ────────────────────────────────────────────────────────────
    const payText =
      ptext(pq("[class*='salary']")) ||
      ptext(pq("[class*='compensation']")) ||
      ptext(pq("[aria-label*='salary' i]")) ||
      ptext(pq("[aria-label*='pay' i]")) ||
      "";
    // Also scan icon-row list items for a "$" value
    let payRange = inferPayRange(payText);
    if (!payRange) {
      const items = Array.from(paneRoot.querySelectorAll("li, [class*='attribute'], [class*='detail']"));
      for (const item of items) {
        const t = ptext(item);
        const p = inferPayRange(t);
        if (p) { payRange = p; break; }
      }
    }

    // ── Description ──────────────────────────────────────────────────────────
    const descEl =
      pq("[class*='jobDescriptionSection']") ||
      pq("[class*='job_description']") ||
      pq("[id*='job-desc']") ||
      pq("[class*='JobDescription']") ||
      null;
    const description = cap(ptext(descEl), 3000);

    return { title, company, location, payRange, description };
  }

  function extractZipRecruiter() {
    // ── Search-results / two-pane page ───────────────────────────────────────
    if (isZipRecruiterSearchPage()) {
      const bText = bodyText();
      const cleanedDocTitle = document.title
        .replace(/\s*[|]\s*ZipRecruiter.*$/i, "")
        .replace(/\s*[-–]\s*ZipRecruiter.*$/i, "")
        .trim() || "ZipRecruiter Search Results";

      // PRIMARY: extract the already-open right-pane job detail.
      const pane = extractZipRecruiterDetailPane();

      if (pane && pane.title) {
        return {
          title: pane.title,
          company: pane.company || "Unknown Company",
          location: pane.location || "",
          payRange: pane.payRange || inferPayRange(bText),
          description: pane.description
            ? cap(pane.description, 3000)
            : cap("Imported from ZipRecruiter. Open the listing link for full details.\n\n" + bText, 3000),
          // isSearchPage intentionally NOT set when we have a real pane result —
          // the data is specific enough that we don't need the warning summary.
        };
      }

      // FALLBACK: pane didn't render (JS not loaded, etc.) — safe placeholder.
      return {
        title: cleanedDocTitle,
        company: "Unknown Company",
        location: "",
        payRange: inferPayRange(bText),
        description: cap(
          "Imported from a ZipRecruiter search results page. Open a specific job listing for cleaner company, title, and description details.\n\n" + bText,
          3000
        ),
        isSearchPage: true,
      };
    }

    // ── Single job-detail page (unchanged behaviour) ─────────────────────────
    const title = text(q("h1.job_title")) || text(q("h1[class*='title']")) || text(q("h1")) || "";
    const company = text(q("a.job_details_link")) || text(q("[class*='hiring_company_text']")) || "";
    const location = text(q("[class*='location_text']")) || text(q("[class*='location']")) || "";
    const descEl = q("[class*='jobDescriptionSection']") || q("[id*='job-desc']");
    const description = cap(text(descEl), 3000);
    const payRange = inferPayRange(text(q("[class*='salary']")) + " " + description);
    return { title, company, location, description, payRange };
  }

// ─── Glassdoor helpers ─────────────────────────────────────────────────────

function isGlassdoorSearchPage() {
  return /\/Job\//i.test(window.location.pathname) || window.location.href.includes("glassdoor.com/Job/");
}

function looksLikeGlassdoorSearchHeading(str) {
  const s = String(str || "").trim().toLowerCase();
  return (
    /\d+\s+.+\s+jobs?\s+in\s+/.test(s) ||
    s.includes("jobs in ") ||
    s.includes("job search") ||
    s.includes("glassdoor")
  );
}

function cleanGlassdoorText(str) {
  return String(str || "")
    .replace(/\s+/g, " ")
    .replace(/\s*[·•]\s*/g, " • ")
    .trim();
}

function cleanGlassdoorLocation(str) {
  const s = cleanGlassdoorText(str);
  const match = s.match(/[A-Za-z .'-]+,\s*[A-Z]{2}/);
  return match ? match[0].trim() : s.replace(/\s*•\s*(Remote|Hybrid|On-site|Onsite).*/i, "").trim();
}

function extractGlassdoorDetailPane() {
  const fullText = document.body ? document.body.innerText : "";
  const lines = fullText
    .split("\n")
    .map((line) => cleanGlassdoorText(line))
    .filter(Boolean);

  function isJunkLine(line) {
    const s = String(line || "").trim().toLowerCase();

    return (
      !s ||
      s === "glassdoor" ||
      s === "jobs" ||
      s === "companies" ||
      s === "salaries" ||
      s === "community" ||
      s === "search" ||
      s === "for you" ||
      s === "most relevant" ||
      s === "create job alert" ||
      s === "save" ||
      s === "share" ||
      s === "apply" ||
      s === "apply on employer site" ||
      s === "your qualifications for this job" ||
      s === "is your resume a good match?" ||
      s.includes("easy apply only") ||
      s.includes("remote only") ||
      s.includes("company rating") ||
      s.includes("date posted") ||
      s.includes("salary range") ||
      s.includes("to restore your access") ||
      s.includes("write a review") ||
      s.includes("add a salary") ||
      s.includes("use ai to find out") ||
      s.includes("get insights") ||
      looksLikeGlassdoorSearchHeading(s)
    );
  }

  function isLocationLine(line) {
    return /^[A-Za-z .'-]+,\s*[A-Z]{2}$/.test(String(line || "").trim());
  }

  function isRatingOnly(line) {
    return /^\d+(\.\d+)?\s*★?$/.test(String(line || "").trim());
  }

  function cleanCompanyLine(line) {
    return cleanGlassdoorText(line)
      .replace(/\s+\d+(\.\d+)?\s*★?$/i, "")
      .trim();
  }

  function isGoodCompanyLine(line, title) {
    const cleaned = cleanCompanyLine(line);
    const lower = cleaned.toLowerCase();

    return (
      cleaned.length >= 2 &&
      cleaned.length <= 90 &&
      cleaned !== title &&
      lower !== "glassdoor" &&
      !isJunkLine(cleaned) &&
      !isRatingOnly(cleaned) &&
      !/^\$/.test(cleaned) &&
      !isLocationLine(cleaned)
    );
  }

  function isGoodTitleLine(line) {
    const cleaned = cleanGlassdoorText(line);
    const lower = cleaned.toLowerCase();

    return (
      cleaned.length >= 4 &&
      cleaned.length <= 140 &&
      lower !== "glassdoor" &&
      !isJunkLine(cleaned) &&
      !isRatingOnly(cleaned) &&
      !/^\$/.test(cleaned) &&
      !isLocationLine(cleaned)
    );
  }

  // Prefer the selected job's real apply button, not "Easy Apply" chips in the left list.
  let applyIndex = lines.findIndex((line) =>
    /^apply on employer site$/i.test(line) || /^apply$/i.test(line)
  );

  if (applyIndex === -1) {
    applyIndex = lines.findIndex((line) =>
      /^apply/i.test(line) && !/^easy apply/i.test(line)
    );
  }

  // If Glassdoor did not expose a usable apply line, fall back safely.
  if (applyIndex === -1) {
    return null;
  }

  const beforeApply = lines
    .slice(Math.max(0, applyIndex - 12), applyIndex)
    .filter((line) => !isJunkLine(line));

  let payRange = "";
  let location = "";
  let title = "";
  let company = "";

  // Pay should come from the selected detail header, usually right before Apply.
  for (let i = beforeApply.length - 1; i >= 0; i--) {
    const p = inferPayRange(beforeApply[i]);
    if (p) {
      payRange = p;
      break;
    }
  }

  // Location is usually right before pay.
  for (let i = beforeApply.length - 1; i >= 0; i--) {
    if (isLocationLine(beforeApply[i])) {
      location = cleanGlassdoorLocation(beforeApply[i]);
      break;
    }
  }

  // Title is usually the nearest good line before location/pay.
  const headerCandidates = beforeApply.filter((line) => {
    const cleaned = cleanGlassdoorText(line);
    return (
      isGoodTitleLine(cleaned) &&
      !inferPayRange(cleaned) &&
      cleaned !== location
    );
  });

  if (headerCandidates.length) {
    // In Glassdoor's selected detail header, company usually appears before title.
    // So the last useful candidate before location/pay is usually the job title.
    title = headerCandidates[headerCandidates.length - 1] || "";
  }

  if (title) {
    const titleIndex = beforeApply.lastIndexOf(title);

    for (let i = titleIndex - 1; i >= 0; i--) {
      const possibleCompany = cleanCompanyLine(beforeApply[i]);
      if (isGoodCompanyLine(possibleCompany, title)) {
        company = possibleCompany;
        break;
      }
    }
  }

  // Extra fallback for company: use the line directly before the title after stripping rating.
  if (!company && title) {
    const titleIndex = beforeApply.lastIndexOf(title);
    if (titleIndex > 0) {
      const possibleCompany = cleanCompanyLine(beforeApply[titleIndex - 1]);
      if (isGoodCompanyLine(possibleCompany, title)) {
        company = possibleCompany;
      }
    }
  }

    // Description: Glassdoor search pages do not always expose the selected
  // job's full description in a reliable container. If a real description
  // cannot be found, use a safe fallback instead of grabbing unrelated page text.
  const descEl =
    q("[data-test*='description']") ||
    q("[class*='jobDescription']") ||
    q("[class*='JobDescription']") ||
    q("[id*='JobDescription']") ||
    q("[class*='job-description']") ||
    null;

  let description = cap(text(descEl), 3000);

  if (!description || description.length < 40) {
    description = "Imported from Glassdoor. Open the listing link to review the full job description.";
  }

    let workType = "";

  const headerText = beforeApply.join(" ");
  if (/\bhybrid\b/i.test(headerText)) {
    workType = "Hybrid";
  } else if (/\bremote\b/i.test(headerText)) {
    workType = "Remote";
  } else if (/\bon-site\b|\bonsite\b|\bin office\b|\bin-office\b/i.test(headerText)) {
    workType = "On-site";
  } else {
    workType = "On-site";
  }

  return {
    title,
    company,
    location,
    payRange,
    workType,
    description,
  };
}

function extractGlassdoorSelectedCardFallback() {
  const cards = Array.from(document.querySelectorAll("li, article, div"))
    .map((el) => {
      const t = cleanGlassdoorText(el.innerText || "");
      return { el, t };
    })
    .filter(({ t }) =>
      t.length >= 40 &&
      t.length <= 1200 &&
      !looksLikeGlassdoorSearchHeading(t) &&
      (t.match(/\$\s*\d+/) || t.match(/[A-Za-z .'-]+,\s*[A-Z]{2}/))
    );

  if (!cards.length) return null;

  const best = cards[0];
  const lines = (best.el.innerText || "")
    .split("\n")
    .map((x) => cleanGlassdoorText(x))
    .filter(Boolean);

  let company = "";
  let title = "";
  let location = "";
  let payRange = inferPayRange(best.t);

  for (const line of lines) {
    const cleaned = line.replace(/\s+\d+(\.\d+)?\s*★?$/i, "").trim();

    if (!company && cleaned.length <= 80 && !/^\$/.test(cleaned) && !/^[A-Za-z .'-]+,\s*[A-Z]{2}$/.test(cleaned)) {
      company = cleaned;
      continue;
    }

    if (!title && cleaned.length <= 120 && cleaned !== company && !/^\$/.test(cleaned) && !/^[A-Za-z .'-]+,\s*[A-Z]{2}$/.test(cleaned)) {
      title = cleaned;
      continue;
    }

    if (!location && /^[A-Za-z .'-]+,\s*[A-Z]{2}$/.test(cleaned)) {
      location = cleaned;
    }
  }

  return {
    title,
    company,
    location,
    payRange,
    description: cap(best.t, 3000),
  };
}

function extractGlassdoor() {
  const pane = extractGlassdoorDetailPane();

  if (
    pane &&
    pane.title &&
    !looksLikeGlassdoorSearchHeading(pane.title) &&
    pane.title !== "Untitled Glassdoor Job Listing"
  ) {
        return {
      title: pane.title,
      company: pane.company || "Unknown Company",
      location: pane.location || "",
      payRange: pane.payRange || "",
      workType: pane.workType || "On-site",
      description: pane.description || "",
    };
  }

  const card = extractGlassdoorSelectedCardFallback();

  if (
    card &&
    card.title &&
    !looksLikeGlassdoorSearchHeading(card.title) &&
    card.title !== "Untitled Glassdoor Job Listing"
  ) {
        return {
      title: card.title,
      company: card.company || "Unknown Company",
      location: card.location || "",
      payRange: card.payRange || "",
      workType: "On-site",
      description: card.description || "",
    };
  }

  return {
    title: "",
    company: "",
    location: "",
    payRange: inferPayRange(bodyText()),
    description: cap("Imported from Glassdoor. The extension could not reliably identify the selected job card. Review the listing manually.\n\n" + bodyText(), 3000),
    summary: "Imported from Glassdoor, but the selected job details could not be read cleanly. Review the imported details before saving.",
    isSearchPage: true,
  };
}

  // ─── Generic fallback ────────────────────────────────────────────────────────

  function extractGeneric() {
    // Title: try structured data, og tags, h1, then document.title
    const ogTitle = attr(q("meta[property='og:title']"), "content");
    const h1 = text(q("h1"));
    const docTitle = document.title;

    // Company: try schema.org, og:site_name, or domain name
    const schemaCompany = attr(q("[itemprop='hiringOrganization'] [itemprop='name']"), "content") ||
      text(q("[itemprop='hiringOrganization'] [itemprop='name']"));
    const ogSite = attr(q("meta[property='og:site_name']"), "content");

    // Location: try schema.org, labeled elements, then text near "location"
    const schemaLocation =
      attr(q("[itemprop='jobLocation'] [itemprop='name']"), "content") ||
      text(q("[itemprop='jobLocation'] [itemprop='name']")) ||
      text(q("[itemprop='addressLocality']")) ||
      "";

    // Description: try schema.org, article/section, or big text block
    const schemaDesc = attr(q("[itemprop='description']"), "content") || text(q("[itemprop='description']"));
    const articleDesc = text(q("article")) || text(q("[class*='description']")) || text(q("[class*='Details']"));
    const description = cap(schemaDesc || articleDesc, 3000);

    const bText = bodyText();
    const payRange = inferPayRange(bText);

    return {
      title: first(h1, ogTitle, docTitle),
      company: first(schemaCompany, ogSite),
      location: schemaLocation,
      description,
      payRange,
    };
  }

  // ─── Main extraction ─────────────────────────────────────────────────────────

  const hostname = window.location.hostname;
  const url = window.location.href;
  const bText = bodyText();

  let extracted = {};

    if (hostname.includes("linkedin.com")) {
    extracted = extractLinkedIn();
  } else if (hostname.includes("indeed.com")) {
    extracted = extractIndeed();
  } else if (hostname.includes("greenhouse.io")) {
    extracted = extractGreenhouse();
  } else if (hostname.includes("lever.co")) {
    extracted = extractLever();
  } else if (hostname.includes("workday.com") || hostname.includes("myworkday.com")) {
    extracted = extractWorkday();
  } else if (hostname.includes("ziprecruiter.com")) {
    extracted = extractZipRecruiter();
  } else if (hostname.includes("glassdoor.com")) {
    extracted = extractGlassdoor();
  } else {
    extracted = extractGeneric();
  }

  // ─── Supplement with generic if site-specific left gaps ─────────────────────

  const generic = extractGeneric();
  const isGlassdoor = hostname.includes("glassdoor.com");

  const title = isGlassdoor
    ? first(extracted.title, "Untitled Glassdoor Job Listing")
    : first(extracted.title, generic.title, document.title, "Untitled Job Listing");

  const company = isGlassdoor
    ? first(extracted.company, "Unknown Company")
    : first(extracted.company, generic.company, "Unknown Company");

  const location = first(extracted.location, generic.location);

  const description = first(extracted.description, generic.description);

  const payRange = first(extracted.payRange, generic.payRange, inferPayRange(bText));

  const workType = extracted.workType || inferWorkType(description + " " + location + " " + bText);

  const source = inferSource(hostname);

  const today = new Date().toISOString().slice(0, 10);

  // Clean up company/title: strip trailing site/page title artifacts.
  function cleanTitle(str) {
    return String(str || "").replace(/\s*[\|\-–—]\s*.{0,40}$/, "").trim();
  }

  const cleanedTitle = cleanTitle(title);

  const rawCompany = cleanTitle(company);

  const cleanedCompany =
    ["ziprecruiter", "glassdoor"].includes(rawCompany.toLowerCase())
      ? "Unknown Company"
      : rawCompany;

  const isSearchPage = Boolean(extracted.isSearchPage);

  const summary = extracted.summary
    ? extracted.summary
    : isSearchPage
      ? `Imported from a ${source} search results page. Open a specific job listing before relying on the extracted details.`
      : "";

  return {
    title: cleanedTitle || "Untitled Job Listing",
    company: cleanedCompany || "Unknown Company",
    location: cap(location, 120),
    payRange: cap(payRange, 80),
    workType,
    source,
    jobListing: url,
    jobDescription: cap(description, 3000),
    summary,
    status: "Saved",
    priority: "Medium",
    employmentType: "Full-time",
    hoursPerWeek: "40",
    dateApplied: today,
  };
})();
