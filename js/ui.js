// js/ui.js
// Module ES – composants UI réutilisables, notifications, thème, accessibilité

// -----------------------------------------------------------------------------
// Conteneur Toast
// -----------------------------------------------------------------------------
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
toastContainer.style.position = 'fixed';
toastContainer.style.bottom = '1rem';
toastContainer.style.right = '1rem';
toastContainer.style.display = 'flex';
toastContainer.style.flexDirection = 'column';
toastContainer.style.gap = '0.5rem';
toastContainer.style.zIndex = '9999';
document.body.appendChild(toastContainer);

/**
 * Affiche une notification toast.
 * @param {string} message - Texte à afficher.
 * @param {string} [type='info'] - 'info', 'success', 'warning', 'error'.
 * @param {number} [duration=3000] - Durée en ms avant disparition.
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

// -----------------------------------------------------------------------------
// Carte générique
// -----------------------------------------------------------------------------
/**
 * Crée une carte (card) réutilisable.
 * @param {string} title - Titre de la carte.
 * @param {HTMLElement|string} body - Contenu principal (élément ou HTML).
 * @param {Array<{text:string, onClick:Function, className?:string, ariaLabel?:string}>} [actions=[]] - Boutons d’action.
 * @returns {HTMLElement} - Élément carte.
 */
export function createCard(title, body, actions = []) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'region');

  const header = document.createElement('h3');
  header.className = 'card-header';
  header.textContent = title;
  card.appendChild(header);

  const content = document.createElement('div');
  content.className = 'card-body';
  if (typeof body === 'string') {
    content.innerHTML = body;
  } else {
    content.appendChild(body);
  }
  card.appendChild(content);

  if (actions.length) {
    const actionBar = document.createElement('div');
    actionBar.className = 'card-actions';
    actions.forEach((act) => {
const btn = document.createElement('button');
      btn.textContent = act.text;
      if (act.className) btn.className = act.className;
      if (act.ariaLabel) btn.setAttribute('aria-label', act.ariaLabel);
      btn.addEventListener('click', act.onClick);
      actionBar.appendChild(btn);
    });
    card.appendChild(actionBar);
  }
  return card;
}