import React from 'react';

export default function OrganisationIdentity({ organisation }) {
  if (!organisation) return null;
  const legal = [['RCCM', organisation.rccm], ['ID national', organisation.id_national], ['N° impôt', organisation.numero_impot]]
    .filter(([, value]) => value).map(([label, value]) => `${label} : ${value}`);
  const address = [organisation.adresse, organisation.ville, organisation.province, organisation.pays].filter(Boolean);
  const contacts = [organisation.telephone, organisation.email_contact, organisation.site_web].filter(Boolean);
  return (
    <div className="flex items-start gap-3 min-w-0">
      {organisation.logo_url && <img key={organisation.logo_url} src={organisation.logo_url} alt={`Logo ${organisation.nom}`}
        className="w-16 h-16 shrink-0 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />}
      <div className="min-w-0 break-words">
        <p className="text-lg font-bold text-green-800 m-0">{organisation.nom}</p>
        {organisation.sigle && <p className="text-xs">{organisation.sigle}</p>}
        {organisation.forme_juridique && <p className="text-xs">{organisation.forme_juridique}</p>}
        {legal.length > 0 && <p className="text-[10px] mt-1">{legal.join(' | ')}</p>}
        {address.length > 0 && <p className="text-[10px] mt-1">{address.join(', ')}</p>}
        {contacts.length > 0 && <p className="text-[10px] mt-1">{contacts.join(' | ')}</p>}
      </div>
    </div>
  );
}
