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
    this.initializeModules();
    this.updateDashboardStats();
    this.handleOfflineStatus();
    this.navigateTo('home-dashboard');
  },

  ensureDOMStructure() {
    if (!document.getElementById('home-dashboard')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
<section data-feature="offline-support" id="offline-support" class="offline-banner" style="display:none;" role="status" aria-live="polite">
  Mode hors ligne actif.
</section>
<header class="app-header">
  <h1>SafeGather Alerts</h1>
  <nav aria-label="Navigation principale">
    <button id="nav-home" class="nav-btn">Accueil</button>
    <button id="nav-report" class="nav-btn">Signaler</button>
    <button id="nav-map" class="nav-btn">Carte</button>
    <button id="nav-pending" class="nav-btn">En attente</button>
    <button id="nav-settings" class="nav-btn">Réglages</button>
    <button id="nav-about" class="nav-btn">Aide</button>
  </nav>
</header>
<main class="app-main">
  <section id="home-dashboard" data-feature="home-dashboard" class="view-section">
    <h2>Tableau de bord</h2>
    <p>Total: <strong id="totalCount">0</strong></p>
    <div id="mini-map-preview" style="height: 200px; background: #eee;"></div>
    <button id="reportBtn">Signaler</button>
    <button id="mapBtn">Carte</button>
    <button id="emergency-quick-alert-btn">Alerte</button>
  </section>
  <section id="incident-report-form" data-feature="incident-report-form" class="view-section" style="display:none;">
    <h2>Signaler</h2>
    <form id="incident-form"><input type="text" id="incident-location"><button type="submit">Envoyer</button></form>
  </section>
  <section id="real-time-map-view" data-feature="real-time-map-view" class="view-section" style="display:none;">
    <h2>Carte</h2>
    <div id="full-map"></div>
    <div id="marker-detail" style="display:none;"><button id="close-detail-btn">Fermer</button><div id="marker-detail-content"></div><div id="share-incident"><button id="share-incident-btn">Partager</button></div></div>
  </section>
  <section id="pending-reports-queue" data-feature="pending-reports-queue" class="view-section" style="display:none;">
    <h2>En attente</h2>
    <div id="pending-list"></div>
  </section>
  <section id="settings-and-privacy" data-feature="settings-and-privacy" class="view-section" style="display:none;">
    <h2>Réglages</h2>
  </section>
  <section id="about-and-help" data-feature="about-and-help" class="view-section" style="display:none;">
    <h2>Aide</h2>
  </section>
</main>`;
      while (wrapper.firstChild) {
        document.body.appendChild(wrapper.firstChild);
      }
    }
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
    document.body.addEventListener('click', (e) => {
      const target = e.target;
      if (target.id && target.id.startsWith('nav-')) {
        const sectionMap = { 'nav-home': 'home-dashboard', 'nav-map': 'real-time-map-view', 'nav-report': 'incident-report-form', 'nav-pending': 'pending-reports-queue', 'nav-settings': 'settings-and-privacy', 'nav-about': 'about-and-help' };
        const section = sectionMap[target.id];
        if (section) this.navigateTo(section);
      }
      if (target.id === 'close-detail-btn') {
        const d = document.getElementById('marker-detail');
        if (d) d.style.display = 'none';
      }
    });
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

if (document.readyState === 'loading') {
  window.addEventListener('load', () => window.App.init());
} else {
  window.App.init();
}
console.log('App script loaded and init called');
