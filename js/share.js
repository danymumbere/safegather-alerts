// js/share.js
// Module ES : génère et ouvre des intents WhatsApp/Email avec un contenu pré‑rempli pour un incident donné.
// Exporte des fonctions nommées : shareViaWhatsApp, shareViaEmail.

import { showToast } from "./ui.js";

/** URL de base de la carte pour les liens de partage */
const MAP_URL = "https://safegather.app/map";

/**
 * Construit le texte de partage à partir d'un objet incident.
 * @param {Object} incident – doit contenir au moins `location` et `type`.
 *                           `description` et `photo` sont optionnels.
 * @returns {string} Message formaté en français.
 */
function generateShareMessage(incident) {
  const { location, type, description, photo } = incident;
  let msg = `Incident signalé depuis : ${location}. Type : ${type}.`;
  if (description) {
    msg += ` Description : ${description}.`;
  }
  if (photo) {
    msg += ` Photo jointe.`;
  }
  msg += ` Voir sur la carte : ${MAP_URL}`;
  return msg;
}

/**
 * Ouvre l’intent WhatsApp avec le message pré‑rempli pour l’incident.
 * @param {Object} incident – données de l’incident à partager.
 */
export function shareViaWhatsApp(incident) {
  try {
    const message = generateShareMessage(incident);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    showToast("Ouverture de WhatsApp…");
  } catch (err) {
    console.error("Échec du partage WhatsApp :", err);
    showToast("Impossible de partager sur WhatsApp.");
  }
}

/**
 * Ouvre l’intent Email avec le sujet et le corps pré‑remplis pour l’incident.
 * @param {Object} incident – données de l’incident à partager.
 */
export function shareViaEmail(incident) {
  try {
    const message = generateShareMessage(incident);
    const subject = "Incident signalé – SafeGather";
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    showToast("Ouverture de l’application email…");
  } catch (err) {
    console.error("Échec du partage email :", err);
    showToast("Impossible de partager par email.");
  }
}