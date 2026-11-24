// js/report.js
import { saveIncident, getIncidents } from './offline.js';
import { showToast } from './ui.js';
import { shareViaWhatsApp } from './share.js';

// Sélecteurs HTML valides basés sur les IDs fournis
const REPORT_FORM_SELECTOR = '#incident-form';
const LOCATION_INPUT_SELECTOR = '#incident-location';
const TYPE_SELECTOR = '#incident-type';
const DESCRIPTION_SELECTOR = '#incident-description';
const PHOTO_INPUT_SELECTOR = '#incident-photo';
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
  const location = document.getElementById('incident-location').value.trim();
  const incidentType = document.getElementById('incident-type').value;
  const description = document.getElementById('incident-description').value.trim();
  const photoInput = document.getElementById('incident-photo');

  // Validation des champs requis
  if (!location || !incidentType) {
    showToast('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  const incident = {
    time: new Date().toISOString(),
    location,
    incidentType,
    description: description || null,
    photoUrl: photoInput && photoInput.files[0] ? URL.createObjectURL(photoInput.files[0]) : null,
  };

  try {
    await saveIncident(incident);
    showToast('Signalement enregistré avec succès.');
    form.reset();
  } catch (error) {
    showToast('Erreur lors de l’enregistrement. Réessayez.');
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