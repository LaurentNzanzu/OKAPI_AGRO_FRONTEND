// frontend/src/hooks/useCamera.js
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export const useCamera = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const html5QrCodeRef = useRef(null);
    const elementIdRef = useRef(null);

    const startScanning = (elementId, onScanSuccess, onScanFailure) => {
        if (!elementId) {
            setError("ID de l'élément HTML manquant");
            return;
        }
        
        elementIdRef.current = elementId;
        
        // Nettoyer l'ancien scanner
        if (html5QrCodeRef.current) {
            stopScanning().catch(err => console.warn(err));
        }

        try {
            html5QrCodeRef.current = new Html5Qrcode(elementId, {
                verbose: false,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            });
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            html5QrCodeRef.current.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                (errorMessage) => {
                    if (!errorMessage || errorMessage.includes("NotFoundException")) {
                        return;
                    }
                    if (onScanFailure) {
                        onScanFailure(errorMessage);
                    }
                }
            ).then(() => {
                setIsScanning(true);
                setError(null);
            }).catch(err => {
                console.error("Erreur démarrage caméra:", err);
                let errorMsg = "Impossible d'accéder à la caméra.";
                if (err.message.includes("NotAllowedError")) {
                    errorMsg = "Permission caméra refusée. Veuillez autoriser l'accès à la caméra.";
                } else if (err.message.includes("NotFoundError")) {
                    errorMsg = "Aucune caméra trouvée sur cet appareil.";
                }
                setError(errorMsg);
                setIsScanning(false);
            });
        } catch (err) {
            console.error("Erreur initialisation scanner:", err);
            setError(err.message || "Erreur d'initialisation du scanner.");
            setIsScanning(false);
        }
    };

    const stopScanning = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Erreur arrêt caméra:", err);
            }
        }
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.warn(err));
            }
        };
    }, []);

    return { startScanning, stopScanning, isScanning, error };
};