// js/about.js
import { incidentGeoJSON } from './data.js';
import { initIndexedDB } from './offline.js';
import { showToast } from './ui.js';

// Sélecteurs HTML valides
const ABOUT_CONTENT_SELECTOR = '#about-content';
const CLEAR_DATA_BTN_SELECTOR = '#clear-data-btn';
const DB_STATUS_SELECTOR = '#db-status';

// Exporte la fonction principale pour afficher la page À propos
export function showAboutPage() {
  const content = document.querySelector(ABOUT_CONTENT_SELECTOR);
  if (!content) return;

  content.innerHTML = `
    <section aria-labelledby="about-title">
      <h2 id="about-title">À propos de SafeGather Alerts</h2>
      <p>SafeGather Alerts est une application mobile-first conçue pour signaler et visualiser les incidents lors de rassemblements religieux. Elle fonctionne entièrement hors ligne et protège votre vie privée.</p>
      
      <h3>Fonctionnalités principales</h3>
      <ul>
        <li>Signalement d'incidents avec géolocalisation</li>
        <li>Carte interactive en temps réel</li>
        <li>Partage sécurisé via WhatsApp/Email</li>
        <li>Mode hors ligne complet</li>
        <li>Accessibilité renforcée</li>
      </ul>

      <h3>Gestion des données</h3>
      <p>Toutes les données sont stockées localement dans votre navigateur. Aucun identifiant personnel n'est transmis.</p>
      <button id="clear-data-btn" class="btn-danger">Effacer les données locales</button>
      <p id="db-status" class="mt-2"></p>

      <h3>Politique de confidentialité</h3>
      <p>Nous ne collectons aucune donnée personnelle. Les rapports sont stockés localement et partagés uniquement via les applications que vous choisissez.</p>

      <h3>Support</h3>
      <p>Pour toute question, contactez-nous à <a href="mailto:support@safegather.org">support@safegather.org</a>.</p>
    </section>
  `;

  // Gestionnaire pour effacer les données locales
  const clearBtn = content.querySelector(CLEAR_DATA_BTN_SELECTOR);
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      try {
        const db = await initIndexedDB();
        const tx = db.transaction(['incidents'], 'readwrite');
        const store = tx.objectStore('incidents');
        store.clear();
        tx.oncomplete = () => {
          showToast('Données locales effacées avec succès');
          updateDBStatus();
        };
      } catch (err) {
        showToast('Erreur lors de l\'effacement des données');
        console.error(err);
      }
    });
  }

  // Affiche l'état actuel de la base de données
  updateDBStatus();
}

// Met à jour l'affichage de l'état de la base de données
async function updateDBStatus() {
  const statusElement = document.querySelector(DB_STATUS_SELECTOR);
  if (!statusElement) return;

  try {
    const db = await initIndexedDB();
    const tx = db.transaction(['incidents'], 'readonly');
    const store = tx.objectStore('incidents');
    const countReq = store.count();

    countReq.onsuccess = () => {
      const count = countReq.result;
      statusElement.textContent = `Base de données locale : ${count} incident${count !== 1 ? 's' : ''} stocké${count !== 1 ? 's' : ''}`;
    };
  } catch (err) {
    statusElement.textContent = 'Impossible d’accéder à la base de données';
  }
}