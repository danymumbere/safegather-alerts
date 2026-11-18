// js/offline.js
export const DB_NAME = 'SafeGatherDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'incidents';

/**
 * Initialise la base de données IndexedDB et crée le magasin si nécessaire.
 * @returns {Promise<IDBDatabase>}
 */
export async function initIndexedDB() {
  try {
    if (!('indexedDB' in window)) {
      throw new Error("Cette navigation ne supporte pas IndexedDB.");
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Erreur d’ouverture de IndexedDB', event);
    };

    const createdOrUpdated = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });

    return createdOrUpdated;
  } catch (err) {
    console.error('initIndexedDB a échoué :', err);
    throw err;
  }
}

/**
 * Récupère la connexion DB, la met en cache et la retourne.
 */
let dbInstance = null;
async function getDB() {
  if (!dbInstance) {
    dbInstance = await initIndexedDB();
  }
  return dbInstance;
}

/**
 * Sauvegarde un incident dans IndexedDB.
 * @param {Object} incident – données de l’incident à stocker.
 */
export async function saveIncident(incident) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.onerror = () => console.error('Transaction de sauvegarde échouée');
    tx.objectStore(STORE_NAME).add(incident);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('saveIncident a échoué :', err);
    throw err;
  }
}

/**
 * Récupère tous les incidents stockés.
 * @returns {Promise<Array>}
 */
export async function getIncidents() {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const incidents = await new Promise((resolve, reject) => {
      const os = tx.objectStore(STORE_NAME);
      const req = os.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return incidents;
  } catch (err) {
    console.error('getIncidents a échoué :', err);
    return [];
  }
}

/**
 * Met à jour un incident existant.
 * @param {Object} incident – incident avec un `id` valide.
 */
export async function updateIncident(incident) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(incident);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('updateIncident a échoué :', err);
    throw err;
  }
}

/**
 * Supprime un incident par son identifiant.
 * @param {number|string} id – clé primaire de l’incident.
 */
export async function deleteIncident(id) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('deleteIncident a échoué :', err);
    throw err;
  }
}

/**
 * Détecte et renvoie l’état de connectivité actuel.
 * @returns {boolean}
 */
export function getOnlineStatus() {
  return navigator.onLine;
}

/**
 * Ajoute un gestionnaire pour les événements d’online/offline.
 * @param {(online: boolean) => void} callback – appelé avec le nouvel état.
 * @returns {Function} – fonction de nettoyage pour supprimer les écouteurs.
 */
export function addOnlineListener(callback) {
  const handler = () => callback(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}

/**
 * Enregistre le service worker depuis le chemin relatif `./sw.js`.
 * @returns {Promise<ServiceWorkerRegistration>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Cette navigation ne supporte pas les service workers.');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    console.log('Service Worker enregistré :', reg);
    return reg;
  } catch (err) {
    console.error('Échec de l’enregistrement du Service Worker :', err);
    throw err;
  }
}

/**
 * Démarre une simulation de synchronisation en arrière-plan.
 * Vérifie la connectivité toutes les `interval` ms (défaut : 30 secondes) et
 * envoie les incidents non synchronisés à une API factice.
 * @param {number} [interval=30000] – intervalle en millisecondes.
 */
export function startBackgroundSync(interval = 30000) {
  if (window.__syncInterval__) return;
  window.__syncInterval__ = setInterval(async () => {
    if (!navigator.onLine) return;
    try {
      const pending = await getIncidents();
      for (const inc of pending) {
        if (inc.synced) continue;
        await simulateNetworkRequest(inc);
        await updateIncident({ ...inc, synced: true });
      }
    } catch (err) {
      console.error('Erreur de synchronisation en arrière-plan :', err);
    }
  }, interval);
}

/**
 * Arrête la synchronisation en arrière-plan.
 */
export function stopBackgroundSync() {
  if (window.__syncInterval__) {
    clearInterval(window.__syncInterval__);
    delete window.__syncInterval__;
  }
}

/**
 * Simule une requête réseau vers un point de terminaison distant.
 * @param {Object} incident – données à envoyer.
 * @returns {Promise<Object>} – réponse simulée.
 */
async function simulateNetworkRequest(incident) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Stocke un indicateur simple dans localStorage (protégé par try/catch).
 * Utile pour les UI qui ont besoin de savoir si l’app a déjà fonctionné hors ligne.
 * @param {string} key
 * @param {any} value
 */
export function setLocalFlag(key, value) {
  try {
    localStorage.setItem(`sg_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('setLocalFlag a échoué :', err);
  }
}

/**
 * Récupère un indicateur depuis localStorage.
 * @param {string} key
 * @param {any} [fallback]
 * @returns {any}
 */
export function getLocalFlag(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`sg_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error('getLocalFlag a échoué :', err);
    return fallback;
  }
}