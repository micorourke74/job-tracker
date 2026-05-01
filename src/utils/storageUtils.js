import { STORAGE_KEY, FOCUS_STORAGE_KEY, THEME_STORAGE_KEY, DEFAULT_CURRENT_FOCUS } from "../constants.js";
import { createSampleJobs } from "../data/sampleJobs.js";
import { hydrateJob } from "./jobUtils.js";

export function loadJobs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createSampleJobs();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return createSampleJobs();
    return parsed.map(hydrateJob);
  } catch {
    return createSampleJobs();
  }
}

export function loadCurrentFocus() {
  try {
    return localStorage.getItem(FOCUS_STORAGE_KEY) || DEFAULT_CURRENT_FOCUS;
  } catch {
    return DEFAULT_CURRENT_FOCUS;
  }
}

export function loadTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
