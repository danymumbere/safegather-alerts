// js/app.js
// Module principal : Orchestrateur de l’application, gestion de la navigation, état global et initialisation.

import { INCIDENTS } from "./data.js";
import { initIndexedDB, getIncidents, saveIncident } from "./offline.js";
import { initMiniMap, initFullMap, refreshMap } from "./map.js";
import { initReportForm, renderPendingList, submitReport } from "./report.js";
import { showToast, toggleHighContrast, clearLocalData } from "./ui.js";
import { shareIncident } from "./share.js";

// ---------------------------------------------------------------------------
// État global et configuration
// ---------------------------------------------------------------------------
export let isOnline = navigator.onLine;
let currentSection = "home";

// ---------------------------------------------------------------------------
// Initialisation de l’application
// ---------------------------------------------------------------------------
async function initApp() {
  try {
    // Enregistrement du Service Worker pour le support hors-ligne
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("./sw.js");
    }

    // Initialisation de la base de données locale
    await initIndexedDB();

    // Configuration des écouteurs et de la navigation
    setupNavigation();
    setupNetworkListeners();
    setupGlobalActions();
    setupSettings();

    // Initialisation des modules spécifiques
    initReportForm();

    // Affichage initial
    navigateTo("home");
    updateHomeDashboard();
  } catch (err) {
    console.error("Initialisation échouée :", err);
    showToast("Erreur lors du démarrage de l’application.");
  }
}

// ---------------------------------------------------------------------------
// Gestion de la navigation entre sections
// ---------------------------------------------------------------------------
function navigateTo(sectionId) {
  const sections = ["home", "report", "map", "pending", "settings", "about"];
  
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = id === sectionId ? "block" : "none";
      el.setAttribute("aria-hidden", id !== sectionId);
    }
  });

  currentSection = sectionId;

  // Logique spécifique par section
  if (sectionId === "map") {
    initFullMap();
    refreshMap();
  } else if (sectionId === "pending") {
    renderPendingList();
  } else if (sectionId === "home") {
    updateHomeDashboard();
  }
}

function setupNavigation() {
  // Navigation vers le formulaire de rapport
  const btnReport = document.getElementById("btn-report");
  if (btnReport) {
    btnReport.addEventListener("click", () => navigateTo("report"));
  }

  // Navigation vers la carte complète
  const btnViewMap = document.getElementById("btn-view-map");
  if (btnViewMap) {
    btnViewMap.addEventListener("click", () => navigateTo("map"));
  }

  // Navigation vers les paramètres
  const btnSettings = document.getElementById("btn-accessibility"); // Utilisation de l'ID correct
  if (btnSettings) {
    btnSettings.addEventListener("click", () => navigateTo("settings"));
  }
}

// ---------------------------------------------------------------------------
// Mise à jour du Dashboard (Home)
// ---------------------------------------------------------------------------
async function updateHomeDashboard() {
  try {
    const incidents = await getIncidents();
    const total = incidents.length + INCIDENTS.length;
    
    const countEl = document.getElementById("total-incidents");
    if (countEl) {
      countEl.textContent = `${total} incidents signalés`;
    }
    
    initMiniMap();
  } catch (err) {
    console.error("Erreur lors de la mise à jour du dashboard :", err);
  }
}

// ---------------------------------------------------------------------------
// Gestion du réseau et état hors-ligne
// ---------------------------------------------------------------------------
function setupNetworkListeners() {
  const updateStatus = () => {
    isOnline = navigator.onLine;
    const banner = document.getElementById("offline-banner");
    
    if (banner) {
      banner.style.display = isOnline ? "none" : "block";
    }
    
    if (!isOnline) {
      showToast("Mode hors-ligne activé. Vos rapports seront mis en file d’attente.");
    } else {
      showToast("Connexion rétablie.");
    }
  };

  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  
  updateStatus();
}

// ---------------------------------------------------------------------------
// Actions globales (Emergency, etc.)
// ---------------------------------------------------------------------------
function setupGlobalActions() {
  // Alerte d’urgence : partage rapide via WhatsApp
  const emergencyBtn = document.getElementById("quick-alert-btn");
  if (emergencyBtn) {
    emergencyBtn.addEventListener("click", () => {
      const message = encodeURIComponent("🚨 ALERTE URGENTE 🚨\nIncident immédiat signalé via SafeGather Alerts.\nVérifiez la carte pour les détails.");
      window.open(`https://wa.me/?text=${message}`, "_blank");
    });
  }
}

// ---------------------------------------------------------------------------
// Configuration des paramètres
// ---------------------------------------------------------------------------
function setupSettings() {
  // Basculer le contraste élevé
  const highContrastToggle = document.getElementById("high-contrast-toggle");
  if (highContrastToggle) {
    highContrastToggle.addEventListener("change", toggleHighContrast);
  }

  // Effacer les données locales
  const clearBtn = document.getElementById("clear-local-data-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      await clearLocalData();
      showToast("Données locales effacées.");
      navigateTo("home");
    });
  }
}

// ---------------------------------------------------------------------------
// Démarrage de l’application
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", initApp);