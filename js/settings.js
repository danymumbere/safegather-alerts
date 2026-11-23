// js/settings.js
import { showToast } from './ui.js';
import { deletePendingReport } from './pending.js';

// Sélecteurs HTML valides basés sur les IDs fournis
const NOTIFICATIONS_TOGGLE = '#notifications-toggle';
const CONTRAST_TOGGLE = '#contrast-toggle';
const CLEAR_STORAGE_BTN = '#clear-storage-btn';

// Gestion des préférences de notification
export function toggleNotifications() {
  const toggle = document.querySelector(NOTIFICATIONS_TOGGLE);
  if (!toggle) return;

  try {
    const enabled = localStorage.getItem('notificationsEnabled') === 'true';
    toggle.checked = enabled;

    toggle.addEventListener('change', (e) => {
      localStorage.setItem('notificationsEnabled', e.target.checked);
      showToast(`Notifications ${e.target.checked ? 'activées' : 'désactivées'}`);
    });
  } catch (error) {
    console.error('Erreur de gestion des notifications:', error);
    showToast('Erreur lors de la mise à jour des notifications');
  }
}

// Gestion du thème haut contraste
export function toggleContrast() {
  const toggle = document.querySelector(CONTRAST_TOGGLE);
  if (!toggle) return;

  try {
    const enabled = localStorage.getItem('highContrast') === 'true';
    toggle.checked = enabled;
    document.body.classList.toggle('high-contrast', enabled);

    toggle.addEventListener('change', (e) => {
      localStorage.setItem('highContrast', e.target.checked);
      document.body.classList.toggle('high-contrast', e.target.checked);
      showToast(`Thème ${e.target.checked ? 'haut contraste' : 'standard'} appliqué`);
    });
  } catch (error) {
    console.error('Erreur de gestion du contraste:', error);
    showToast('Erreur lors de la mise à jour du thème');
  }
}

// Nettoyage complet du stockage local
export async function clearStorage() {
  const btn = document.querySelector(CLEAR_STORAGE_BTN);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      if (confirm('Voulez-vous vraiment supprimer toutes les données locales ?')) {
        localStorage.clear();
        await clearPendingReports();
        showToast('Données locales supprimées avec succès');
        window.location.reload(); // Force le rechargement pour réinitialiser l'état
      }
    } catch (error) {
      console.error('Erreur de nettoyage du stockage:', error);
      showToast('Erreur lors de la suppression des données');
    }
  });
}

// Initialisation des paramètres au chargement
export function initSettings() {
  toggleNotifications();
  toggleContrast();
  clearStorage();
}