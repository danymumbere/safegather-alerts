// js/app.js
import { incidentGeoJSON } from './data.js';
import { initIndexedDB, syncPendingReports, getPendingReports } from './offline.js';
import { initMiniMap, initFullMap, refreshMap } from './map.js';
import { showReportForm, handleReportSubmit } from './report.js';
import { showPendingReports, handlePendingReportAction } from './pending.js';
import { showSettings } from './settings.js';
import { showAboutPage } from './about.js';
import { emergencyQuickAlert } from './emergency-quick-alert.js';
import { showToast, toggleSection } from './ui.js';

// Correction des imports Leaflet
import L from 'leaflet';
import 'leaflet.markercluster';

// Initialisation de l'application
async function initApp() {
  try {
    // Initialisation de la base de données IndexedDB
    await initIndexedDB();

    // Initialisation des composants principaux
    initMiniMap();
    initFullMap();
    emergencyQuickAlert();

    // Chargement initial des données
    refreshMap();
    updateIncidentCount();
    showHomeDashboard();

    // Gestion des événements de navigation
    setupNavigation();

    // Vérification de la connexion et gestion hors ligne
    checkConnectivity();
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);

    // Synchronisation périodique des rapports en attente
    setInterval(syncPendingReports, 60000);
  } catch (error) {
    console.error('Erreur lors de l’initialisation de l’application :', error);
    showToast('Échec de l’initialisation. Vérifiez votre connexion.');
  }
}

// Gestion de la navigation entre les sections
function setupNavigation() {
  document.getElementById('btn-home').addEventListener('click', () => {
    showHomeDashboard();
    toggleSection('home');
  });

  document.getElementById('btn-report').addEventListener('click', () => {
    showReportForm();
    toggleSection('report');
  });

  document.getElementById('btn-map').addEventListener('click', () => {
    refreshMap();
    toggleSection('map');
  });

  document.getElementById('btn-pending').addEventListener('click', async () => {
    const pendingReports = await getPendingReports();
    showPendingReports(pendingReports);
    toggleSection('pending');
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    showSettings();
    toggleSection('settings');
  });

  document.getElementById('btn-about').addEventListener('click', () => {
    showAboutPage();
    toggleSection('about');
  });
}

// Affichage du tableau de bord d'accueil
function showHomeDashboard() {
  toggleSection('home');
  updateIncidentCount();
  refreshMiniMap();
}

// Mise à jour du compteur d'incidents
async function updateIncidentCount() {
  const count = await getIncidentCount();
  const incidentCountElement = document.getElementById('incident-count');
  if (incidentCountElement) {
    incidentCountElement.textContent = `${count} incident${count > 1 ? 's' : ''} signalé${count > 1 ? 's' : ''}`;
  }
}

// Récupération du nombre total d'incidents
async function getIncidentCount() {
  const db = await initIndexedDB();
  const tx = db.transaction(['incidents'], 'readonly');
  const store = tx.objectStore('incidents');
  return new Promise((resolve) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
  });
}

// Vérification de la connectivité réseau
function checkConnectivity() {
  const isOnline = navigator.onLine;
  const offlineNotice = document.getElementById('offline-notice');
  if (offlineNotice) {
    offlineNotice.style.display = isOnline ? 'none' : 'block';
  }
  if (!isOnline) {
    showToast('Mode hors ligne activé. Les données seront synchronisées ultérieurement.');
  }
}

// Initialisation de l'application au chargement
document.addEventListener('DOMContentLoaded', initApp);

// Gestion globale des erreurs non gérées
window.addEventListener('error', (event) => {
  console.error('Erreur non gérée :', event.error);
  showToast('Une erreur technique est survenue. Veuillez réessayer.');
});