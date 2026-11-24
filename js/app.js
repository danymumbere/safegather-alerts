import { incidentGeoJSON } from './data.js';
import { initIndexedDB } from './offline.js';
import { initMiniMap, initFullMap } from './map.js';
import { showReportForm } from './report.js';
import { showPendingReports } from './pending.js';
import { initSettings } from './settings.js';
import { showAboutPage } from './about.js';
import { emergencyQuickAlert } from './emergency-quick-alert.js';

const SECTIONS = ['home-dashboard', 'incident-report-form', 'real-time-map-view', 'pending-reports-queue', 'settings-and-privacy', 'about-and-help'];

window.App = {
  init() {
    this.ensureDOMStructure();
    this.setupEventListeners();
  },

  ensureDOMStructure() {
    if (document.body.innerHTML.trim() === '') {
      document.body.innerHTML = `
        <section id="offline-support" style="display:none;">Mode hors ligne actif.</section>
        <header>
          <h1>SafeGather Alerts</h1>
          <nav>
            <button id="nav-home">Accueil</button>
            <button id="nav-report">Signaler</button>
            <button id="nav-map">Carte</button>
            <button id="nav-pending">En attente</button>
            <button id="nav-settings">Réglages</button>
            <button id="nav-about">Aide</button>
          </nav>
        </header>
        <main>
          <section id="home-dashboard"><h2>Tableau de bord</h2><p>Total: <span id="totalCount">0</span></p></section>
          <section id="incident-report-form" style="display:none;"><h2>Signaler</h2></section>
          <section id="real-time-map-view" style="display:none;"><h2>Carte</h2><div id="full-map"></div><div id="marker-detail" style="display:none;"><button id="close-detail-btn">Fermer</button><div id="marker-detail-content"></div><button id="share-incident-btn">Partager</button></div></section>
          <section id="pending-reports-queue" style="display:none;"><h2>En attente</h2><div id="pending-list"></div></section>
          <section id="settings-and-privacy" style="display:none;"><h2>Réglages</h2></section>
          <section id="about-and-help" style="display:none;"><h2>Aide</h2></section>
        </main>
      `;
    }
  },

  setupEventListeners() {
    this.initializeModules();
    this.updateDashboardStats();
    this.handleOfflineStatus();
    this.navigateTo('home-dashboard');
  },
  navigateTo(sectionId) {
    SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (id === sectionId) ? 'block' : 'none';
    });
    if (sectionId === 'real-time-map-view') initFullMap();
  },
  initializeModules() {
    try {
      initIndexedDB();
      initMiniMap();
      showReportForm();
      showPendingReports();
      initSettings();
      showAboutPage();
      emergencyQuickAlert();
    } catch (e) { console.error('Init error:', e); }
  },
  setupEventListeners() {
    const navs = { 'nav-home': 'home-dashboard', 'nav-map': 'real-time-map-view', 'nav-report': 'incident-report-form', 'nav-pending': 'pending-reports-queue', 'nav-settings': 'settings-and-privacy', 'nav-about': 'about-and-help' };
    Object.entries(navs).forEach(([id, section]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.navigateTo(section));
    });
    const closeBtn = document.getElementById('close-detail-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => { const d = document.getElementById('marker-detail'); if (d) d.style.display = 'none'; });
  },
  updateDashboardStats() {
    const el = document.getElementById('totalCount');
    if (el && incidentGeoJSON.features) el.textContent = incidentGeoJSON.features.length;
  },
  handleOfflineStatus() {
    const banner = document.getElementById('offline-support');
    const update = () => { if (banner) banner.style.display = navigator.onLine ? 'none' : 'block'; };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }
};
window.addEventListener('load', () => window.App.init());
