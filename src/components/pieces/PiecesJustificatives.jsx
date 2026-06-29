import React, { useState, useEffect } from 'react';
import piecesJustificativesService from '../../services/piecesJustificatives';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  DocumentIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const PiecesJustificatives = ({ transactionType, transactionId }) => {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formData, setFormData] = useState({
    type_piece: 'ACQUISITION',
    titre: '',
    description: '',
    numero_reference: '',
    fichier_nom: '',
    fichier_url: ''
  });

  useEffect(() => {
    if (transactionType && transactionId) {
      fetchPieces();
    }
  }, [transactionType, transactionId]);

  const fetchPieces = async () => {
    setLoading(true);
    try {
      const data = await piecesJustificativesService.getByTransaction(transactionType, transactionId);
      setPieces(data || []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des pièces');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        fichier_nom: formData.fichier_nom || 'document.pdf',
        fichier_url: formData.fichier_url || '/uploads/documents/document.pdf',
        [`id_${transactionType.toLowerCase()}`]: parseInt(transactionId)
      };
      await piecesJustificativesService.create(payload);
      setShowUploadModal(false);
      setFormData({ type_piece: 'ACQUISITION', titre: '', description: '', numero_reference: '', fichier_nom: '', fichier_url: '' });
      fetchPieces();
    } catch (err) {
      alert(err.message || 'Erreur de création');
    }
  };

  const handleValidate = async (pieceId, decision) => {
    const motif = decision === 'REJETER' ? prompt('Motif du rejet :') : null;
    if (decision === 'REJETER' && !motif) return;
    try {
      await piecesJustificativesService.valider(pieceId, decision, motif);
      fetchPieces();
    } catch (err) {
      alert(err.message || 'Erreur de validation');
    }
  };

  const handleSign = async (pieceId) => {
    const signature = prompt('Saisissez votre clé ou hash de signature électronique :');
    if (!signature) return;
    try {
      await piecesJustificativesService.signer(pieceId, signature);
      fetchPieces();
    } catch (err) {
      alert(err.message || 'Erreur de signature');
    }
  };

  const getStatusBadge = (statut) => {
    const config = {
      SOUMIS: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', text: 'En attente' },
      VALIDE: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', text: 'Validé' },
      REJETE: { color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', text: 'Rejeté' },
      ARCHIVE: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', text: 'Archivé' }
    };
    const c = config[statut] || { color: 'bg-gray-500/10 text-gray-400', text: statut };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.color}`}>{c.text}</span>;
  };

  if (loading) return <div className="text-center py-4 text-gray-400">Chargement des pièces justificatives...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Pièces Justificatives</h3>
        <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)}>
          <PlusIcon className="h-4 w-4 mr-1 inline" />
          Ajouter une pièce
        </Button>
      </div>

      {error && <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg text-sm">{error}</div>}

      {pieces.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-800 rounded-xl">
          <DocumentIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Aucune pièce justificative associée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pieces.map((piece) => (
            <Card key={piece.id_piece} className="p-4 bg-gray-900 border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="h-5 w-5 text-indigo-400" />
                    <span className="font-medium text-white">{piece.titre}</span>
                    {getStatusBadge(piece.statut)}
                  </div>
                  {piece.description && <p className="text-xs text-gray-400">{piece.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                    <span>Réf: {piece.numero_reference || 'N/A'}</span>
                    <span>Type: {piece.type_piece}</span>
                  </div>
                  {piece.est_signee && (
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 pt-1">
                      <CheckCircleIcon className="h-4 w-4" /> Signée électroniquement
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {piece.statut === 'SOUMIS' && (
                    <div className="flex gap-1">
                      <button title="Valider" onClick={() => handleValidate(piece.id_piece, 'VALIDER')} className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded">
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button title="Rejeter" onClick={() => handleValidate(piece.id_piece, 'REJETER')} className="p-1 hover:bg-rose-500/20 text-rose-400 rounded">
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  {piece.statut === 'VALIDE' && !piece.est_signee && (
                    <button title="Signer" onClick={() => handleSign(piece.id_piece)} className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Ajouter une pièce justificative</h3>
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type de pièce</label>
                <select name="type_piece" value={formData.type_piece} onChange={handleInputChange} className="w-full bg-gray-800 text-white text-sm rounded-lg p-2.5 border border-gray-700">
                  <option value="ACQUISITION">Facture / Reçu d'acquisition</option>
                  <option value="FONDS">Justificatif de fonds</option>
                  <option value="DECAISSEMENT">Bon de décaissement</option>
                  <option value="AMORTISSEMENT">Justificatif d'amortissement</option>
                  <option value="CESSION">Acte de cession</option>
                  <option value="MAINTENANCE">Facture de maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Titre *</label>
                <input type="text" name="titre" required value={formData.titre} onChange={handleInputChange} placeholder="Ex: Facture Achat Matériel" className="w-full bg-gray-800 text-white text-sm rounded-lg p-2.5 border border-gray-700" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Numéro de référence</label>
                <input type="text" name="numero_reference" value={formData.numero_reference} onChange={handleInputChange} placeholder="Ex: FACT-2026-001" className="w-full bg-gray-800 text-white text-sm rounded-lg p-2.5 border border-gray-700" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">URL / Fichier</label>
                <input type="text" name="fichier_url" value={formData.fichier_url} onChange={handleInputChange} placeholder="Ex: /uploads/facture.pdf" className="w-full bg-gray-800 text-white text-sm rounded-lg p-2.5 border border-gray-700" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)}>Annuler</Button>
                <Button type="submit" variant="primary">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PiecesJustificatives;
