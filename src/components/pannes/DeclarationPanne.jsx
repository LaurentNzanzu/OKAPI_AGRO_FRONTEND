// frontend/src/components/pannes/DeclarationPanne.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pannesService } from '../../services/pannes';
import { biensService } from '../../services/biens';
import { qrcodeService } from '../../services/qrcode';
import { useTranslation } from '../../context/LanguageContext';
import {
  AppIcon,
  PANNE_TYPE_CONFIG,
  PANNE_PRIORITE_CONFIG,
  ArrowLeftIcon,
  CheckCircleIcon,
  BellAlertIcon,
  XMarkIcon,
  QrCodeIcon,
  MagnifyingGlassIcon,
} from '../ui/icons';
// ✅ Import de html5-qrcode
import { Html5Qrcode } from 'html5-qrcode';

const DeclarationPanne = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bienIdFromUrl = searchParams.get('bien_id');

  const [bien, setBien] = useState(null);
  const [formData, setFormData] = useState({
    id_bien: bienIdFromUrl || '',
    type_panne: 'AUTRE',
    type_panne_personnalise: '',
    priorite: 'MOYENNE',
    diagnostic: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searching, setSearching] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [checkingCamera, setCheckingCamera] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scannerContainerRef = useRef(null);

  // Types de panne - uniquement MECANIQUE, ELECTRIQUE, ELECTRONIQUE, AUTRE
  const TYPES_PANNE = [
    { value: 'MECANIQUE', label: t('pannes.typeMecanique'), Icon: PANNE_TYPE_CONFIG.MECANIQUE.Icon },
    { value: 'ELECTRIQUE', label: t('pannes.typeElectrique'), Icon: PANNE_TYPE_CONFIG.ELECTRIQUE.Icon },
    { value: 'ELECTRONIQUE', label: t('pannes.typeElectronique'), Icon: PANNE_TYPE_CONFIG.ELECTRONIQUE.Icon },
    { value: 'AUTRE', label: PANNE_TYPE_CONFIG.AUTRE.label, Icon: PANNE_TYPE_CONFIG.AUTRE.Icon },
  ];

  const PRIORITES = Object.entries(PANNE_PRIORITE_CONFIG).map(([value, cfg]) => ({
    value,
    label: t(`pannes.priorite${value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}`),
    Icon: cfg.Icon,
  }));

  useEffect(() => {
    if (bienIdFromUrl) loadBien(bienIdFromUrl);
  }, [bienIdFromUrl]);

  // ✅ Vérifier la disponibilité de la caméra au chargement
  useEffect(() => {
    checkCameraAvailability();
  }, []);

  // ✅ Nettoyer le scanner à la fermeture
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  // ✅ Vérifier si la caméra est disponible
  const checkCameraAvailability = async () => {
    setCheckingCamera(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraAvailable(false);
        setCheckingCamera(false);
        return;
      }

      // Vérifier si des caméras sont disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length === 0) {
        setCameraAvailable(false);
        setScanError('Aucune caméra trouvée sur votre appareil.');
      } else {
        setCameraAvailable(true);
        setScanError(null);
      }
    } catch (err) {
      console.error('Erreur vérification caméra:', err);
      setCameraAvailable(false);
      setScanError('Impossible d\'accéder à la caméra.');
    } finally {
      setCheckingCamera(false);
    }
  };

  const loadBien = async (id) => {
    try {
      const data = await biensService.getById(id);
      setBien(data);
      setFormData(prev => ({ ...prev, id_bien: id }));
      setSearchTerm(getBienLabel(data));
      setError(null);
    } catch (err) {
      setError(t('pannes.assetNotFound'));
    }
  };

  // ✅ RECHERCHE AVEC DEBOUNCE ET AUTOCOMPLETION
  const searchBiens = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const response = await biensService.getAll({ 
        search: term, 
        limit: 10,
        skip: 0
      });
      setSearchResults(response.biens || []);
      setShowSuggestions(response.biens?.length > 0);
    } catch (err) {
      console.error('Erreur recherche:', err);
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  }, []);

  // ✅ GESTION DU CHAMP DE RECHERCHE AVEC DEBOUNCE
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    
    if (bien) {
      setBien(null);
      setFormData(prev => ({ ...prev, id_bien: '' }));
    }

    if (value.length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      searchBiens(value);
    }, 300);
  };

  // ✅ DEMANDER LA PERMISSION CAMERA AVANT D'OUVRIR LE SCANNEUR
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // Arrêter immédiatement le stream après avoir obtenu la permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Permission caméra refusée:', err);
      if (err.name === 'NotAllowedError') {
        setScanError(
          'Permission d\'accès à la caméra refusée. ' +
          'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur, ' +
          'puis cliquez sur "Réessayer".'
        );
      } else if (err.name === 'NotFoundError') {
        setScanError('Aucune caméra trouvée sur votre appareil.');
      } else {
        setScanError('Impossible d\'accéder à la caméra. Veuillez vérifier vos paramètres.');
      }
      return false;
    }
  };

  // ✅ SCAN QR CODE AVEC CAMERA
  const handleScanQR = async () => {
    if (!cameraAvailable) {
      setScanError('Aucune caméra disponible sur cet appareil.');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setCameraStarted(false);
    
    // Demander la permission avant d'ouvrir le scanner
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setIsScanning(false);
      return;
    }
    
    // Démarrer le scanner après un court délai
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  // ✅ DÉMARRER LE SCANNEUR
  const startScanner = async () => {
    const containerId = 'qr-scanner-container';
    
    try {
      // Vérifier si le conteneur existe
      const container = document.getElementById(containerId);
      if (!container) {
        setScanError("Le conteneur du scanner n'a pas été trouvé.");
        return;
      }

      // Nettoyer l'instance précédente si elle existe
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }

      // Créer une nouvelle instance du scanner
      html5QrCodeRef.current = new Html5Qrcode(containerId);

      // Configuration du scanner avec gestion d'erreur améliorée
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Démarrer la caméra
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
      );

      setCameraStarted(true);
      setScanError(null);
    } catch (err) {
      console.error("Erreur démarrage scanner:", err);
      
      let errorMsg = "Impossible d'accéder à la caméra.";
      
      if (err.message?.includes("Permission denied") || err.name === "NotAllowedError") {
        errorMsg = "Permission d'accès à la caméra refusée. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
      } else if (err.message?.includes("NotFoundError") || err.name === "NotFoundError") {
        errorMsg = "Aucune caméra trouvée sur votre appareil.";
      } else if (err.message?.includes("NotReadableError")) {
        errorMsg = "La caméra est utilisée par une autre application. Veuillez fermer les autres applications utilisant la caméra.";
      }
      
      setScanError(errorMsg);
      setCameraStarted(false);
      
      // Ne pas fermer le modal pour permettre à l'utilisateur de réessayer
    }
  };

  // ✅ SUCCÈS DU SCAN
  const onScanSuccess = async (decodedText) => {
    if (!decodedText) return;
    
    // Arrêter le scanner
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (e) {}

    setIsScanning(false);
    setCameraStarted(false);
    
    try {
      // Appel à l'API pour rechercher le bien par QR code
      const response = await qrcodeService.scan(decodedText);
      
      if (response.data?.found && response.data?.bien) {
        const bienData = response.data.bien;
        // Charger l'équipement directement sans requête croisée/supplémentaire
        setBien(bienData);
        setFormData(prev => ({ ...prev, id_bien: bienData.id_bien }));
        setSearchTerm(getBienLabel(bienData));
        setSearchResults([]);
        setShowSuggestions(false);
        setError(null);
        setScanError(null);
      } else {
        setScanError("Aucun bien trouvé avec ce QR code.");
        // Ne pas réouvrir automatiquement, l'utilisateur peut cliquer sur "Réessayer"
      }
    } catch (err) {
      console.error('Erreur scan QR:', err);
      if (err.response?.status === 404) {
        setScanError("Aucun bien trouvé avec ce QR code.");
      } else {
        setScanError("Erreur lors du scan du QR code. Veuillez réessayer.");
      }
    }
  };

  // ✅ ÉCHEC DU SCAN (ignorer les erreurs normales)
  const onScanFailure = (err) => {
    // Ignorer les erreurs normales (pas de QR détecté)
    if (err?.message?.includes('No QR code') || err?.message?.includes('NoMultiFormatReaders')) {
      return;
    }
    console.warn('Erreur scan:', err);
  };

  // ✅ FERMER LE SCANNEUR
  const closeScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (e) {
      console.warn('Erreur fermeture scanner:', e);
    }
    setIsScanning(false);
    setCameraStarted(false);
    setScanError(null);
  };

  // ✅ RÉESSAYER LE SCAN
  const retryScanner = async () => {
    setScanError(null);
    setCameraStarted(false);
    
    // Demander à nouveau la permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }
    
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  // ✅ FERMER LES SUGGESTIONS
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // ✅ SURVOL DU CHAMP POUR RÉAFFICHER LES SUGGESTIONS
  const handleFocus = () => {
    if (searchTerm.length >= 2 && searchResults.length > 0) {
      setShowSuggestions(true);
    }
  };

  const getBienLabel = (b) => {
    if (!b) return '';
    if (b.description) return b.description;
    return `${b.marque || b.fabricant || ''} ${b.modele || ''}`.trim() || `Bien #${b.id_bien}`;
  };

  const getLocalisationLabel = (b) => {
    if (!b) return '';
    if (b.localisation?.nom_localisation) return b.localisation.nom_localisation;
    if (typeof b.localisation === 'string') return b.localisation;
    return '';
  };

  const handleSelectBien = (b) => {
    setBien(b);
    setFormData(prev => ({ ...prev, id_bien: b.id_bien }));
    setSearchTerm(getBienLabel(b));
    setSearchResults([]);
    setShowSuggestions(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_bien || !formData.diagnostic || formData.diagnostic.length < 5) {
      setError(t('pannes.requiredFields'));
      return;
    }
    if (formData.type_panne === 'AUTRE' && !formData.type_panne_personnalise.trim()) {
      setError('Veuillez préciser le type de panne personnalisé.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id_bien: parseInt(formData.id_bien, 10),
        type_panne: formData.type_panne,
        priorite: formData.priorite,
        diagnostic: formData.diagnostic,
      };
      if (formData.type_panne === 'AUTRE') {
        payload.type_panne_personnalise = formData.type_panne_personnalise.trim();
      }
      await pannesService.create(payload);
      navigate('/pannes/mes-pannes');
    } catch (err) {
      setError(err.response?.data?.detail || t('pannes.declareError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 p-1" aria-label={t('common.back')}>
          <AppIcon icon={ArrowLeftIcon} size="md" />
        </button>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <AppIcon icon={BellAlertIcon} size="md" />
          {t('pannes.title')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-6 space-y-6">
        {!bien ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('pannes.assetLabel')} * 
              <span className="text-xs text-gray-400 ml-2">(Recherche par désignation ou scan QR)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                    <AppIcon icon={MagnifyingGlassIcon} size="sm" />
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tapez la désignation du bien (3 caractères min)..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    autoComplete="off"
                  />
                </div>
                
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                  </div>
                )}

                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((b) => (
                      <button
                        key={b.id_bien}
                        type="button"
                        onClick={() => handleSelectBien(b)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-slate-100">
                          {getBienLabel(b)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700">
                            {b.type_bien || 'N/A'}
                          </span>
                          <span>•</span>
                          <span>{getLocalisationLabel(b) || 'Localisation non définie'}</span>
                          {b.etat && (
                            <>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded ${
                                b.etat === 'NEUF' ? 'bg-green-100 text-green-700' :
                                b.etat === 'PANNE' ? 'bg-red-100 text-red-700' :
                                b.etat === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {b.etat}
                              </span>
                            </>
                          )}
                        </div>
                        {b.numero_serie && (
                          <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            SN: {b.numero_serie}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showSuggestions && searchTerm.length >= 2 && searchResults.length === 0 && !searching && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-4 text-center">
                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                      Aucun bien trouvé pour <span className="font-medium">"{searchTerm}"</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Essayez avec d'autres mots-clés ou utilisez le scan QR
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleScanQR}
                disabled={isScanning || checkingCamera || !cameraAvailable}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                title={!cameraAvailable ? "Caméra non disponible" : "Scanner un QR Code"}
              >
                <AppIcon icon={QrCodeIcon} size="sm" className="text-white" />
                <span className="hidden sm:inline">
                  {checkingCamera ? 'Vérification...' : 
                   isScanning ? 'Scan en cours...' : 
                   !cameraAvailable ? 'Caméra indispo' : 'Scan QR'}
                </span>
              </button>
            </div>
            {!cameraAvailable && !checkingCamera && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Caméra non disponible - Utilisez la recherche par désignation
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('pannes.assetLabel')}</p>
                <p className="font-medium text-gray-900 dark:text-slate-100 text-lg">{getBienLabel(bien)}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500 dark:text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-700">
                    {bien.type_bien || 'N/A'}
                  </span>
                  <span>•</span>
                  <span>{getLocalisationLabel(bien) || 'Localisation non définie'}</span>
                  {bien.etat && (
                    <>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded ${
                        bien.etat === 'NEUF' ? 'bg-green-100 text-green-700' :
                        bien.etat === 'PANNE' ? 'bg-red-100 text-red-700' :
                        bien.etat === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {bien.etat}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { 
                  setBien(null); 
                  setFormData(prev => ({ ...prev, id_bien: '' }));
                  setSearchTerm('');
                  setSearchResults([]);
                  setShowSuggestions(false);
                }} 
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <AppIcon icon={XMarkIcon} size="xs" />
                {t('pannes.changeAsset')}
              </button>
            </div>
          </div>
        )}

        {/* Types de panne */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.breakdownType')} *</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES_PANNE.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type_panne: type.value }))}
                className={`px-3 py-2 rounded-lg border text-sm transition-all inline-flex items-center gap-1.5 ${
                  formData.type_panne === type.value 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {type.Icon && <AppIcon icon={type.Icon} size="xs" className={formData.type_panne === type.value ? 'text-white' : ''} />}
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {formData.type_panne === 'AUTRE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type de panne personnalisé *</label>
            <input
              type="text"
              value={formData.type_panne_personnalise}
              onChange={(e) => setFormData(prev => ({ ...prev, type_panne_personnalise: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
              placeholder="Précisez le type de panne..."
            />
          </div>
        )}

        {/* Priorité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.priority')} *</label>
          <div className="flex gap-2 flex-wrap">
            {PRIORITES.map(prio => (
              <button
                key={prio.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priorite: prio.value }))}
                className={`px-4 py-2 rounded-lg border text-sm transition-all inline-flex items-center gap-1.5 ${
                  formData.priorite === prio.value 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {prio.Icon && <AppIcon icon={prio.Icon} size="xs" className={formData.priorite === prio.value ? 'text-white' : ''} />}
                {prio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pannes.diagnostic')} *</label>
          <textarea
            value={formData.diagnostic}
            onChange={(e) => setFormData(prev => ({ ...prev, diagnostic: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
            placeholder={t('pannes.diagnosticPlaceholder')}
          />
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Minimum 5 caractères
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg"
          >
            {t('common.cancel')}
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? t('pannes.declaring') : (
              <>
                <AppIcon icon={CheckCircleIcon} size="sm" className="text-white" />
                {t('pannes.declare')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAL DE SCAN QR CODE AVEC html5-qrcode */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeScanner}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Fermer le scanneur"
            >
              <AppIcon icon={XMarkIcon} size="md" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Scanner un QR Code
            </h3>

            {scanError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-lg mb-4">
                <p className="mb-2">{scanError}</p>
                <button
                  type="button"
                  onClick={retryScanner}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-lg bg-black">
                  <div
                    id="qr-scanner-container"
                    ref={scannerContainerRef}
                    className="w-full"
                    style={{ minHeight: '300px' }}
                  />
                  
                  {/* Cadre de visée */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white rounded-lg shadow-[0_0_0_100vh_rgba(0,0,0,0.5)]" />
                  </div>
                  
                  {/* Message d'information */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/80 px-3 py-1 rounded text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {cameraStarted ? 'Positionnez le QR code dans le cadre' : 'Initialisation de la caméra...'}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-xs text-gray-400 dark:text-slate-500">
                    {cameraStarted ? '✅ Caméra active' : '⏳ Démarrage...'}
                  </div>
                  <button
                    type="button"
                    onClick={closeScanner}
                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeclarationPanne;