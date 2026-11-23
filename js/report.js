// js/report.js
import { saveIncident, getIncidents } from './offline.js';
import { showToast } from './ui.js';
import { shareViaWhatsApp } from './share.js';

// Sélecteurs HTML valides basés sur les IDs fournis
const REPORT_FORM_SELECTOR = '#incident-report-form';
const LOCATION_INPUT_SELECTOR = '#location';
const TYPE_SELECTOR = '#incident-type';
const DESCRIPTION_SELECTOR = '#description';
const PHOTO_INPUT_SELECTOR = '#photo';
const SUBMIT_BTN_SELECTOR = '#submit-report';
const PENDING_QUEUE_SELECTOR = '#pending-reports-queue';

// Gabarits HTML pour les éléments dynamiques
const PENDING_ITEM_TEMPLATE = `
  <div class="pending-item" data-id="{{id}}">
    <span>{{time}}</span>
    <span>{{type}}</span>
    <button class="edit-btn" aria-label="Modifier">✏️</button>
    <button class="delete-btn" aria-label="Supprimer">🗑️</button>
  </div>
`;

// État interne du formulaire
let currentDraft = null;

// Affiche le formulaire de signalement
export function showReportForm() {
  const form = document.querySelector(REPORT_FORM_SELECTOR);
  if (form) {
    form.reset();
    form.classList.remove('hidden');
    document.querySelector(LOCATION_INPUT_SELECTOR).focus();
  }
}

// Gère la soumission du formulaire
export async function handleReportSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // Validation des champs requis
  if (!formData.get('location') || !formData.get('incident-type')) {
    showNotification('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  const incident = {
    time: new Date().toISOString(),
    location: formData.get('location'),
    incidentType: formData.get('incident-type'),
    description: formData.get('description') || null,
    photoUrl: formData.get('photo') ? URL.createObjectURL(formData.get('photo')) : null,
  };

  try {
    await saveIncident(incident);
    showNotification('Signalement enregistré avec succès.');
    form.reset();
    refreshPendingQueue();
  } catch (error) {
    showNotification('Erreur lors de l’enregistrement. Réessayez.');
    console.error('handleReportSubmit error:', error);
  }
}

// Actualise la file d'attente des signalements en attente
async function refreshPendingQueue() {
  const pendingQueue = document.querySelector(PENDING_QUEUE_SELECTOR);
  if (!pendingQueue) return;

  try {
    const incidents = await getIncidents();
    pendingQueue.innerHTML = incidents.map(incident => 
      PENDING_ITEM_TEMPLATE
        .replace('{{id}}', incident.id)
        .replace('{{time}}', new Date(incident.time).toLocaleString())
        .replace('{{type}}', incident.incidentType)
    ).join('');

    // Ajout des gestionnaires d'événements pour les boutons
    pendingQueue.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => handleEdit(btn.closest('.pending-item').dataset.id));
    });

    pendingQueue.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(btn.closest('.pending-item').dataset.id));
    });

  } catch (error) {
    console.error('refreshPendingQueue error:', error);
  }
}

// Gère la modification d'un signalement
async function handleEdit(id) {
  try {
    const incidents = await getIncidents();
    const incident = incidents.find(i => i.id === parseInt(id));
    if (incident) {
      currentDraft = incident;
      populateForm(incident);
      showReportForm();
    }
  } catch (error) {
    console.error('handleEdit error:', error);
  }
}

// Gère la suppression d'un signalement
async function handleDelete(id) {
  try {
    const db = await getDB();
    const tx = db.transaction(['incidents'], 'readwrite');
    tx.objectStore('incidents').delete(parseInt(id));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    refreshPendingQueue();
  } catch (error) {
    console.error('handleDelete error:', error);
  }
}

// Remplit le formulaire avec les données d'un signalement existant
function populateForm(incident) {
  const form = document.querySelector(REPORT_FORM_SELECTOR);
  if (form) {
    form.elements['location'].value = incident.location;
    form.elements['incident-type'].value = incident.incidentType;
    form.elements['description'].value = incident.description || '';
    // Gestion de la photo existante (non implémentée ici pour simplicité)
  }
}

// Initialisation des écouteurs d'événements
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector(REPORT_FORM_SELECTOR);
  if (form) {
    form.addEventListener('submit', handleReportSubmit);
  }

  refreshPendingQueue();
});