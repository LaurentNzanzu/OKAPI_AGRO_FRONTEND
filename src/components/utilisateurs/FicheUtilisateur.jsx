import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UsersIcon } from '@heroicons/react/24/outline';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import { utilisateursService } from '../../services/utilisateurs';
import { useLanguage } from '../../context/LanguageContext';
import { userErrorMessage } from './utilisateurForm';

const FicheUtilisateur = () => {
    const { id } = useParams();
    const { t, lang } = useLanguage();
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setUser(null);
        setError(null);
        utilisateursService.getById(id)
            .then((data) => { if (active) setUser(data); })
            .catch((err) => { if (active) setError(userErrorMessage(err, t('userWorkflow.loadError'))); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, t]);

    const dateLabel = (value) => value ? new Date(value).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR') : '—';
    const fields = user ? [
        ['fullName', [user.prenom, user.nom, user.post_nom].filter(Boolean).join(' ')],
        ['email', user.email], ['telephone', user.telephone || '—'], ['role', user.role_nom || '—'],
        ['status', t(user.est_actif ? 'userWorkflow.active' : 'userWorkflow.inactive')],
        ['createdAt', dateLabel(user.created_at)], ['lastLogin', dateLabel(user.last_login)],
    ] : [];

    return (
        <AppPage>
            <PageHeader title={t('userWorkflow.detailTitle')} icon={UsersIcon}
                action={<Link className="text-primary-600 hover:underline" to="/utilisateurs">{t('userWorkflow.back')}</Link>} />
            {loading && <p role="status">{t('userWorkflow.loading')}</p>}
            {error && <p role="alert" className="alert-error">{error}</p>}
            {!loading && user && <Card><dl className="grid gap-4 sm:grid-cols-2">
                {fields.map(([label, value]) => <div key={label}>
                    <dt className="text-sm text-gray-500 dark:text-slate-400">{t(`userWorkflow.${label}`)}</dt>
                    <dd className="font-medium break-words">{value}</dd>
                </div>)}
            </dl></Card>}
        </AppPage>
    );
};

export default FicheUtilisateur;
