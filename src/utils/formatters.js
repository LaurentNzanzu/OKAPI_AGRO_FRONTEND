// frontend/src/utils/formatters.js
/**
 * Fonctions de formatage - Dates, prix, nombres
 * Conforme aux besoins de la Phase 2 (gestion des biens)
 */

// ============================================================================
// 📅 FORMATTAGE DES DATES
// ============================================================================

/**
 * Formate une date au format français JJ/MM/YYYY
 * @param {string|Date} date - Date à formater
 * @param {string} format - Format de sortie ('fr', 'iso', 'short')
 * @returns {string} Date formatée ou '-' si invalide
 */
export const formatDate = (date, format = 'fr', lang = 'fr') => {
  if (!date) return '-';
  
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '-';
    
    switch (format) {
      case 'fr':
        return d.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      case 'short':
        return d.toLocaleDateString(locale, {
          day: '2-digit',
          month: 'short'
        });
      case 'iso':
        return d.toISOString().split('T')[0];
      case 'full':
        return d.toLocaleDateString(locale, {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      default:
        return d.toLocaleDateString(locale);
    }
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return '-';
  }
};

/**
 * Formate une date avec l'heure
 * @param {string|Date} date 
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (date, lang = 'fr') => {
  if (!date) return '-';
  
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

/**
 * Calcule l'âge d'un bien en années depuis sa date d'acquisition
 * @param {string|Date} dateAcquisition 
 * @returns {number|null} Âge en années ou null
 */
export const calculerAgeBien = (dateAcquisition) => {
  if (!dateAcquisition) return null;
  
  try {
    const acquisition = new Date(dateAcquisition);
    const today = new Date();
    
    if (isNaN(acquisition.getTime())) return null;
    
    let age = today.getFullYear() - acquisition.getFullYear();
    const monthDiff = today.getMonth() - acquisition.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < acquisition.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  } catch {
    return null;
  }
};

// ============================================================================
// 💰 FORMATTAGE DES PRIX ET DEVISES
// ============================================================================

/**
 * Formate un prix en USD avec séparateurs de milliers
 * @param {number|string} price - Prix à formater
 * @returns {string} Prix formaté ou '-' si invalide
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '-';
  
  try {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(num)) return '-';
    
    return `${new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num)} USD`;
  } catch (error) {
    console.error('Erreur formatage prix:', error);
    return '-';
  }
};

/**
 * Formate un prix sans symbole de devise (juste le nombre)
 * @param {number|string} price 
 * @returns {string} Nombre formaté avec séparateurs
 */
export const formatNumber = (price) => {
  if (price === null || price === undefined || price === '') return '-';
  
  try {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '-';
    
    return new Intl.NumberFormat('fr-FR').format(num);
  } catch {
    return '-';
  }
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur entre 0 et 1 ou 0 et 100
 * @param {boolean} isDecimal - Si la valeur est déjà en décimal (0.15 = 15%)
 * @returns {string} Pourcentage formaté
 */
export const formatPercent = (value, isDecimal = false) => {
  if (value === null || value === undefined) return '-';
  
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    
    const percent = isDecimal ? num * 100 : num;
    return `${percent.toFixed(1)}%`;
  } catch {
    return '-';
  }
};

// ============================================================================
// 📏 FORMATTAGE DIVERS
// ============================================================================

/**
 * Formate un poids en kg avec unité
 * @param {number} weight 
 * @returns {string} Poids formaté
 */
export const formatWeight = (weight) => {
  if (!weight) return '-';
  return `${formatNumber(weight)} kg`;
};

/**
 * Formate une puissance en kW ou CV
 * @param {number} power 
 * @param {string} unit - 'kW' ou 'CV'
 * @returns {string} Puissance formatée
 */
export const formatPower = (power, unit = 'kW') => {
  if (!power) return '-';
  return `${formatNumber(power)} ${unit}`;
};

/**
 * Formate une consommation (L/100km, L/1000km, kWh)
 * @param {number} consumption 
 * @param {string} unit - Unité de consommation
 * @returns {string} Consommation formatée
 */
export const formatConsumption = (consumption, unit = 'L/100km') => {
  if (!consumption) return '-';
  return `${parseFloat(consumption).toFixed(2)} ${unit}`;
};

/**
 * Tronque un texte trop long avec des points de suspension
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string} Texte tronqué
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formate un QR code pour affichage (ex: QR-VEH-ABC123 → VEH-ABC123)
 * @param {string} qrCode 
 * @returns {string} QR code raccourci
 */
export const formatQRCode = (qrCode) => {
  if (!qrCode) return '-';
  // Affiche les 10 derniers caractères pour un affichage compact
  return qrCode.length > 12 ? '...' + qrCode.slice(-10) : qrCode;
};

/**
 * Capitalize la première lettre d'une chaîne
 * @param {string} str 
 * @returns {string} Chaîne capitalisée
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// ============================================================================
// 📦 EXPORT PAR DÉFAUT (Optionnel)
// ============================================================================

export default {
  formatDate,
  formatDateTime,
  calculerAgeBien,
  formatPrice,
  formatNumber,
  formatPercent,
  formatWeight,
  formatPower,
  formatConsumption,
  truncateText,
  formatQRCode,
  capitalize
};