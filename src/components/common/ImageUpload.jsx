import React, { useState, useCallback } from 'react';
import { AppIcon, PlusIcon, TrashIcon } from '../ui/icons';

const ImageUpload = ({ maxFiles = 4, maxSizeMB = 1, onChange, errors }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');

  const validateFile = useCallback((file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Type de fichier non autorisé (JPEG, PNG, GIF, WEBP uniquement)';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Taille maximale: ${maxSizeMB} Mo`;
    }
    return null;
  }, [maxSizeMB]);

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Vous ne pouvez pas ajouter plus de ${maxFiles} images.`);
      return;
    }

    const newFiles = [];
    const newPreviews = [];
    let hasError = false;

    for (const file of selectedFiles) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        hasError = true;
        break;
      }
      newFiles.push(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        newPreviews.push(ev.target.result);
        if (newPreviews.length === newFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (!hasError) {
      setFiles(prev => [...prev, ...newFiles]);
      setError('');
      onChange([...files, ...newFiles]);
    }
  }, [files, maxFiles, onChange, validateFile]);

  const handleRemove = useCallback((index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles);
  }, [files, onChange, previews]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {previews.map((src, idx) => (
          <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border-light">
            <img src={src} alt={`Prévisualisation ${idx+1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              aria-label="Supprimer l'image"
            >
              <AppIcon icon={TrashIcon} size="xs" />
            </button>
          </div>
        ))}
        {files.length < maxFiles && (
          <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border-light rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-50 dark:bg-night-hover">
            <AppIcon icon={PlusIcon} size="md" className="text-gray-400" />
            <span className="text-xs text-gray-500">Ajouter</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </label>
        )}
      </div>
      {error && <span className="text-sm text-danger">{error}</span>}
      {errors && <span className="text-sm text-danger">{errors}</span>}
      <p className="text-xs text-gray-500">Max {maxFiles} images, {maxSizeMB} Mo chacune (JPEG, PNG, GIF, WEBP)</p>
    </div>
  );
};

export default ImageUpload;