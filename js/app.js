// js/app.js
// Application orchestrator – routes, service‑worker, global state, UI init & teardown

import { initIndexedDB, registerServiceWorker, isOnline, onOffline, onOnline, getIncidents, saveIncident, syncIncidents } from "./offline.js";
import { initReportForm, saveDraft, validateForm, showReportForm, hideReportForm } from "./report.js";
import { showAboutPage } from "./about.js";
import { initPendingQueue, updatePendingList, showPendingView, hidePendingView } from "./pending.js";
import { initSettings, toggleNotifications, toggleContrast, toggleScreenReader, toggleKeyboardNav, clearLocalData } from "./settings.js";
import { shareIncident } from "./share.js";
import { showToast } from "./ui.js";
import { incidentGeoJSON } from "./data.js";

/* -------------------------------------------------------------------------- */
/*  Sélecteurs HTML (ids fournis)                                            */
/* -------------------------------------------------------------------------- */
const BTN_HOME = "#btn-home";
const BTN_REPORT = "#btn-report";
const BTN_MAP = "#btn-map";
const BTN_PENDING = "#btn-pending";
const BTN_SETTINGS = "#btn-settings";
const BTN_ABOUT = "#btn-about";

const SECTION_HOME = "#home";
const SECTION_REPORT = "#report";
const SECTION_MAP = "#map";
const SECTION_PENDING = "#pending";
const SECTION_SETTINGS = "#settings";
const SECTION_ABOUT = "#about";

const INCIDENT_COUNT = "#incident-count";
const MINI_MAP = "#mini-map";
const FULL_MAP = "#map";
const OFFLINE_NOTICE = "#offline-notice";
const EMERGENCY_BTN = "#emergency-quick-alert";

/* -------------------------------------------------------------------------- */
/*  Gestion de la visibilité des sections                                     */
/* -------------------------------------------------------------------------- */
function hideAllSections() {
  document.querySelectorAll(`${SECTION_HOME},${SECTION_REPORT},${SECTION_MAP},${SECTION_PENDING},${SECTION_SETTINGS},${SECTION_ABOUT}`).forEach(el => {
    el.classList.add("hidden");
    el.setAttribute("aria-hidden", "true");
  });
}
function showSection(selector) {
  hideAllSections();
  const el = document.querySelector(selector);
  if (el) {
    el.classList.remove("hidden");
    el.setAttribute("aria-hidden", "false");
    el.focus({ preventScroll: true });
  }
}

/* -------------------------------------------------------------------------- */
/*  Mini‑carte et carte complète (Leaflet global)                             */
/* -------------------------------------------------------------------------- */
let miniMapInstance = null;
let fullMapInstance = null;
let markerClusterGroup = null;

function initMiniMap() {
  if (miniMapInstance) return;
  const container = document.querySelector(MINI_MAP);
  if (!container) return;

  miniMapInstance = L.map(container, {
    dragging: false,
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    attributionControl: false
  }).setView([0, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(miniMapInstance);
}

function initFullMap() {
  if (fullMapInstance) return;
  const container = document.querySelector(FULL_MAP);
  if (!container) return;

  fullMapInstance = L.map(container).setView([0, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(fullMapInstance);

  markerClusterGroup = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
  });
  fullMapInstance.addLayer(markerClusterGroup);
}

/* -------------------------------------------------------------------------- */
/*  Rafraîchissement des cartes                                               */
/* -------------------------------------------------------------------------- */
async function refreshMaps() {
  const stored = await getIncidents();
  const all = [...incidentGeoJSON.features, ...stored];

  // --- Mini‑carte ---------------------------------------------------------
  if (miniMapInstance) {
    miniMapInstance.eachLayer(l => {
      if (l instanceof L.Marker) miniMapInstance.removeLayer(l);
    });
    all.forEach(f => {
      const [lon, lat] = f.geometry.coordinates;
      L.marker([lat, lon]).addTo(miniMapInstance);
    });
    const group = new L.featureGroup(all.map(f => L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]])));
    miniMapInstance.fitBounds(group.getBounds().pad(0.2));
  }

  // --- Carte complète ------------------------------------------------------
  if (markerClusterGroup) {
    markerClusterGroup.clearLayers();
    all.forEach(f => {
      const [lon, lat] = f.geometry.coordinates;
      const marker = L.marker([lat, lon], { incident: f.properties });
      marker.on("click", () => showIncidentDetail(f.properties));
      markerClusterGroup.addLayer(marker);
    });
    const group = new L.featureGroup(all.map(f => L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]])));
    fullMapInstance.fitBounds(group.getBounds().pad(0.2));
  }
}

/* -------------------------------------------------------------------------- */
/*  Détail d’un incident (affiché depuis la carte)                           */
/* -------------------------------------------------------------------------- */
function showIncidentDetail(props) {
  const detailSection = document.querySelector("#incident-details");
  if (!detailSection) return;

  const timeEl = detailSection.querySelector("#incident-time");
  const typeEl = detailSection.querySelector("#incident-type");
  const descEl = detailSection.querySelector("#description");
  const shareBtn = detailSection.querySelector("#share-incident");
  const idEl = detailSection.querySelector("#incident-id");

  if (timeEl) timeEl.textContent = new Date(props.time).toLocaleString();
  if (typeEl) typeEl.textContent = props.incidentType;
  if (descEl) descEl.textContent = props.description || "Aucune description";
  if (idEl) idEl.textContent = props.id || "N/A";

  if (shareBtn) {
    shareBtn.onclick = () => shareIncident(props);
  }

  // Affiche le panneau de détail (on suppose qu’il est dans la section carte)
  detailSection.classList.remove("hidden");
  detailSection.setAttribute("aria-hidden", "false");
}

/* -------------------------------------------------------------------------- */
/*  Tableau de bord d’accueil                                                  */
/* -------------------------------------------------------------------------- */
async function updateHomeDashboard() {
  const countEl = document.querySelector(INCIDENT_COUNT);
  if (!countEl) return;
  const stored = await getIncidents();
  const total = incidentGeoJSON.features.length + stored.length;
  countEl.textContent = `${total}`;
}

/* -------------------------------------------------------------------------- */
/*  Partage d’un incident (Web Share API)                                     */
/* -------------------------------------------------------------------------- */
function shareIncident(props) {
  if (navigator.share) {
const title = `Incident ${props.id || ""}`;
    const text = `${props.incidentType} - ${props.description || ""}`;
    const url = `${window.location.origin}${window.location.pathname}#incident-${props.id}`;
    navigator.share({ title, text, url }).catch(err => console.error("Share failed:", err));
  } else {
    // Solution de repli : copier le lien dans le presse‑papier
    const url = `${window.location.origin}${window.location.pathname}#incident-${props.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Lien copié dans le presse‑papier : " + url);
    }).catch(err => console.error("Copy failed:", err));
  }
}

/* -------------------------------------------------------------------------- */
/*  Gestion du stockage local (IndexedDB simplifié via localStorage)          */
/* -------------------------------------------------------------------------- */
const STORAGE_KEY = "savedIncidents";

async function getIncidents() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Erreur de lecture du stockage local :", e);
    return [];
  }
}

async function saveIncident(incident) {
  try {
    const incidents = await getIncidents();
    incidents.push(incident);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch (e) {
    console.error("Erreur d’écriture du stockage local :", e);
  }
}

/* -------------------------------------------------------------------------- */
/*  Chargement du GeoJSON d’incidents embarqué ou distant                      */
/* -------------------------------------------------------------------------- */
let incidentGeoJSON = { type: "FeatureCollection", features: [] };

async function loadIncidentGeoJSON() {
  try {
    const response = await fetch("data/incidents.geojson");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    incidentGeoJSON = data;
  } catch (e) {
    console.warn("Impossible de charger le GeoJSON distant, utilisation d’un jeu vide.", e);
    // Laisser incidentGeoJSON vide
  }
}

/* -------------------------------------------------------------------------- */
/*  Navigation entre les sections                                             */
/* -------------------------------------------------------------------------- */
function setupNavigation() {
  const navLinks = document.querySelectorAll("[data-nav]");
  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("href");
      if (target) showSection(target);
    });
  });
}

/* -------------------------------------------------------------------------- */
/*  Soumission du formulaire d’ajout d’incident                               */
/* -------------------------------------------------------------------------- */
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const incident = {
    id: Date.now(),
    time: new Date().toISOString(),
    incidentType: formData.get("type") || "Inconnu",
    description: formData.get("description") || "",
    geometry: {
      type: "Point",
      coordinates: [
        parseFloat(formData.get("lon")) || 0,
        parseFloat(formData.get("lat")) || 0
      ]
    }
  };

  await saveIncident(incident);
  await refreshMaps();
  await updateHomeDashboard();

  // Réinitialiser le formulaire et revenir à l’accueil
  form.reset();
  showSection("#home");
}

/* -------------------------------------------------------------------------- */
/*  Initialisation de l’application                                            */
/* -------------------------------------------------------------------------- */
async function initApp() {
  await loadIncidentGeoJSON();
  initMiniMap();
  initFullMap();
  await refreshMaps();
  await updateHomeDashboard();
  setupNavigation();

  const form = document.querySelector("#incident-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Si l’URL contient un hash vers un incident, essayer de le charger
  const hash = window.location.hash;
  if (hash.startsWith("#incident-")) {
    const id = hash.replace("#incident-", "");
    const all = [...incidentGeoJSON.features, ...(await getIncidents())];
    const found = all.find(f => String(f.properties?.id || f.id) === id);
    if (found) showIncidentDetail(found.properties || found);
  }
}

/* -------------------------------------------------------------------------- */
/*  Lancement de l’application                                                 */
/* -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", initApp);