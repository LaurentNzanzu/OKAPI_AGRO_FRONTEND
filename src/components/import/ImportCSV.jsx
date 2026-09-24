// frontend/src/components/import/ImportCSV.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import importCsvService from '../../services/importCsv';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { ArrowUpTrayIcon, InformationCircleIcon } from '../ui/icons';

const TYPES = [
  { value: 'vehicules', label: 'Véhicules' },
  { value: 'chauffeurs', label: 'Chauffeurs' },
  { value: 'projets', label: 'Projets' },
];

const ImportCSV = () => {
  const { t } = useTranslation();
  const [typeEntite, setTypeEntite] = useState('vehicules');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier CSV');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const data = await importCsvService.upload(typeEntite, file);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur import');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppPage>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
          <ArrowUpTrayIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-slate-100">
            Import CSV
          </h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
            Importez des données depuis un fichier CSV
          </p>
        </div>
      </div>

      <Card>
        <div className="flex items-start gap-3 p-3 mb-5 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-sm text-primary-700 dark:text-primary-200">
          <InformationCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            L'import est en cours de développement. Cette interface est prête pour la Sprint 1.
            Le fichier sera traité côté backend.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Type d'entité
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((tt) => (
                <button
                  key={tt.value}
                  onClick={() => setTypeEntite(tt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    typeEntite === tt.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-surface-dark border-border-light dark:border-border-dark text-gray-700 dark:text-slate-300'
                  }`}
                >
                  {tt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Fichier CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700 dark:text-slate-300
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-primary-600 file:text-white
                hover:file:bg-primary-700
                file:cursor-pointer"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
              {error}
            </div>
          )}

          {result && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning">
              {result.message}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              isLoading={uploading}
              onClick={handleSubmit}
              disabled={!file}
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Importer
            </Button>
          </div>
        </div>
      </Card>
    </AppPage>
  );
};

export default ImportCSV;