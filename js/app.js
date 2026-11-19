// js/app.js
import { initMiniMap, initFullMap, refreshMap, showIncidentDetail } from './map.js';
import { showAboutPage } from './about.js';
import { initIndexedDB, registerServiceWorker, isOnline, onOffline, onOnline, getIncidents, saveIncident, syncIncidents } from './offline.js';
import { initReportForm, saveDraft, validateForm, showReportForm, hideReportForm } from './report.js';
import { shareIncident } from './share.js';
import { initPendingQueue, updatePendingList, showPendingView, hidePendingView } from './pending.js';
import { initSettings, toggleNotifications, toggleContrast, toggleScreenReader, toggleKeyboardNav, clearLocalData } from './settings.js';
import { showToast } from './ui.js';
import { incidentGeoJSON } from './data.js';