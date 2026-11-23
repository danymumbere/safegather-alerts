import { incidentGeoJSON } from './data.js';
import { initOfflineSupport } from './offline.js';
import { initMiniMap, initFullMap } from './map.js';
import { initReportForm } from './report.js';
import { initShareHandlers } from './share.js';
import { showToast } from './ui.js';
import { initPendingQueue } from './pending.js';
import { initSettings } from './settings.js';
import { showAboutPage } from './about.js';
import { emergencyQuickAlert } from './emergency-quick-alert.js';

// Liste des sections principales pour la navigation
const SECTIONS = [
  'home-dashboard',
  'incident-report-form',
  'real-time-map-view',
  'pending-reports-queue',
  'settings-and-privacy',
  'about-and-help'
];

/**
 * Orchestrateur principal de l’application
 */
window.App = {
  init() {
    this.setupEventListeners();
    this.initializeModules();
    this.updateDashboardStats();
    this.handleOfflineStatus();
    this.navigateTo('home-dashboard');
  },

  // Navigation entre les sections
  navigateTo(sectionId) {
    SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = (id === sectionId) ? 'block' : 'none';
      }
    });

    // Initialisation spécifique lors de l’accès à la carte
    if (sectionId === 'real-time-map-view') {
      initFullMap();
    }
  },

  // Initialisation des modules importés
  initializeModules() {
    try {
      initOfflineSupport();
      initMiniMap();
      initReportForm();
      initPendingQueue();
      initSettings();
      showAboutPage();
      emergencyQuickAlert();
      initShareHandlers();
    } catch (error) {
      console.error('Erreur lors de l’initialisation des modules :', error);
      showToast('Erreur lors du chargement de l’application');
    }
  },

  // Configuration des écouteurs globaux
  setupEventListeners() {
    // Navigation principale
    const navHome = document.getElementById('nav-home');
    const navMap = document.getElementById('nav-map');
    const navReport = document.getElementById('nav-report');
    const closeDetailBtn = document.getElementById('close-detail-btn');

    if (navHome) navHome.addEventListener('click', () => this.navigateTo('home-dashboard'));
    if (navMap) navMap.addEventListener('click', () => this.navigateTo('real-time-map-view'));
    if (navReport) navReport.addEventListener('click', () => this.navigateTo('incident-report-form'));

    if (closeDetailBtn) {
      closeDetailBtn.addEventListener('click', () => {
        const detail = document.getElementById('marker-detail');
        if (detail) detail.style.display = 'none';
      });
    }

    if (closeDetailBtn) {
      closeDetailBtn.addEventListener('click', () => {
        const detail = document.getElementById('marker-detail');
        if (detail) detail.style.display = 'none';
      });
    }
  },

  // Mise à jour des statistiques sur le dashboard
  updateDashboardStats() {
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl && incidentGeoJSON.features) {
      totalCountEl.textContent = `${incidentGeoJSON.features.length}`;
    }
  },

  // Gestion de l’état hors ligne
  handleOfflineStatus() {
    const offlineBanner = document.getElementById('offline-support');
    const updateStatus = () => {
      if (offlineBanner) {
        offlineBanner.style.display = navigator.onLine ? 'none' : 'block';
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  },

  // Enregistrement du Service Worker
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(() => console.log('Service Worker enregistré avec succès.'))
          .catch(err => console.error('Échec de l’enregistrement du Service Worker :', err));
      });
    }
  }
};

// Lancement de l’application
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});