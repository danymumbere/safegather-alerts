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
    try {
      this.ensureDOMStructure();
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

  ensureDOMStructure() {
    if (!document.getElementById('home-dashboard')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
<section data-feature="offline-support" id="offline-support" class="offline-banner" role="status" aria-live="polite">
  Mode hors ligne actif.u réseau.u réseau.
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
  <!-- Home Dashboard -->
  <section id="home-dashboard" data-feature="home-dashboard" class="view-section">
    <div class="card summary-card">
      <h2>Tableau de bord</h2>
      <p>Nombre total d’incidents recensés : <strong id="totalCount">0</strong></p>
      <div class="quick-actions">
        <button id="reportBtn" class="btn primary">Signaler un incident</button>
        <button id="mapBtn" class="btn secondary">Voir la carte complète</button>
      </div>
    </div>
    <div class="card mini-map-card">
      <h3>Aperçu récent</h3>
      <div id="mini-map-preview" class="mini-map" aria-label="Mini-carte des incidents récents"></div>
    </div>
    <div class="card emergency-card">
      <div data-feature="emergency-quick-alert">
        <button id="emergency-quick-alert-btn" class="btn emergency" aria-label="Alerte d’urgence rapide">Alerte Urgence Communautaire</button>
      </div>
    </div>
  </section>

  <!-- Incident Report Form -->
  <section id="incident-report-form" data-feature="incident-report-form" class="view-section" style="display:none;">
    <h2>Signaler un incident</h2>
    <form id="incident-form" novalidate>
      <div class="form-group">
        <label for="incident-type">Type d’incident *</label>
        <select id="incident-type" required>
          <option value="">Sélectionnez...</option>
          <option value="harassment">Harcèlement</option>
          <option value="threat">Menace</option>
          <option value="restriction">Restriction</option>
          <option value="other">Autre</option>
        </select>
      </div>
      <div class="form-group">
        <label for="incident-location">Lieu ou adresse *</label>
        <input type="text" id="incident-location" required placeholder="Ex. 12 rue de la Paix, Paris" />
        <button type="button" id="pick-location-btn" class="btn small">Utiliser ma position</button>
      </div>
      <div class="form-group">
        <label for="incident-description">Description optionnelle</label>
        <textarea id="incident-description" rows="4" placeholder="Détails de l’incident..."></textarea>
      </div>
      <div class="form-group">
        <label for="incident-photo">Photo optionnelle</label>
        <input type="file" id="incident-photo" accept="image/*" />
      </div>
      <button type="submit" class="btn primary">Soumettre le signalement</button>
    </form>
  </section>

  <!-- Real-time Map View -->
  <section id="real-time-map-view" data-feature="real-time-map-view" class="view-section" style="display:none;">
    <h2>Carte en temps réel</h2>
    <div id="full-map" class="full-map" aria-label="Carte interactive des signalements"></div>
    <div id="marker-detail" class="marker-detail-card" style="display:none;" aria-live="polite">
      <button id="close-detail-btn" class="close-btn" aria-label="Fermer les détails">×</button>
      <div id="marker-detail-content"></div>
      <div data-feature="share-incident">
        <button id="share-incident-btn" class="btn secondary">Partager</button>
      </div>
    </div>
  </section>

  <!-- Pending Reports Queue -->
  <section id="pending-reports-queue" data-feature="pending-reports-queue" class="view-section" style="display:none;">
    <h2>Signalements en attente de synchronisation</h2>
    <div id="pending-list" class="pending-list">
      <p>Aucun signalement en attente.</p>
    </div>
    <button id="sync-now-btn" class="btn primary">Synchroniser maintenant</button>
  </section>

  <!-- Settings & Privacy -->
  <section id="settings-and-privacy" data-feature="settings-and-privacy" class="view-section" style="display:none;">
    <h2>Réglages et Confidentialité</h2>
    <div class="form-group">
      <label>
        <input type="checkbox" id="notifications-toggle" /> Activer les notifications d’alerte
      </label>
    </div>
    <div class="form-group">
      <label>
        <input type="checkbox" id="contrast-toggle" /> Activer le mode haut contraste
      </label>
    </div>
    <div class="form-group">
      <label for="default-share-app">Application de partage par défaut</label>
      <select id="default-share-app">
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
      </select>
    </div>
    <div class="form-group">
      <button id="clear-storage-btn" class="btn danger">Effacer les données locales</button>
    </div>
  </section>

  <!-- About & Help -->
  <section id="about-and-help" data-feature="about-and-help" class="view-section" style="display:none;">
    <h2>À propos et Aide</h2>
    <p>SafeGather Alerts permet de signaler des incidents en toute sécurité, même hors ligne.</p>
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
console.log('App script loaded and init called');
