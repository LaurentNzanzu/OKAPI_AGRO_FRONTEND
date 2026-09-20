// frontend/src/components/permissions/FichePermission.jsx
import React, { useState } from 'react';
import permissionsService from '../../services/permissions';
import Button from '../ui/Button';
import Input from '../ui/Input';

const FichePermission = ({ permission = null, modules = [], onClose, onSuccess }) => {
  const isEdit = !!permission;
  const [form, setForm] = useState({
    nom: permission?.nom || '',
    description: permission?.description || '',
    module: permission?.module || '',
    action: permission?.action || '',
    actif: permission?.actif ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nom: form.nom.trim(),
        description: form.description || null,
        module: form.module.trim(),
        action: form.action.trim(),
        actif: !!form.actif,
      };
      if (isEdit) {
        // Ne pas modifier le nom (identifiant fonctionnel)
        const { nom, ...updatePayload } = payload;
        await permissionsService.update(permission.id_permission, updatePayload);
      } else {
        await permissionsService.create(payload);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          {isEdit ? 'Modifier la permission' : 'Nouvelle permission'}
        </h3>
        <div className="space-y-4">
          <Input
            label="Nom (identifiant unique)"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex: MISSION_CREATE"
            disabled={isEdit}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Module"
              value={form.module}
              onChange={(e) => setForm({ ...form, module: e.target.value })}
              placeholder="Ex: mission"
              list="modules-list"
              required
            />
            <datalist id="modules-list">
              {modules.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <Input
              label="Action"
              value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value })}
              placeholder="Ex: create"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={!!form.actif}
              onChange={(e) => setForm({ ...form, actif: e.target.checked })}
            />
            Permission active
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" isLoading={saving} onClick={handleSubmit}>
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FichePermission;