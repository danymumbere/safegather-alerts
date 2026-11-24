// js/map.js
import { incidentGeoJSON } from './data.js';
import { getIncidents } from './offline.js';

let miniMapInstance = null;
let fullMapInstance = null;
let markerClusterGroup = null;
let leafletLoading = false;

const SELECTORS = {
  miniMap: '#mini-map-preview',
  fullMap: '#full-map',
  detail: '#marker-detail',
  content: '#marker-detail-content',
  closeBtn: '#close-detail-btn'
};

function loadLeaflet(callback) {
  if (typeof L !== 'undefined') {
    callback();
    return;
  }
  if (leafletLoading) return;
  leafletLoading = true;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => {
    const cluster = document.createElement('script');
    cluster.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
    cluster.onload = callback;
    document.head.appendChild(cluster);
  };
  document.head.appendChild(script);
}

export function initMiniMap() {
  loadLeaflet(() => {
    if (miniMapInstance) return;
    const el = document.querySelector(SELECTORS.miniMap);
    if (!el) return;

    miniMapInstance = L.map(el, { dragging: false, zoomControl: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false }).setView([48.8566, 2.3522], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMapInstance);
    refreshMiniMap();
  });
}

export function initFullMap() {
  loadLeaflet(() => {
    if (fullMapInstance) return;
    const el = document.querySelector(SELECTORS.fullMap);
    if (!el) return;

    fullMapInstance = L.map(el).setView([48.8566, 2.3522], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(fullMapInstance);
    markerClusterGroup = L.markerClusterGroup();
    fullMapInstance.addLayer(markerClusterGroup);
    refreshMap();
  });
}

export async function refreshMap() {
  if (!markerClusterGroup) return;
  const incidents = await getIncidents();
  const all = [...incidentGeoJSON.features, ...incidents];
  markerClusterGroup.clearLayers();
  all.forEach(i => {
    const m = L.marker([i.geometry.coordinates[1], i.geometry.coordinates[0]]);
    m.on('click', () => showIncidentDetail(i.properties));
    markerClusterGroup.addLayer(m);
  });
}

function refreshMiniMap() {
  if (!miniMapInstance) return;
  incidentGeoJSON.features.slice(0, 5).forEach(i => {
    L.circleMarker([i.geometry.coordinates[1], i.geometry.coordinates[0]], { radius: 5 }).addTo(miniMapInstance);
  });
}

function showIncidentDetail(props) {
  const el = document.querySelector(SELECTORS.detail);
  const content = document.querySelector(SELECTORS.content);
  if (!el || !content) return;
  el.style.display = 'block';
  content.innerHTML = `
    <p><strong>Type:</strong> ${props.type}</p>
    <p><strong>Date:</strong> ${props.date}</p>
    <p><strong>Description:</strong> ${props.description}</p>
  `;
}
