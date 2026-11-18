// js/ui.js
// Module : Composants UI réutilisables, gestion du thème et accessibilité.

import { shareIncident } from "./share.js";

// ---------------------------------------------------------------------------
// État interne
// ---------------------------------------------------------------------------
let toastContainer = null;
let highContrastEnabled = false;

/**
 * Crée le conteneur des toasts s’il n’existe pas déjà.
 * @returns {HTMLElement} Le conteneur des toasts.
 */
function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
}

/**
 * Annonce un message aux lecteurs d’écran en utilisant un élément live region invisible.
 * @param {string} text – Le message à annoncer.
 */
function announceToScreenReader(text) {
  let announcer = document.getElementById("sr-announcer");
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "sr-announcer";
    announcer.className = "sr-only";
    announcer.setAttribute("aria-live", "assertive");
    announcer.setAttribute("aria-relevant", "all");
    document.body.appendChild(announcer);
  }
  announcer.textContent = text;
}

// ---------------------------------------------------------------------------
// Notifications Toast
// ---------------------------------------------------------------------------

/**
 * Affiche une notification toast.
 * @param {string} message – Le texte du message.
 * @param {"info"|"success"|"warning"|"error"} [type="info"] – Le type visuel.
 */
export function showToast(message, type = "info") {
  if (!toastContainer) {
    toastContainer = createToastContainer();
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "alert");
  toast.textContent = message;
  toastContainer.appendChild(toast);

  announceToScreenReader(message);

  requestAnimationFrame(() => {
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    }, 5000);
  });
}

// ---------------------------------------------------------------------------
// Mise à jour du compteur d’incidents
// ---------------------------------------------------------------------------

/**
 * Met à jour le nombre total d’incidents affiché dans la carte du tableau de bord.
 * @param {number} count – Le nombre total d’incidents.
 */
export function updateIncidentCount(count) {
  const elem = document.getElementById("total-incidents");
  if (elem) {
    elem.textContent = `${count} incidents signalés`;
  }
}

// ---------------------------------------------------------------------------
// Modal de détail d’un incident
// ---------------------------------------------------------------------------

/**
 * Ouvre la modal de détail d’incident avec les données fournies.
 * @param {Object} incident – L’incident à afficher.
 */
export function openIncidentDetailModal(incident) {
  const modal = document.getElementById("incident-detail-modal");
  if (!modal) return;

  const title = document.getElementById("detail-modal-title");
  const time = document.getElementById("detail-time");
  const type = document.getElementById("detail-type");
  const description = document.getElementById("detail-description");
  const photo = document.getElementById("detail-photo");
  const shareBtn = document.getElementById("share-incident-btn");
  const closeBtn = document.getElementById("close-detail-btn");

  if (title) title.textContent = incident.type || "Incident";
  if (time) time.textContent = new Date(incident.timestamp).toLocaleString();
  if (type) type.textContent = incident.type;
  if (description) description.textContent = incident.description || "Aucune description fournie.";
  
  if (photo) {
    if (incident.photo) {
      photo.src = incident.photo;
      photo.alt = "Photo de l’incident";
      photo.hidden = false;
    } else {
      photo.alt = "";
      photo.hidden = true;
    }
  }

  // Gestion du partage
  const shareHandler = () => {
    shareIncident(incident);
    closeIncidentDetailModal();
  };
  
  // Remplacement pour éviter les fuites d'écouteurs
  const newShareBtn = shareBtn.cloneNode(true);
  shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
  newShareBtn.addEventListener("click", shareHandler);

  // Gestion de la fermeture
  const closeHandler = () => closeIncidentDetailModal();
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  newCloseBtn.addEventListener("click", closeHandler);

  const escHandler = (e) => {
    if (e.key === "Escape") closeIncidentDetailModal();
  };
  document.addEventListener("keydown", escHandler);
  modal._escHandler = escHandler;

  modal.classList.remove("hidden");
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
  if (title) title.focus();
}

/**
 * Ferme la modal de détail d’incident et nettoie les écouteurs.
 */
export function closeIncidentDetailModal() {
  const modal = document.getElementById("incident-detail-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  if (modal._escHandler) {
    document.removeEventListener("keydown", modal._escHandler);
  }
}

// ---------------------------------------------------------------------------
// Thème et contraste élevé
// ---------------------------------------------------------------------------

/**
 * Initialise le bouton de bascule du contraste élevé et restaure la préférence sauvegardée.
 */
export function initThemeToggle() {
  const toggle = document.getElementById("high-contrast-toggle");
  if (!toggle) return;

  try {
    const saved = localStorage.getItem("highContrast");
    if (saved) {
      highContrastEnabled = saved === "true";
      document.documentElement.classList.toggle("high-contrast", highContrastEnabled);
    }
  } catch (e) {
    console.error("Impossible de lire la préférence de contraste élevé", e);
  }

  toggle.setAttribute("role", "switch");
  toggle.setAttribute("aria-checked", highContrastEnabled.toString());
  toggle.textContent = highContrastEnabled
    ? "Contraste élevé activé"
    : "Contraste élevé désactivé";

  const toggleMode = () => {
    highContrastEnabled = !highContrastEnabled;
    document.documentElement.classList.toggle("high-contrast", highContrastEnabled);
    try {
      localStorage.setItem("highContrast", highContrastEnabled.toString());
    } catch (e) {
      console.error("Impossible de sauvegarder la préférence de contraste élevé", e);
    }
    toggle.setAttribute("aria-checked", highContrastEnabled.toString());
    toggle.textContent = highContrastEnabled
      ? "Contraste élevé activé"
      : "Contraste élevé désactivé";
    announceToScreenReader(
      `Contraste élevé ${highContrastEnabled ? "activé" : "désactivé"}`
    );
  };

  toggle.addEventListener("click", toggleMode);
  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMode();
    }
  });
}

// ---------------------------------------------------------------------------
// Liste des rapports en attente
// ---------------------------------------------------------------------------

/**
 * Affiche la liste des rapports en attente de synchronisation.
 * @param {Array<Object>} pendingReports – Rapports avec `id`, `location`, `syncStatus`, etc.
 */
export function renderPendingList(pendingReports) {
  const list = document.getElementById("pending-list");
  if (!list) return;
  list.innerHTML = "";

  if (!pendingReports || pendingReports.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "Aucun rapport en attente.";
    emptyLi.className = "empty-list-msg";
    list.appendChild(emptyLi);
    return;
  }

  pendingReports.forEach((report) => {
    const li = document.createElement("li");
    li.className = "pending-item";
    li.setAttribute("role", "listitem");
    li.innerHTML = `
      <div class="pending-info">
        <span class="pending-status" aria-label="Statut : ${report.syncStatus || "en attente"}">●</span>
        <span class="pending-location">${report.location || "Emplacement non spécifié"}</span>
      </div>
      <div class="pending-actions">
        <button class="edit-btn" aria-label="Modifier le rapport">Modifier</button>
        <button class="delete-btn" aria-label="Supprimer le rapport">Supprimer</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Améliorations d’accessibilité
// ---------------------------------------------------------------------------

/**
 * Ajoute des améliorations d’accessibilité globales.
 */
export function initAccessibility() {
  // Assurer que les éléments interactifs ont des labels appropriés
  const buttons = document.querySelectorAll("button");
  buttons.forEach((btn) => {
    if (!btn.getAttribute("aria-label") && btn.textContent.trim() === "") {
      btn.setAttribute("aria-label", "Action");
    }
  });
}