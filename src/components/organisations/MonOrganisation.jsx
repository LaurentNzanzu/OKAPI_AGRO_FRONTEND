import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrganisation } from '../../context/OrganisationContext';
import OrganisationIdentity from './OrganisationIdentity';

const sections = [
  ['Identité', [['nom', 'Nom', 200], ['sigle', 'Sigle', 50], ['forme_juridique', 'Forme juridique', 200]]],
  ['Informations administratives', [['rccm', 'RCCM', 100], ['id_national', 'ID national', 100], ['numero_impot', 'Numéro d’impôt', 100]]],
  ['Adresse', [['adresse', 'Adresse', 500], ['ville', 'Ville', 100], ['province', 'Province', 100], ['pays', 'Pays', 100]]],
  ['Coordonnées', [['telephone', 'Téléphone', 100], ['email_contact', 'Email de contact', 200], ['site_web', 'Site web', 500]]],
];
const fields = sections.flatMap(([, entries]) => entries.map(([key]) => key));
const asForm = profil => Object.fromEntries(fields.map(key => [key, profil?.[key] ?? '']));
export function profileChanges(form, original) {
  return Object.fromEntries(fields.filter(key => form[key] !== (original?.[key] ?? ''))
    .map(key => [key, form[key].trim() || null]));
}
function errorMessage(error, fallback) {
  if (error.response?.status >= 500) return fallback;
  const detail = error.response?.data?.message || error.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
}

export default function MonOrganisation() {
  const { organisationId, hasRole } = useAuth();
  const { profil, loading, error, refresh, update, uploadLogo, deleteLogo } = useOrganisation();
  const [form, setForm] = useState({});
  const [original, setOriginal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  useEffect(() => {
    setOriginal(profil);
    setForm(asForm(profil));
  }, [profil?.id]);
  if (!organisationId || !hasRole('ADMIN')) return <p className="p-6">Vous n’êtes pas autorisé à modifier cette organisation.</p>;
  if (loading) return <p className="p-6">Chargement du profil…</p>;
  if (error || !profil) return <div className="p-6"><p role="alert">{error || 'Profil indisponible.'}</p><button onClick={refresh}>Réessayer</button></div>;

  const run = async (action, success) => {
    if (busy) return;
    setBusy(true); setFailure(''); setMessage('');
    try { await action(); setMessage(success); }
    catch (err) { setFailure(errorMessage(err, 'Impossible de mettre à jour le profil. Veuillez réessayer.')); }
    finally { setBusy(false); }
  };
  const save = e => {
    e.preventDefault();
    run(async () => {
      const result = await update(profileChanges(form, original));
      setOriginal(result); setForm(asForm(result));
    }, 'Profil de l’organisation mis à jour.');
  };
  const chooseLogo = e => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setFailure('Format de logo non pris en charge.'); return; }
    if (file.size > 2 * 1024 * 1024) { setFailure('Le logo ne doit pas dépasser 2 Mo.'); return; }
    run(() => uploadLogo(file), 'Logo mis à jour.');
  };
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Mon organisation</h1><p className="text-sm text-gray-500">Complétez ces informations à votre rythme. Seul le nom est obligatoire.</p></div>
      {message && <p role="status" className="p-3 bg-green-50 text-green-800 rounded-lg">{message}</p>}
      {failure && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{failure}</p>}
      <section className="p-4 border rounded-xl bg-white dark:bg-slate-900 space-y-3">
        <h2 className="font-semibold">Identité visuelle</h2>
        {profil.logo_url && <img src={profil.logo_url} alt="Logo actuel" className="w-24 h-24 object-contain" />}
        <label className="block text-sm">Ajouter ou remplacer le logo (PNG, JPEG, WebP — 2 Mo maximum)
          <input aria-label="Logo de l’organisation" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={chooseLogo} className="block mt-2 max-w-full" />
        </label>
        {profil.logo_url && <button disabled={busy} type="button" onClick={() => run(deleteLogo, 'Logo supprimé.')} className="text-red-600 disabled:opacity-50">Supprimer le logo</button>}
      </section>
      <form onSubmit={save} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          {sections.map(([title, entries]) => <section key={title} className="p-4 border rounded-xl bg-white dark:bg-slate-900">
            <h2 className="font-semibold mb-4">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {entries.map(([key, label, max]) => <label key={key} className="text-sm">{label}{key === 'nom' ? ' *' : ''}
                <input name={key} value={form[key] ?? ''} required={key === 'nom'} minLength={key === 'nom' ? 2 : undefined} maxLength={max}
                  type={key === 'email_contact' ? 'email' : key === 'site_web' ? 'url' : 'text'}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="mt-1 block w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-800" />
              </label>)}
            </div>
          </section>)}
          <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </fieldset>
      </form>
      <section className="p-5 border rounded-xl bg-white text-gray-800">
        <h2 className="font-semibold mb-4">Aperçu de l’en-tête des documents</h2>
        <OrganisationIdentity organisation={{ ...profil, ...form }} />
      </section>
    </div>
  );
}
