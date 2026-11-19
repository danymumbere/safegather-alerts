// js/app.js
// Orchestrateur principal de l'application SafeGather Alerts.

import { initIndexedDB } from "./offline.js";
import { initMiniMap, initFullMap } from "./map.js";
import { initReportForm } from "./report.js";
import { initPendingReports } from "./pending.js";
import { initSettings } from "./settings.js";
import { showAboutPage } from "./about.js";
import { showToast } from "./ui.js";

// État global de navigation
const sections = {
  home: document.getElementById("home"),
  report: document.getElementById("report"),
  map: document.getElementById("full-map"),
  pending: document.getElementById("pending"),
  settings: document.getElementById("settings"),
  about: document.getElementById("about"),
};

/**
 * Masque toutes les sections et affiche celle demandée.
 * @param {string} sectionId - L'ID de la section à afficher.
 */
function navigateTo(sectionId) {
  Object.keys(sections).forEach((key) => {
    if (sections[key]) {
      sections[key].style.display = key === sectionId ? "block" : "none";
    }
  });

  // Logique spécifique post-navigation
  if (sectionId === "map") {
    initFullMap();
  } else if (sectionId === "pending") {
    initPendingReports();
  } else if (sectionId === "about") {
    showAboutPage();
  }
}

/**
 * Initialisation de l'application
 */
async function initApp() {
  try {
    // Initialisation de la base de données locale
    await initIndexedDB();

    // Initialisation des composants UI
    initMiniMap();
    initReportForm();
    initSettings();

    // Configuration des écouteurs de navigation
    document.getElementById("btn-home").addEventListener("click", () => navigateTo("home"));
    document.getElementById("btn-report").addEventListener("click", () => navigateTo("report"));
    document.getElementById("btn-map").addEventListener("click", () => navigateTo("map"));
    document.getElementById("btn-pending").addEventListener("click", () => navigateTo("pending"));
    document.getElementById("btn-settings").addEventListener("click", () => navigateTo("settings"));
    document.getElementById("btn-about").addEventListener("click", () => navigateTo("about"));

    // Bouton d'urgence
    document.getElementById("emergency-quick-alert").addEventListener("click", () => {
      const message = encodeURIComponent("ALERTE : Menace immédiate signalée via SafeGather Alerts. Soyez vigilants.");
      window.location.href = `whatsapp://send?text=${message}`;
      showToast("Alerte d’urgence envoyée à votre groupe communautaire.");
    });

    // Gestion de la connectivité
    window.addEventListener("online", () => {
      document.getElementById("offline-notice").style.display = "none";
      showToast("Connexion rétablie.");
    });

    window.addEventListener("offline", () => {
      document.getElementById("offline-notice").style.display = "block";
      showToast("Mode hors ligne activé.");
    });

    // Vérification initiale de l'état réseau
    if (!navigator.onLine) {
      document.getElementById("offline-notice").style.display = "block";
    }

    // Affichage initial
    navigateTo("home");

  } catch (error) {
    console.error("Erreur lors de l’initialisation de l’application :", error);
    showToast("Erreur critique au démarrage de l’application.");
  }
}

// Lancement de l'application au chargement du DOM
document.addEventListener("DOMContentLoaded", initApp);

// Enregistrement du Service Worker pour le support hors ligne
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service Worker non enregistré :", err);
    });
  });
}