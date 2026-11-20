// js/emergency-quick-alert.js
import { showToast } from './ui.js';

export function emergencyQuickAlert() {
  const btn = document.querySelector('#emergency-quick-alert');
  if (!btn) {
    return;
  }

  // Étiquette accessible pour les lecteurs d’écran
  btn.setAttribute('aria-label', 'Alerte d’urgence rapide – Envoyer un message WhatsApp d’alerte immédiate');

  const handleClick = async () => {
    // Construction du message d’alerte
    const location = 'Localisation actuelle';
    const mapUrl = `${window.location.origin}/map?emergency=true`;
    const message = `ALERTE URGENTE : Menace immédiate détectée à ${location}. Consultez la carte pour plus de détails.`;
    const encodedMessage = encodeURIComponent(message);
    const encodedMapUrl = encodeURIComponent(mapUrl);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}%0A%0ACarte : ${encodedMapUrl}`;

    try {
      // Tentative d’ouverture de WhatsApp via le schéma personnalisé
      window.location.href = whatsappUrl;
    } catch (error) {
      // Solution de repli si WhatsApp n’est pas installé
      showToast('Ouverture de WhatsApp… Si rien ne s’ouvre, installez WhatsApp ou utilisez le lien ci-dessous.');
      const fallbackLink = document.createElement('a');
      fallbackLink.href = `https://wa.me/?text=${encodedMessage}%0A%0ACarte : ${encodedMapUrl}`;
      fallbackLink.target = '_blank';
      fallbackLink.textContent = 'Ouvrir WhatsApp Web';
      fallbackLink.className = 'btn btn-primary mt-2';
      alert('Si WhatsApp ne s’ouvre pas, cliquez ici pour utiliser WhatsApp Web : ' + fallbackLink.outerHTML);
    }
  };

  btn.addEventListener('click', handleClick);
}