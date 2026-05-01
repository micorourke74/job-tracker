/**
 * Job Tracker Clipper — popup.js
 * Orchestrates extraction and handoff to the Job Tracker app.
 */

const APP_URL = "https://job-tracker-ten-self.vercel.app/";

const saveBtn = document.getElementById("saveBtn");
const openAppBtn = document.getElementById("openAppBtn");
const statusMsg = document.getElementById("statusMsg");
const previewCard = document.getElementById("previewCard");

// ─── Status helpers ──────────────────────────────────────────────────────────

function showStatus(msg, type = "info") {
  statusMsg.textContent = msg;
  statusMsg.className = `status-msg visible ${type}`;
}

function clearStatus() {
  statusMsg.className = "status-msg";
  statusMsg.textContent = "";
}

function setLoading(on) {
  if (on) {
    saveBtn.classList.add("loading");
    saveBtn.disabled = true;
  } else {
    saveBtn.classList.remove("loading");
    saveBtn.disabled = false;
  }
}

// ─── Preview card ────────────────────────────────────────────────────────────

function showPreview(job) {
  const tags = [];
  if (job.location) tags.push({ text: job.location, highlight: false });
  if (job.workType) tags.push({ text: job.workType, highlight: true });
  if (job.payRange) tags.push({ text: job.payRange, highlight: true });
  if (job.source) tags.push({ text: job.source, highlight: false });

  previewCard.classList.remove("empty");
  previewCard.innerHTML = `
    <div class="preview-title">${escHtml(job.title)}</div>
    <div class="preview-company">${escHtml(job.company)}</div>
    ${tags.length ? `<div class="preview-meta">${tags.map(t => `<span class="tag${t.highlight ? " highlight" : ""}">${escHtml(t.text)}</span>`).join("")}</div>` : ""}
  `;
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Encoding ────────────────────────────────────────────────────────────────

/**
 * Unicode-safe base64 encoding.
 * btoa() fails on non-Latin1 chars, so we encode via URI first.
 */
function encodePayload(obj) {
  const json = JSON.stringify(obj);
  // encodeURIComponent → escape → btoa is the classic Unicode-safe trick
  return btoa(unescape(encodeURIComponent(json)));
}

// ─── Main save flow ──────────────────────────────────────────────────────────

saveBtn.addEventListener("click", async () => {
  clearStatus();
  setLoading(true);

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      showStatus("Could not access the current tab.", "error");
      setLoading(false);
      return;
    }

    // Check for restricted pages (chrome://, etc.)
    const url = tab.url || "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      showStatus("Open a real job listing page first (not a browser page).", "error");
      setLoading(false);
      return;
    }

    // Inject and run content.js
    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch (err) {
      showStatus("Could not read this page. Try refreshing it.", "error");
      setLoading(false);
      return;
    }

    const job = results?.[0]?.result;

    if (!job || typeof job !== "object") {
      showStatus("Nothing useful found on this page.", "error");
      setLoading(false);
      return;
    }

    // Show preview
    showPreview(job);

    // Encode and open app
    const encoded = encodePayload(job);
    const importUrl = `${APP_URL}?importJob=${encoded}`;

    // Check URL length — warn if very long but proceed
    if (importUrl.length > 8000) {
      // Trim jobDescription and retry
      job.jobDescription = (job.jobDescription || "").slice(0, 800) + "…";
      const shortEncoded = encodePayload(job);
      const shortUrl = `${APP_URL}?importJob=${shortEncoded}`;
      chrome.tabs.create({ url: shortUrl });
    } else {
      chrome.tabs.create({ url: importUrl });
    }

    showStatus("Opening Job Tracker with extracted data…", "success");

  } catch (err) {
    showStatus(`Error: ${err.message || "Unknown error"}`, "error");
  } finally {
    setLoading(false);
  }
});

// ─── Open app button ─────────────────────────────────────────────────────────

openAppBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: APP_URL });
});
