// js/map.js
// Module ES : rendu de la carte, clustering, pop-up et gestion du cache.
// Dépendances autorisées : ./data.js, ./offline.js, ./ui.js

import { INCIDENTS } from "./data.js";
import { getIncidents } from "./offline.js";
import { showToast } from "./ui.js";

// ---------------------------------------------------------------------------
// Variables internes
// ---------------------------------------------------------------------------
let miniMap = null;
let fullMap = null;
let markerClusterGroup = null;

// ---------------------------------------------------------------------------
// Initialisation de la mini-carte (dashboard)
// ---------------------------------------------------------------------------
export function initMiniMap() {
  const container = document.getElementById("mini-map-preview");
  if (!container) return;

  if (miniMap) miniMap.remove();

  miniMap = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false,
  }).setView([48.8566, 2.3522], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    minZoom: 2,
    detectRetina: true,
  }).addTo(miniMap);

  const recent = INCIDENTS.slice(-5).reverse();
  recent.forEach((inc) => {
    L.marker([inc.lat, inc.lng], {
      title: inc.type,
      alt: `Incident : ${inc.type}`,
    }).addTo(miniMap);
  });
}

// ---------------------------------------------------------------------------
// Initialisation de la carte pleine taille
// ---------------------------------------------------------------------------
export function initFullMap() {
  const container = document.getElementById("map");
  if (!container) return;

  if (fullMap) fullMap.remove();

  fullMap = L.map(container, {
    zoomControl: true,
    attributionControl: true,
    keyboard: true,
  }).setView([48.8566, 2.3522], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    minZoom: 2,
    detectRetina: true,
    attribution: "&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>",
  }).addTo(fullMap);

  if (typeof L.markerClusterGroup === "function") {
    markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 16,
    });
    fullMap.addLayer(markerClusterGroup);
  }

  refreshMap();
}

// ---------------------------------------------------------------------------
// Rafraîchit la carte avec les incidents stockés ou embarqués
// ---------------------------------------------------------------------------
export async function refreshMap() {
  try {
    clearMap();
    const cached = await getIncidents();
    const incidents = cached.length > 0 ? cached : INCIDENTS;
    loadIncidentsToMap(incidents);
  } catch (err) {
    console.error("Erreur lors du rafraîchissement de la carte :", err);
    showToast("Impossible de charger les incidents.");
  }
}

// ---------------------------------------------------------------------------
// Ajoute les incidents à la carte
// ---------------------------------------------------------------------------
function loadIncidentsToMap(incidents) {
  if (!fullMap) return;

  incidents.forEach((inc) => {
    const marker = L.marker([inc.lat, inc.lng], {
      title: inc.type,
      alt: `Incident : ${inc.type}`,
    });

    marker.on("click", () => showIncidentDetail(inc));

    if (markerClusterGroup) {
      markerClusterGroup.addLayer(marker);
    } else {
      marker.addTo(fullMap);
    }
  });

  if (incidents.length > 0 && markerClusterGroup) {
    const bounds = markerClusterGroup.getBounds();
    if (bounds.isValid()) {
      fullMap.fitBounds(bounds.pad(0.2));
    }
  }
}

// ---------------------------------------------------------------------------
// Supprime tous les marqueurs
// ---------------------------------------------------------------------------
export function clearMap() {
  if (markerClusterGroup) {
    markerClusterGroup.clearLayers();
  } else if (fullMap) {
    fullMap.eachLayer((layer) => {
      if (layer instanceof L.Marker) fullMap.removeLayer(layer);
    });
  }
}

// ---------------------------------------------------------------------------
// Affiche le modal de détail
// ---------------------------------------------------------------------------
export function showIncidentDetail(incident) {
  const modal = document.getElementById("incident-detail-modal");
  if (!modal) return;

  const titleEl = document.getElementById("detail-modal-title");
  const timeEl = document.getElementById("detail-time");
  const typeEl = document.getElementById("detail-type");
  const descEl = document.getElementById("detail-description");
  const photoEl = document.getElementById("detail-photo");

  if (titleEl) titleEl.textContent = `Incident : ${incident.type}`;
  if (timeEl) timeEl.textContent = new Date(incident.timestamp || Date.now()).toLocaleString("fr-FR");
  if (typeEl) typeEl.textContent = incident.type;
  if (descEl) descEl.textContent = incident.description || "Aucune description fournie.";
  
  if (photoEl) {
    if (incident.photo) {
      photoEl.src = incident.photo;
      photoEl.style.display = "block";
    } else {
      photoEl.style.display = "none";
    }
  }

  const shareBtn = document.getElementById("share-incident-btn");
  if (shareBtn) {
    const newShareBtn = shareBtn.cloneNode(true);
    shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
    newShareBtn.addEventListener("click", () => {
      const ev = new CustomEvent("share-incident", { detail: incident });
      document.dispatchEvent(ev);
    });
  }

  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");

  const closeBtn = document.getElementById("close-detail-btn");
  if (closeBtn) closeBtn.focus();

  const closeHandler = () => {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", escHandler);
  };

  const escHandler = (e) => {
    if (e.key === "Escape") closeHandler();
  };

  if (closeBtn) closeBtn.onclick = closeHandler;
  document.addEventListener("keydown", escHandler);
}

// ---------------------------------------------------------------------------
// Gestion du mode hors-ligne
// ---------------------------------------------------------------------------
export function handleOfflineMode(isOffline) {
  if (isOffline) {
    showToast("Mode hors-ligne activé. Les rapports seront stockés localement.");
  } else {
    showToast("Connexion rétablie.");
    refreshMap();
  }
}

// ---------------------------------------------------------------------------
// Sélecteur de carte pour le formulaire
// ---------------------------------------------------------------------------
export function openMapPicker() {
  return new Promise((resolve) => {
    showToast("Veuillez cliquer sur la carte pour sélectionner le lieu.");
    // Simulation d'une sélection de coordonnées
    resolve({ lat: 48.8566, lng: 2.3522 });
  });
}