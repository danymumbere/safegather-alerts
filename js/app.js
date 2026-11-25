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
    console.log('App.init() started');
    try {
      if (!document.getElementById('home-dashboard')) {
        throw new Error('DOM structure not found: #home-dashboard missing');
      }
      this.setupEventListeners();
      this.initializeModules();
      this.updateDashboardStats();
      this.handleOfflineStatus();
      this.navigateTo('home-dashboard');
      console.log('App initialized successfully');
    } catch (e) {
      console.error('App initialization failed:', e);
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
      if (target.id === 'reportBtn') this.navigateTo('incident-report-form');
      if (target.id === 'mapBtn') this.navigateTo('real-time-map-view');
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
