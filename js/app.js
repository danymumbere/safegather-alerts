// js/app.js
// Main orchestrator for SafeGather Alerts.
// Handles navigation, global state, module initialization, and offline status.

import { incidentGeoJSON } from './data.js';
import { initIndexedDB, initOfflineSupport } from './offline.js';
import { initMiniMap, initFullMap } from './map.js';
import { initReport } from './report.js';
import { initShare } from './share.js';
import { initUI, showToast } from './ui.js';
import { initPending } from './pending.js';
import { initSettings } from './settings.js';
import { showAboutPage } from './about.js';
import { emergencyQuickAlert } from './emergency-quick-alert.js';

// Global application state
const appState = {
  currentSection: 'home',
  offline: !navigator.onLine,
  incidents: [],
  pendingIncidents: [],
};

/**
 * Navigate to a specific section, hiding others.
 * @param {string} sectionId - The ID of the section to show.
 */
function navigateTo(sectionId) {
  // Hide all known sections
  const sections = document.querySelectorAll('#home, #report, #map, #pending, #settings, #about');
  sections.forEach((el) => {
    el.style.display = 'none';
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.style.display = 'block';
    appState.currentSection = sectionId;
  }

  // Section‑specific initialization
  switch (sectionId) {
    case 'about':
      showAboutPage();
      break;
    case 'map':
      initFullMap();
      break;
    case 'pending':
      initPending();
      break;
    // Other sections are handled by their modules on load
  }
}

/**
 * Update the offline status banner.
 */
function updateOfflineBanner() {
  const banner = document.getElementById('offline-notice');
  if (!banner) return;
  const isOffline = !navigator.onLine;
  banner.style.display = isOffline ? 'block' : 'none';
/**
 * Initialize the application.
 */
async function initApp() {
  // Initialize offline support (IndexedDB, service worker, etc.)
  await initIndexedDB();
  initOfflineSupport();

  // Load initial incidents from the module data
  appState.incidents = incidentGeoJSON;

  // Initialize UI components (toasts, navigation, etc.)
  initUI();

  // Set up navigation links
  document.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('href').replace('#', '');
      navigateTo(section);
    });
  });

  // Show the home section by default
  navigateTo('home');

  // Start monitoring online/offline status
  window.addEventListener('online', () => {
    updateOfflineBanner();
    // Attempt to sync pending incidents when back online
    syncPendingIncidents();
  });
  window.addEventListener('offline', () => {
    updateOfflineBanner();
  });

  // Periodically update the offline banner (every 30 seconds)
  setInterval(updateOfflineBanner, 30000);

  // Initialize mini-map in the report section (if present)
  initMiniMap();

  // Initialize report module
  initReport();

  // Initialize share module
  initShare();

  // Initialize pending incidents module
  initPending();

  // Initialize settings module
  initSettings();

  // Initialize emergency quick alert button
  emergencyQuickAlert();

  // Show a welcome toast
  showToast('SafeGather Alerts is ready.');
}

/**
 * Sync pending incidents to the server when online.
 */
async function syncPendingIncidents() {
  const pending = appState.pendingIncidents;
  if (pending.length === 0) return;

  try {
    // Example fetch – adjust endpoint as needed
    const response = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pending),
    });

    if (response.ok) {
      // Clear pending incidents on successful submission
      appState.pendingIncidents = [];
// Démarrer l'application lorsque le DOM est prêt
import { incidentGeoJSON } from './data.js';
...
const appState = {
  currentSection: 'home',
  offline: !navigator.onLine,
  incidents: [],
  pendingIncidents: [],
};

/**
 * Naviguer vers une section spécifique...
 */
function navigateTo(sectionId) {
...
}

/**
 * Update the offline status banner.
 */
function updateOfflineBanner() {
  const banner = document.getElementById('offline-notice');
  if (!banner) return;
  const isOffline = !navigator.onLine;
  banner.style.display = isOffline ? 'block' : 'none';
/**
 * Initialize the application.
 */
async function initApp() {
...
  // Show a welcome toast
  showToast('SafeGather Alerts is ready.');
}

/**
 * Sync pending incidents to the server when online.
 */
async function syncPendingIncidents() {
...
}

// Start the app when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);