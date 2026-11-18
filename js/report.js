// js/report.js
// Module ES : gestion du formulaire d’incident, validation, capture d’image
// et file d’attente des rapports hors-ligne.

import { saveIncident, getIncidents, updateIncident, deleteIncident } from "./offline.js";
import { showToast } from "./ui.js";
import { openMapPicker } from "./map.js";

/* -------------------------------------------------------------------------
   Variables internes
-------------------------------------------------------------------------- */
let draftKey = "draftReport";
let pendingContainer = null;

/* -------------------------------------------------------------------------
   Utilitaires
-------------------------------------------------------------------------- */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e.target.error);
    reader.readAsDataURL(file);
  });
}

function storeDraft(data) {
  try {
    localStorage.setItem(draftKey, JSON.stringify(data));
  } catch (e) {
    console.error("Impossible d’enregistrer le brouillon :", e);
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(draftKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Impossible de lire le brouillon :", e);
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(draftKey);
  } catch (e) {
    console.error("Impossible de supprimer le brouillon :", e);
  }
}

/* -------------------------------------------------------------------------
   Validation du formulaire
-------------------------------------------------------------------------- */
function validateForm(data) {
  const errors = [];

  if (!data.location || data.location.trim() === "") {
    errors.push("Le champ « Lieu » est obligatoire.");
  }
  if (!data.type || data.type.trim() === "") {
    errors.push("Le type d’incident doit être sélectionné.");
  }

  return errors;
}

/* -------------------------------------------------------------------------
   Soumission du formulaire
-------------------------------------------------------------------------- */
export async function submitReport(event) {
  event?.preventDefault();

  const form = document.getElementById("incident-form");
  if (!form) {
    console.error("submitReport : formulaire #incident-form introuvable");
    return;
  }

  const locationInput = document.getElementById("location-input");
  const typeSelect = document.getElementById("type-select");
  const descriptionArea = document.getElementById("description-textarea");
  const photoInput = document.getElementById("photo-input");

  const editingId = form.dataset.editingId;

  const report = {
    id: editingId ? Number(editingId) : Date.now(),
    location: locationInput?.value?.trim() || "",
    lat: locationInput?.dataset.lat ? parseFloat(locationInput.dataset.lat) : null,
    lng: locationInput?.dataset.lng ? parseFloat(locationInput.dataset.lng) : null,
    type: typeSelect?.value || "",
    description: descriptionArea?.value?.trim() || "",
    photo: null,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  if (photoInput && photoInput.files && photoInput.files[0]) {
    try {
      report.photo = await readFileAsDataURL(photoInput.files[0]);
    } catch (e) {
      console.error("Erreur de lecture de la photo :", e);
      showToast("Impossible de lire la photo sélectionnée.", "error");
      return;
    }
  }

  const errors = validateForm(report);
  if (errors.length) {
    errors.forEach((msg) => showToast(msg, "error"));
    return;
  }

  try {
    if (editingId) {
      await updateIncident(report);
      showToast("Rapport mis à jour avec succès.", "success");
      delete form.dataset.editingId;
    } else {
      await saveIncident(report);
      showToast("Rapport enregistré en file d’attente.", "success");
    }

    clearDraft();
    form.reset();
    if (locationInput) {
      delete locationInput.dataset.lat;
      delete locationInput.dataset.lng;
    }
    await renderPendingList();
    navigateTo("pending"); // Redirige vers l'onglet Pending après soumission
  } catch (e) {
    console.error("Échec de la sauvegarde du rapport :", e);
    showToast("Une erreur est survenue lors de l’enregistrement.", "error");
  }
}

/* -------------------------------------------------------------------------
   Gestion du brouillon
-------------------------------------------------------------------------- */
function attachDraftListeners() {
  const form = document.getElementById("incident-form");
  if (!form) return;

  const fields = [
    "location-input",
    "type-select",
    "description-textarea",
  ];

  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const draft = {
        location: document.getElementById("location-input")?.value || "",
        type: document.getElementById("type-select")?.value || "",
        description: document.getElementById("description-textarea")?.value || "",
      };
      storeDraft(draft);
    });
  });
}

function populateDraft() {
  const draft = loadDraft();
  if (!draft) return;

  const locationInput = document.getElementById("location-input");
  const typeSelect = document.getElementById("type-select");
  const descriptionArea = document.getElementById("description-textarea");

  if (locationInput && draft.location) locationInput.value = draft.location;
  if (typeSelect && draft.type) typeSelect.value = draft.type;
  if (descriptionArea && draft.description) descriptionArea.value = draft.description;
}

/* -------------------------------------------------------------------------
   Sélection du point sur la carte
-------------------------------------------------------------------------- */
export async function pickLocation() {
  const btn = document.getElementById("pick-on-map-btn");
  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const { lat, lng } = await openMapPicker();
      const locationInput = document.getElementById("location-input");
      if (locationInput) {
        locationInput.value = `(${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        locationInput.dataset.lat = lat;
        locationInput.dataset.lng = lng;
        locationInput.setAttribute("aria-label", `Coordonnées sélectionnées : ${lat}, ${lng}`);
        locationInput.focus();
      }
    } catch (err) {
      console.error("Échec de la sélection sur la carte :", err);
      showToast("Impossible de choisir un point sur la carte.", "error");
    }
  });
}

/* -------------------------------------------------------------------------
   Rendu de la file d’attente (onglet « Pending »)
-------------------------------------------------------------------------- */
export async function renderPendingList() {
  if (!pendingContainer) pendingContainer = document.getElementById("pending-list");
  if (!pendingContainer) return;

  pendingContainer.innerHTML = "";

  const incidents = await getIncidents();
  const pending = incidents.filter((i) => i.status !== "sent");

  if (!pending.length) {
    pendingContainer.innerHTML = `<p class="text-center" aria-live="polite">Aucun rapport en attente.</p>`;
    return;
  }

  pending.forEach((inc) => {
    const item = document.createElement("li");
    item.className = "pending-item";
    item.dataset.id = inc.id;
    item.tabIndex = 0;
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      <div class="pending-meta">
        <strong>${inc.type}</strong> – ${new Date(inc.createdAt).toLocaleString()}
      </div>
      <div class="pending-status" aria-live="polite">
        ${inc.status === "sending" ? "Envoi…" : "En attente"}
      </div>
      <div class="pending-actions">
        <button class="btn-edit" aria-label="Modifier le rapport ${inc.id}">✎</button>
        <button class="btn-delete" aria-label="Supprimer le rapport ${inc.id}">🗑️</button>
      </div>
    `;

    const editBtn = item.querySelector(".btn-edit");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        loadIncidentIntoForm(inc.id);
      });
    }

    const deleteBtn = item.querySelector(".btn-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("Supprimer ce rapport ?")) {
          await deleteIncident(inc.id);
          showToast("Rapport supprimé.", "success");
          await renderPendingList();
        }
      });
    }

    pendingContainer.appendChild(item);
  });
}

/* -------------------------------------------------------------------------
   Chargement d’un incident existant dans le formulaire pour édition
-------------------------------------------------------------------------- */
async function loadIncidentIntoForm(id) {
  const incidents = await getIncidents();
  const incident = incidents.find((i) => i.id === id);
  if (!incident) {
    showToast("Incident introuvable.", "error");
    return;
  }

  const locationInput = document.getElementById("location-input");
  const typeSelect = document.getElementById("type-select");
  const descriptionArea = document.getElementById("description-textarea");

  if (locationInput) {
    locationInput.value = incident.location || "";
    if (incident.lat && incident.lng) {
      locationInput.dataset.lat = incident.lat;
      locationInput.dataset.lng = incident.lng;
    }
  }
  if (typeSelect) typeSelect.value = incident.type || "";
  if (descriptionArea) descriptionArea.value = incident.description || "";

  const form = document.getElementById("incident-form");
  if (form) form.dataset.editingId = id;

  const reportNavBtn = document.getElementById("btn-report");
  if (reportNavBtn) reportNavBtn.click();

  if (locationInput) locationInput.focus();
}

/* -------------------------------------------------------------------------
   Initialisation globale du formulaire de rapport
-------------------------------------------------------------------------- */
export function initReportForm() {
  const form = document.getElementById("incident-form");
  if (form) {
    form.addEventListener("submit", submitReport);
  }

  pickLocation();
  attachDraftListeners();
  populateDraft();

  const syncAllBtn = document.getElementById("sync-all-btn");
  if (syncAllBtn) {
    syncAllBtn.addEventListener("click", async () => {
      showToast("Synchronisation en cours…", "info");
      // Logique de synchronisation (à implémenter selon l'API backend)
    });
  }

  const clearPendingBtn = document.getElementById("clear-pending-btn");
  if (clearPendingBtn) {
    clearPendingBtn.addEventListener("click", async () => {
      if (confirm("Voulez-vous vraiment effacer tous les rapports en attente ?")) {
        const incidents = await getIncidents();
        for (const inc of incidents) {
          await deleteIncident(inc.id);
        }
        showToast("Tous les rapports en attente ont été effacés.", "success");
        await renderPendingList();
      }
    });
  }
}