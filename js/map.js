// js/map.js
import { incidentGeoJSON } from './data.js';
import { getIncidents } from './offline.js';
import L from 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js'; // Assurez-vous d'avoir Leaflet inclus dans votre projet
import 'leaflet.markercluster'; // Assurez-vous d'avoir Leaflet.markercluster inclus

// Sélecteurs HTML valides basés sur les IDs fournis
const MINI_MAP_SELECTOR = '#mini-map';
const FULL_MAP_SELECTOR = '#map';
const INCIDENT_DETAIL_SELECTOR = '#incident-detail';
const DETAIL_TITLE_SELECTOR = '#detail-title';
const DETAIL_TIME_SELECTOR = '#detail-time';
const DETAIL_TYPE_SELECTOR = '#detail-type';
const DETAIL_DESCRIPTION_SELECTOR = '#detail-description';
const DETAIL_PHOTO_SELECTOR = '#detail-photo';
const SHARE_INCIDENT_BTN_SELECTOR = '#share-incident-btn';
const CLOSE_DETAIL_BTN_SELECTOR = '#close-detail-btn';

let miniMapInstance = null;
let fullMapInstance = null;
let markerClusterGroup = null;

// Initialise la carte miniature sur le dashboard
export function initMiniMap() {
  if (miniMapInstance) return;

  const miniMapElement = document.querySelector(MINI_MAP_SELECTOR);
  if (!miniMapElement) return;

  miniMapInstance = L.map(miniMapElement, {
    dragging: false,
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
  }).setView([0, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(miniMapInstance);

  refreshMiniMap();
}

// Initialise la carte complète avec clustering et interactions
export function initFullMap() {
  if (fullMapInstance) return;

  const mapElement = document.querySelector(FULL_MAP_SELECTOR);
  if (!mapElement) return;

  fullMapInstance = L.map(mapElement).setView([0, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(fullMapInstance);

  markerClusterGroup = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
  });

  fullMapInstance.addLayer(markerClusterGroup);

  // Gestionnaire de clic sur les marqueurs
  markerClusterGroup.on('click', (e) => {
    if (e.layer.getLatLng) {
      const incident = e.layer.options.incident;
      showIncidentDetail(incident);
    }
  });

  refreshMap();
}

// Met à jour les données des cartes (mini et complète)
export async function refreshMap() {
  const incidents = await getIncidents();
  const allIncidents = [...incidentGeoJSON.features, ...incidents];

  if (markerClusterGroup) {
    markerClusterGroup.clearLayers();
  }

  allIncidents.forEach(incident => {
    const { geometry, properties } = incident;
    const marker = L.marker([geometry.coordinates[1], geometry.coordinates[0]], {
      incident: properties
    });

    marker.bindPopup(createPopupContent(properties));
    markerClusterGroup.addLayer(marker);
  });

  refreshMiniMap();
}

// Met à jour spécifiquement la carte miniature
function refreshMiniMap() {
  if (!miniMapInstance) return;

  miniMapInstance.eachLayer(layer => {
    if (layer !== miniMapInstance._layers[0]) { // Conserve seulement le tile layer
      miniMapInstance.removeLayer(layer);
    }
  });

  const incidents = incidentGeoJSON.features.slice(0, 10); // Limite à 10 pour performance
  incidents.forEach(incident => {
    const { geometry, properties } = incident;
    L.circleMarker([geometry.coordinates[1], geometry.coordinates[0]], {
      radius: 4,
      color: getIncidentColor(properties.incidentType),
      fillOpacity: 0.8
    }).addTo(miniMapInstance);
  });
}

// Affiche les détails d'un incident dans un panneau latéral
function showIncidentDetail(incident) {
  const detailElement = document.querySelector(INCIDENT_DETAIL_SELECTOR);
  if (!detailElement) return;

  detailElement.classList.add('active');

  document.querySelector(DETAIL_TITLE_SELECTOR).textContent = `Incident à ${formatLocation(incident.geometry.coordinates)}`;
  document.querySelector(DETAIL_TIME_SELECTOR).textContent = `Le ${new Date(incident.properties.time).toLocaleString()}`;
  document.querySelector(DETAIL_TYPE_SELECTOR).textContent = `Type : ${incident.properties.incidentType}`;
  document.querySelector(DETAIL_DESCRIPTION_SELECTOR).textContent = incident.properties.description || 'Aucune description';

  const photoElement = document.querySelector(DETAIL_PHOTO_SELECTOR);
  if (incident.properties.photoUrl) {
    photoElement.src = incident.properties.photoUrl;
    photoElement.style.display = 'block';
  } else {
    photoElement.style.display = 'none';
  }

  // Gestion du bouton de partage
  const shareBtn = document.querySelector(SHARE_INCIDENT_BTN_SELECTOR);
  shareBtn.addEventListener('click', () => {
    // Implémentez la logique de partage ici (voir module share.js)
  }, { once: true });

  // Fermeture du panneau
  document.querySelector(CLOSE_DETAIL_BTN_SELECTOR).addEventListener('click', () => {
    detailElement.classList.remove('active');
  }, { once: true });
}

// Utilitaires
function createPopupContent(properties) {
  return `
    <div class="map-popup">
      <strong>${properties.incidentType}</strong>
      <div>${new Date(properties.time).toLocaleString()}</div>
      ${properties.description ? `<div>${properties.description}</div>` : ''}
    </div>
  `;
}

function getIncidentColor(type) {
  const colors = {
    harassment: '#FF5733',
    threat: '#C70039',
    restriction: '#900C3F',
    other: '#581845'
  };
  return colors[type] || '#333';
}

function formatLocation([lng, lat]) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}