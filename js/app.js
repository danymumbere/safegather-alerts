// js/app.js
import { incidentGeoJSON } from './data.js';
import { initIndexedDB, syncPendingReports, getIncidents } from './offline.js';
import { initMiniMap, initFullMap, refreshMap } from './map.js';
import { showReportForm, submitReport } from './report.js';
import { showPendingReports, deletePendingReport } from './pending.js';
import { shareIncident } from './share.js';
import { showSettings, toggleNotifications, toggleHighContrast } from './settings.js';
import { showAboutPage } from './about.js';
import { showToast, showOfflineBanner, hideOfflineBanner } from './ui.js';

// Sélecteurs HTML valides (basés sur les IDs du contrat)
const HOME_DASHBOARD_SELECTOR = '#home';
const INCIDENT_REPORT_FORM_SELECTOR = '#report';
const REAL_TIME_MAP_VIEW_SELECTOR = '#map';
const PENDING_REPORTS_QUEUE_SELECTOR = '#pending';
const SETTINGS_AND_PRIVACY_SELECTOR = '#settings';
const ABOUT_AND_HELP_SELECTOR = '#about';
const EMERGENCY_QUICK_ALERT_SELECTOR = '#emergency-quick-alert';

const MAIN_CONTENT_SELECTOR = '#main-content';
const NAV_HOME_SELECTOR = '#btn-home';
const NAV_REPORT_SELECTOR = '#btn-report';
const NAV_MAP_SELECTOR = '#btn-map';
const NAV_PENDING_SELECTOR = '#btn-pending';
const NAV_SETTINGS_SELECTOR = '#btn-settings';
const NAV_ABOUT_SELECTOR = '#btn-about';

let currentSection = 'home';

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initIndexedDB();
    initServiceWorker();
    initNavigation();
    initEmergencyAlert();
    initAccessibilityFeatures();
    showSection('home');
    initMiniMap();
    refreshMap();
    syncPendingReports();
    checkConnectivity();
  } catch (error) {
    showToast(`Erreur lors de l'initialisation : ${error.message}`);
    console.error('Erreur d’initialisation:', error);
  }
});

// Gestionnaire de navigation
function initNavigation() {
  document.querySelector(NAV_HOME_SELECTOR).addEventListener('click', () => showSection('home'));
  document.querySelector(NAV_REPORT_SELECTOR).addEventListener('click', () => showSection('report'));
  document.querySelector(NAV_MAP_SELECTOR).addEventListener('click', () => showSection('map'));
  document.querySelector(NAV_PENDING_SELECTOR).addEventListener('click', () => showSection('pending'));
  document.querySelector(NAV_SETTINGS_SELECTOR).addEventListener('click', () => showSection('settings'));
  document.querySelector(NAV_ABOUT_SELECTOR).addEventListener('click', () => showSection('about'));
}

// Affichage des sections
function showSection(section) {
  const mainContent = document.querySelector(MAIN_CONTENT_SELECTOR);
  mainContent.innerHTML = '';
  currentSection = section;

  switch (section) {
    case 'home':
      mainContent.innerHTML = `
        <div id="home">
          <div class="card">
            <h2>Tableau de bord</h2>
            <p id="incident-count">Incidents signalés : ${incidentGeoJSON.features.length}</p>
            <div id="mini-map" class="mini-map"></div>
            <button id="btn-report" class="btn-primary">Signaler un incident</button>
            <button id="btn-map" class="btn-secondary">Voir la carte complète</button>
          </div>
        </div>
      `;
      initMiniMap();
      attachHomeButtons();
      break;

    case 'report':
      mainContent.innerHTML = `<div id="report"><div id="incident-form"></div></div>`;
      showReportForm();
      break;

    case 'map':
      mainContent.innerHTML = `<div id="map"><div id="full-map" class="full-map"></div></div>`;
      initFullMap();
      refreshMap();
      break;

    case 'pending':
      mainContent.innerHTML = `<div id="pending"><div id="incident-table"></div></div>`;
      showPendingReports();
      break;

    case 'settings':
      mainContent.innerHTML = `<div id="settings"></div>`;
      showSettings();
      break;

    case 'about':
      mainContent.innerHTML = `<div id="about"></div>`;
      showAboutPage();
      break;
  }
}

// Attachement des boutons du dashboard
function attachHomeButtons() {
  document.querySelector('#btn-report').addEventListener('click', () => showSection('report'));
  document.querySelector('#btn-map').addEventListener('click', () => showSection('map'));
}

// Alerte d'urgence
function initEmergencyAlert() {
  const emergencyBtn = document.querySelector(EMERGENCY_QUICK_ALERT_SELECTOR);
  emergencyBtn.addEventListener('click', () => {
    const message = encodeURIComponent("🚨 ALERTE URGENCE 🚨 Menace immédiate détectée. Localisation : [vos coordonnées ici]. Partagez ce message immédiatement.");
    window.open(`https://wa.me/?text=${message}`, '_blank');
  });
}

// Accessibilité
function initAccessibilityFeatures() {
  const contrastToggle = document.querySelector('#toggle-contrast'); // Correction de l'ID
  if (contrastToggle) {
    contrastToggle.addEventListener('change', toggleHighContrast);
  }

  const notificationToggle = document.querySelector('#toggle-notifications');
  if (notificationToggle) {
    notificationToggle.addEventListener('change', toggleNotifications);
  }
}

// Service Worker
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker enregistré'))
      .catch(err => console.error('Échec enregistrement SW:', err));
  }
}

// Vérification de la connectivité
function checkConnectivity() {
  if (!navigator.onLine) {
    showOfflineBanner();
  }

  window.addEventListener('online', () => {
    hideOfflineBanner();
    syncPendingReports();
  });

  window.addEventListener('offline', () => {
    showOfflineBanner();
  });
}

// Gestion globale des erreurs
window.addEventListener('error', (e) => {
  showToast(`Erreur technique : ${e.message}`);
  console.error('Erreur capturée:', e);
});