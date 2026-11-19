// js/pending.js
import { getIncidents, deleteIncident } from './offline.js';
import { showToast } from './ui.js';

// Sélecteurs HTML valides
const PENDING_TABLE_SELECTOR = '#incident-table';

/**
 * Affiche les incidents en attente dans le tableau dédié.
 * @returns {Promise<void>}
 */
export async function showPendingReports() {
  try {
    const incidents = await getIncidents();
    const pendingIncidents = incidents.filter(incident => !incident.id.includes('inc-'));
    renderPendingTable(pendingIncidents);
  } catch (err) {
    showToast('Erreur lors du chargement des incidents en attente');
    console.error('showPendingReports a échoué :', err);
  }
}

/**
 * Rendu du tableau des incidents en attente.
 * @param {Array} incidents - Liste des incidents à afficher.
 */
function renderPendingTable(incidents) {
  const table = document.querySelector(PENDING_TABLE_SELECTOR);
  if (!table) return;

  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Type</th>
        <th scope="col">Date</th>
        <th scope="col">Description</th>
        <th scope="col">Actions</th>
      </tr>
    </thead>
    <tbody>
      ${incidents.map(incident => `
        <tr data-id="${incident.id}">
          <td>${incident.properties.incidentType}</td>
          <td>${new Date(incident.properties.time).toLocaleString()}</td>
          <td>${incident.properties.description}</td>
          <td>
            <button class="btn-delete" aria-label="Supprimer l’incident" data-id="${incident.id}">🗑️</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  // Gestionnaire de suppression
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const incidentId = e.target.dataset.id;
      if (confirm('Confirmez-vous la suppression de cet incident ?')) {
        try {
          await deleteIncident(incidentId);
          showPendingReports();
          showToast('Incident supprimé avec succès');
        } catch (err) {
          showToast('Erreur lors de la suppression');
          console.error(err);
        }
      }
    });
  });
}

/**
 * Supprime un incident en attente.
 * @param {string} incidentId - ID de l'incident à supprimer.
 * @returns {Promise<void>}
 */
export async function deletePendingReport(incidentId) {
  try {
    await deleteIncident(incidentId);
    showPendingReports();
    showToast('Incident supprimé avec succès');
  } catch (err) {
    showToast('Erreur lors de la suppression');
    console.error(err);
  }
}