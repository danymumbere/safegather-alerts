// js/emergency-quick-alert.js
import { showToast } from './ui.js';
import { shareViaWhatsApp } from './share.js';

// Sélecteur HTML valide pour le bouton d'alerte d'urgence
const EMERGENCY_BTN_SELECTOR = '#emergency-alert-btn';

// Message pré-rempli pour l'alerte d'urgence
const EMERGENCY_MESSAGE = `🚨 ALERTE URGENTE 🚨
Menace immédiate détectée lors d'un rassemblement religieux.
Veuillez intervenir immédiatement.`;

// Exporte la fonction principale pour configurer l'alerte d'urgence
export function emergencyQuickAlert() {
  const emergencyBtn = document.querySelector(EMERGENCY_BTN_SELECTOR);
  if (!emergencyBtn) return;

  // Configuration de l'accessibilité
  emergencyBtn.setAttribute('aria-label', 'Envoyer une alerte d\'urgence');
  emergencyBtn.setAttribute('role', 'button');

  // Gestionnaire d'événement pour l'alerte d'urgence
  emergencyBtn.addEventListener('click', () => {
    try {
      shareViaWhatsApp(EMERGENCY_MESSAGE);
      showToast('Alerte d\'urgence envoyée avec succès');
    } catch (error) {
      showToast('Échec de l\'envoi de l\'alerte d\'urgence');
      console.error('Erreur lors de l\'envoi de l\'alerte:', error);
    }
  });

  // Gestion du focus visible pour l'accessibilité
  emergencyBtn.addEventListener('focus', () => {
    emergencyBtn.classList.add('focus-visible');
  });

  emergencyBtn.addEventListener('blur', () => {
    emergencyBtn.classList.remove('focus-visible');
  });
}